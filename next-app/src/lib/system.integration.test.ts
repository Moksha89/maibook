import { createHash, randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { db } from "@/lib/db";
import { postAgentTransfer, restoreLedgerEntry, softDeleteLedgerEntry, updateAgentTransfer } from "@/lib/services/ledger";
import { postSettlement, reverseSettlement } from "@/lib/services/settlements";
import { distributeCompanyProfit } from "@/lib/services/profit-distribution";
import { distributeManualAgentAmount } from "@/lib/services/manual-distribution";
import { loadReportTable } from "@/lib/services/report-data";
import { createDatabaseBackup, resolveBackupPath, verifyDatabaseBackup } from "@/lib/services/backups";
import { createLoginChallenge } from "@/lib/auth/otp";
import { sendEmail } from "@/lib/services/email";
import { initializeWhatsAppSession, logoutWhatsAppSession } from "@/lib/services/whatsapp-bridge";
import { POST as whatsappWebhook } from "@/app/api/internal/whatsapp/webhook/route";
import { claimJob, executeJob, settleJob, UnsupportedJobError } from "@/worker/jobs";

// Explicitly opt in against a running local app with the same DATABASE_URL.
describe.skipIf(process.env.RUN_INTEGRATION_TESTS !== "true")("HTTP APIs and persisted financial workflows", () => {
  const prefix = `qa-${randomUUID()}`;
  const base = process.env.TEST_APP_URL || "http://localhost:3000";
  const companyIds = [randomUUID(), randomUUID(), randomUUID()];
  const agentIds = [randomUUID(), randomUUID()];
  const userIds = [randomUUID(), randomUUID()];
  const identifierId = randomUUID();
  const uplineId = randomUUID();
  const deviceId = randomUUID();
  const sessionToken = randomUUID();
  const token = randomUUID();
  const restrictedToken = randomUUID();
  const scopeToken = randomUUID();
  const apiTokenIds: string[] = [];
  const hash = (value: string) => createHash("sha256").update(value).digest("hex");
  const context = { actorId: userIds[0], requestId: prefix };
  const baseline: Record<string, number> = {};
  const counts = async () => ({ companies: await db.company.count(), agents: await db.agent.count(), ledger: await db.ledgerEntry.count(), users: await db.user.count(), access: await db.companyAccess.count() });
  const http = (pathname: string, authorization?: string, options: RequestInit = {}) => fetch(`${base}${pathname}`, { redirect: "manual", ...options, headers: { ...(authorization ? { authorization: `Bearer ${authorization}` } : {}), ...options.headers }, signal: AbortSignal.timeout(60_000) });
  const sessionHttp = (pathname: string) => http(pathname, undefined, { headers: { cookie: `ibook_session=${sessionToken}` } });
  const transfer = (overrides = {}) => ({ companyId: companyIds[0], senderAgentId: agentIds[0], receiverAgentId: agentIds[1], coins: "10", rate: "2", entryDate: new Date("2026-01-20"), idempotencyKey: randomUUID(), ...context, ...overrides });
  const settlement = (overrides = {}) => ({ companyId: companyIds[0], identifierId, uplineId, amount: "100", settlementDate: new Date("2026-02-10"), idempotencyKey: randomUUID(), ...context, ...overrides });
  const distribution = (overrides = {}) => ({ companyId: companyIds[0], periodStart: new Date("2026-02-01"), periodEnd: new Date("2026-02-28"), idempotencyKey: randomUUID(), ...context, ...overrides });

  beforeAll(async () => {
    Object.assign(baseline, await counts());
    const role = await db.role.findUniqueOrThrow({ where: { key: "superadmin" } });
    for (const [index, id] of userIds.entries()) await db.user.create({ data: { id, username: `${prefix}-${index}`, normalizedUsername: `${prefix}-${index}`, displayName: "Disposable integration user", passwordHash: "unusable-test-hash", ...(index === 0 ? { roles: { create: { roleId: role.id } } } : {}) } });
    for (const [index, id] of companyIds.entries()) await db.company.create({ data: { id, name: `${prefix}-${index}`, normalizedName: `${prefix}-${index}`, slug: `${prefix}-${index}` } });
    for (const [index, id] of agentIds.entries()) await db.agent.create({ data: { id, name: `${prefix}-agent-${index}`, normalizedName: `${prefix}-agent-${index}`, companies: { create: companyIds.map((companyId) => ({ companyId })) } } });
    await db.companyAccess.create({ data: { userId: userIds[1], companyId: companyIds[0], level: "READ" } });
    await db.agentIdentifier.create({ data: { id: identifierId, companyId: companyIds[0], agentId: agentIds[0], value: prefix, normalizedValue: prefix, type: "AGENT", percentageRate: 15 } });
    await db.upline.create({ data: { id: uplineId, companyId: companyIds[0], name: prefix, normalizedName: prefix, percentageRate: 5 } });
    await db.shareholder.create({ data: { companyId: companyIds[0], name: prefix, normalizedName: prefix, percentage: 100 } });
    await db.deviceRegistration.create({ data: { id: deviceId, userId: userIds[0], fingerprint: prefix } });
    await db.session.create({ data: { userId: userIds[0], deviceId, tokenHash: hash(sessionToken), expiresAt: new Date(Date.now() + 3600_000) } });
    for (const [raw, userId, scopes] of [[token, userIds[0], ["*"]], [restrictedToken, userIds[1], ["companies:read", "agents:read", "settlements:read"]], [scopeToken, userIds[0], ["companies:read"]]] as const) {
      const record = await db.apiToken.create({ data: { userId, name: prefix, tokenHash: hash(raw), scopes: [...scopes] } });
      apiTokenIds.push(record.id);
    }
  }, 60_000);

  afterAll(async () => {
    await db.$transaction(async (tx) => {
      await tx.loginThrottle.deleteMany({ where: { keyHash: { in: apiTokenIds.map((id) => hash(`api-rate:${id}`)) } } });
      await tx.reportDelivery.deleteMany({ where: { report: { companyId: { in: companyIds } } } });
      await tx.generatedReport.deleteMany({ where: { companyId: { in: companyIds } } });
      await tx.shareholderEntry.deleteMany({ where: { companyId: { in: companyIds } } });
      await tx.shareholder.deleteMany({ where: { companyId: { in: companyIds } } });
      await tx.uplineEntry.deleteMany({ where: { companyId: { in: companyIds } } });
      await tx.ledgerEntry.deleteMany({ where: { companyId: { in: companyIds } } });
      await tx.settlement.deleteMany({ where: { companyId: { in: companyIds } } });
      await tx.agentIdentifier.deleteMany({ where: { companyId: { in: companyIds } } });
      await tx.upline.deleteMany({ where: { companyId: { in: companyIds } } });
      await tx.companyAgent.deleteMany({ where: { companyId: { in: companyIds } } });
      await tx.auditLog.deleteMany({ where: { OR: [{ companyId: { in: companyIds } }, { actorId: { in: userIds } }] } });
      await tx.company.deleteMany({ where: { id: { in: companyIds } } });
      await tx.agent.deleteMany({ where: { id: { in: agentIds } } });
      await tx.user.deleteMany({ where: { id: { in: userIds } } });
    }, { timeout: 30_000 });
    expect(await counts()).toEqual(baseline);
    await db.$disconnect();
  }, 60_000);

  it.each(["companies", "agents", "settlements"])("rejects unauthenticated %s requests and unsupported writes", async (resource) => {
    expect((await http(`/api/v1/${resource}`)).status).toBe(401);
    expect((await http(`/api/v1/${resource}`, "invalid")).status).toBe(401);
    expect((await http(`/api/v1/${resource}`, token, { method: "POST" })).status).toBe(405);
    const response = await http(`/api/v1/${resource}?page=1&perPage=2`, token);
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.ok).toBe(true);
    expect(result.data.length).toBeLessThanOrEqual(2);
    expect(result.meta.perPage).toBe(2);
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("enforces scopes, revocation, expiry, and request IDs", async () => {
    expect((await http("/api/v1/agents", scopeToken)).status).toBe(403);
    const response = await http("/api/v1/companies", token, { headers: { "x-request-id": prefix } });
    expect(response.headers.get("x-request-id")).toBe(prefix);
    await db.apiToken.update({ where: { id: apiTokenIds[2] }, data: { expiresAt: new Date(0) } });
    expect((await http("/api/v1/companies", scopeToken)).status).toBe(401);
    await db.apiToken.update({ where: { id: apiTokenIds[2] }, data: { expiresAt: null, revokedAt: new Date() } });
    expect((await http("/api/v1/companies", scopeToken)).status).toBe(401);
  });

  it("isolates company and nested agent balances", async () => {
    const companies = await (await http("/api/v1/companies", restrictedToken)).json();
    expect(companies.data.map((item: { id: string }) => item.id)).toEqual([companyIds[0]]);
    const agents = await (await http("/api/v1/agents", restrictedToken)).json();
    expect(agents.data).toHaveLength(2);
    for (const agent of agents.data) expect(agent.companies.map((item: { companyId: string }) => item.companyId)).toEqual([companyIds[0]]);
  });

  it("bounds extreme pagination without a server error", async () => {
    const response = await http("/api/v1/companies?page=999999999999999999999999999999&perPage=100", token);
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data).toEqual([]);
  });

  it("rejects expired accounts and revoked devices for existing sessions", async () => {
    try {
      await db.user.update({ where: { id: userIds[0] }, data: { expiresAt: new Date(0) } });
      expect((await sessionHttp("/api/database/export?table=users")).status).toBe(401);
      expect((await http("/api/v1/companies", token)).status).toBe(401);
      await db.user.update({ where: { id: userIds[0] }, data: { expiresAt: null } });
      await db.deviceRegistration.update({ where: { id: deviceId }, data: { revokedAt: new Date() } });
      expect((await sessionHttp("/api/database/export?table=users")).status).toBe(401);
    } finally {
      await db.user.update({ where: { id: userIds[0] }, data: { expiresAt: null } });
      await db.deviceRegistration.update({ where: { id: deviceId }, data: { revokedAt: null } });
    }
  });

  it("exports every allowlisted table without password hashes or token fields", async () => {
    for (const table of ["companies", "agents", "settlements", "audit_logs", "users"]) {
      const response = await sessionHttp(`/api/database/export?table=${table}`);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/csv");
      expect(await response.text()).not.toMatch(/passwordHash|password_hash|tokenHash|token_hash/);
    }
    expect((await sessionHttp("/api/database/export?table=sessions")).status).toBe(400);
    expect((await http("/api/database/export?table=users")).status).toBe(401);
  });

  it("serves OpenAPI and rejects unauthenticated internal callbacks", async () => {
    const response = await http("/api/v1/openapi");
    expect(response.status).toBe(200);
    expect(Object.keys((await response.json()).paths)).toHaveLength(3);
    expect((await http("/api/internal/whatsapp/webhook", undefined, { method: "POST", body: "{}" })).status).toBe(401);
  });

  it("validates authenticated bridge callbacks and persists QR and connection state", async () => {
    const secret = randomUUID();
    const connection = await db.whatsAppConnection.create({ data: { name: prefix, sessionKey: randomUUID() } });
    vi.stubEnv("WHATSAPP_BRIDGE_TOKEN", secret);
    const callback = (body: string) => whatsappWebhook(new Request(`${base}/api/internal/whatsapp/webhook`, {
      method: "POST", body, headers: { authorization: `Bearer ${secret}` },
    }));
    try {
      expect((await callback("{")).status).toBe(400);
      expect((await callback(JSON.stringify({ sessionKey: 123, status: "CONNECTED" }))).status).toBe(400);
      expect((await callback(JSON.stringify({ sessionKey: randomUUID(), status: "CONNECTED" }))).status).toBe(404);
      expect((await callback(JSON.stringify({ sessionKey: connection.sessionKey, status: "QR_READY", qrCode: "fixture" }))).status).toBe(200);
      const qr = await db.whatsAppConnection.findUniqueOrThrow({ where: { id: connection.id } });
      expect(qr).toMatchObject({ status: "QR_READY", qrCode: "fixture" });
      expect(qr.qrExpiresAt?.getTime()).toBeGreaterThan(Date.now());
      expect((await callback(JSON.stringify({ sessionKey: connection.sessionKey, status: "CONNECTED" }))).status).toBe(200);
      expect(await db.whatsAppConnection.findUniqueOrThrow({ where: { id: connection.id } })).toMatchObject({ status: "CONNECTED", qrCode: null, qrExpiresAt: null });
    } finally {
      vi.unstubAllEnvs();
      await db.whatsAppConnection.delete({ where: { id: connection.id } });
    }
  });

  it("fails safely with disabled delivery and missing provider configuration", async () => {
    const fetchMock = vi.fn(async () => { throw new Error("Network access is unexpected"); });
    vi.stubGlobal("fetch", fetchMock);
    try {
      for (const provider of ["WHATSAPP", "EMAIL", "SMS"]) vi.stubEnv(`${provider}_DELIVERY_ENABLED`, "false");
      await expect(initializeWhatsAppSession(prefix)).rejects.toThrow(/disabled/);
      await expect(logoutWhatsAppSession(prefix)).rejects.toThrow(/disabled/);
      await expect(sendEmail({ to: "fixture@example.invalid", subject: prefix, text: prefix })).rejects.toThrow(/disabled/);
      await expect(createLoginChallenge(userIds[0], "+15550100000")).rejects.toThrow("OTP_DELIVERY_DISABLED");
      for (const key of ["WHATSAPP_BRIDGE_URL", "SENDGRID_API_KEY", "TWILIO_ACCOUNT_SID"]) vi.stubEnv(key, "");
      for (const provider of ["WHATSAPP", "EMAIL", "SMS"]) vi.stubEnv(`${provider}_DELIVERY_ENABLED`, "true");
      await expect(initializeWhatsAppSession(prefix)).rejects.toThrow(/not configured/);
      await expect(sendEmail({ to: "fixture@example.invalid", subject: prefix, text: prefix })).rejects.toThrow(/not configured/);
      await expect(createLoginChallenge(userIds[0], "+15550100000")).rejects.toThrow("OTP_DELIVERY_NOT_CONFIGURED");
      expect(fetchMock).not.toHaveBeenCalled();
      expect(await db.otpChallenge.count({ where: { userId: userIds[0], status: "EXPIRED" } })).toBe(2);
    } finally {
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
    }
  });

  it("claims jobs once across workers and stops retrying at the attempt limit", async () => {
    // The global worker queue must be idle before testing claims with disposable jobs.
    expect(await db.job.count({ where: { status: { in: ["PENDING", "RUNNING"] } } })).toBe(0);
    const job = await db.job.create({ data: { type: "SEND_EMAIL", maxAttempts: 2, payload: { to: "fixture@example.invalid", subject: prefix, text: prefix } } });
    vi.stubEnv("EMAIL_DELIVERY_ENABLED", "false");
    try {
      const claims = await Promise.all([claimJob(`${prefix}:1`), claimJob(`${prefix}:2`)]);
      expect(claims.filter(Boolean)).toHaveLength(1);
      const first = claims.find((claim) => claim?.id === job.id)!;
      expect(first).toMatchObject({ status: "RUNNING", attemptCount: 1 });
      await expect(executeJob(first)).rejects.toThrow(/disabled/);
      await settleJob(first, new Error("Email is disabled"));
      const pending = await db.job.findUniqueOrThrow({ where: { id: job.id } });
      expect(pending).toMatchObject({ status: "PENDING", lockedAt: null, lockedBy: null, attemptCount: 1 });
      expect(pending.runAfter.getTime()).toBeGreaterThan(Date.now());
      expect(await claimJob(prefix)).toBeNull();
      await db.job.update({ where: { id: job.id }, data: { runAfter: new Date(0) } });
      const second = (await claimJob(prefix))!;
      await settleJob(second, new Error("Email is disabled"));
      expect(await db.job.findUniqueOrThrow({ where: { id: job.id } })).toMatchObject({ status: "FAILED", attemptCount: 2 });
      const unsupported = { ...second, type: "VERIFY_BACKUP" as const };
      await expect(executeJob(unsupported)).rejects.toBeInstanceOf(UnsupportedJobError);
    } finally {
      vi.unstubAllEnvs();
      await db.job.delete({ where: { id: job.id } });
    }
  });

  it("posts transfer cash and balance directions and accepts a repeated idempotency key", async () => {
    const input = transfer();
    const first = await postAgentTransfer(input);
    const repeated = await postAgentTransfer(input);
    expect(repeated.id).toBe(first.id);
    const lines = await db.ledgerEntryLine.findMany({ where: { entryId: first.id }, orderBy: { sequence: "asc" } });
    expect(lines.map((line) => [line.coins.toString(), line.cashValue.toString(), line.closingBalance.toString()])).toEqual([["-10", "-20", "-10"], ["10", "20", "10"]]);
  });

  it("recalculates chronological balances when posting a backdated transfer", async () => {
    const entry = await postAgentTransfer(transfer({ entryDate: new Date("2026-01-10"), coins: "5" }));
    const lines = await db.ledgerEntryLine.findMany({ where: { companyId: companyIds[0], agentId: agentIds[1] }, include: { entry: true }, orderBy: { entry: { entryDate: "asc" } } });
    expect(lines.map((line) => line.closingBalance.toString())).toEqual(["5", "15"]);
    await updateAgentTransfer(entry.id, { coins: "7", rate: "3", entryDate: new Date("2026-01-10"), companyId: companyIds[0], senderAgentId: agentIds[0], receiverAgentId: agentIds[1], ...context });
    await softDeleteLedgerEntry(entry.id, context.actorId, prefix);
    expect((await db.companyAgent.findUniqueOrThrow({ where: { companyId_agentId: { companyId: companyIds[0], agentId: agentIds[1] } } })).currentBalance.toString()).toBe("10");
    await restoreLedgerEntry(entry.id, context.actorId, prefix);
    expect((await db.companyAgent.findUniqueOrThrow({ where: { companyId_agentId: { companyId: companyIds[0], agentId: agentIds[1] } } })).currentBalance.toString()).toBe("17");
  });

  it("posts fractional coin/rate products at database precision", async () => {
    const entry = await postAgentTransfer(transfer({ coins: "0.12345678", rate: "0.12345678" }));
    const line = await db.ledgerEntryLine.findFirstOrThrow({ where: { entryId: entry.id, sequence: 2 } });
    expect(line.cashValue.toFixed(8)).toBe("0.01524158");
  });

  it("rejects invalid transfers atomically", async () => {
    const before = await db.ledgerEntry.count({ where: { companyId: companyIds[0] } });
    await expect(postAgentTransfer(transfer({ senderAgentId: agentIds[1] }))).rejects.toThrow();
    await expect(postAgentTransfer(transfer({ coins: "0" }))).rejects.toThrow();
    await expect(postAgentTransfer(transfer({ rate: "-1" }))).rejects.toThrow();
    expect(await db.ledgerEntry.count({ where: { companyId: companyIds[0] } })).toBe(before);
  });

  it("posts settlement snapshots and retries without duplicate balances", async () => {
    const input = settlement();
    const first = await postSettlement(input);
    expect([first.agentShare.toString(), first.uplineShare.toString(), first.companyShare.toString()]).toEqual(["15", "5", "85"]);
    expect((await postSettlement(input)).id).toBe(first.id);
    expect((await db.agentIdentifier.findUniqueOrThrow({ where: { id: identifierId } })).currentBalance.toString()).toBe("100");
    const ledger = await db.ledgerEntry.findFirstOrThrow({ where: { sourceId: first.id } });
    await expect(softDeleteLedgerEntry(ledger.id, context.actorId, prefix)).rejects.toThrow(/settlement|reverse/i);
  });

  it("excludes manual amounts from profit and prevents overlap and duplicate payouts", async () => {
    const manual = { agentId: agentIds[0], amount: "900", entryDate: new Date("2026-02-15"), idempotencyKey: randomUUID(), ...context };
    await distributeManualAgentAmount(manual);
    expect((await distributeManualAgentAmount(manual)).duplicate).toBe(true);
    const result = await distributeCompanyProfit(distribution());
    expect(result.companyProfit?.toString()).toBe("80");
    expect((await distributeCompanyProfit(distribution())).duplicate).toBe(true);
    await expect(distributeCompanyProfit(distribution({ periodStart: new Date("2026-01-01") }))).rejects.toThrow(/already distributed/i);
  });

  it("reverses settlement effects once and omits reversed payouts from reports", async () => {
    const record = await db.settlement.findFirstOrThrow({ where: { companyId: companyIds[0], status: "POSTED" } });
    expect((await reverseSettlement(record.id, context.actorId, prefix, "QA reversal")).duplicate).toBe(false);
    expect((await reverseSettlement(record.id, context.actorId, prefix, "QA retry")).duplicate).toBe(true);
    expect((await db.upline.findUniqueOrThrow({ where: { id: uplineId } })).currentBalance.toString()).toBe("0");
    expect((await db.agentIdentifier.findUniqueOrThrow({ where: { id: identifierId } })).currentBalance.toString()).toBe("0");
    expect((await db.shareholder.findFirstOrThrow({ where: { companyId: companyIds[0] } })).currentBalance.toString()).toBe("0");
    const table = await loadReportTable("PROFIT_DISTRIBUTION", { companyId: companyIds[0], startDate: "2026-02-01", endDate: "2026-02-28" });
    expect(table.rows).toHaveLength(0);
  });

  it("preserves a one-unit manual distribution across three database balances", async () => {
    await db.companyAgent.updateMany({ where: { agentId: agentIds[1] }, data: { openingBalance: 0, currentBalance: 0 } });
    const key = randomUUID();
    await distributeManualAgentAmount({ agentId: agentIds[1], amount: "1", entryDate: new Date("2026-03-01"), idempotencyKey: key, ...context });
    const lines = await db.ledgerEntryLine.aggregate({ where: { entry: { idempotencyKey: { startsWith: key } } }, _sum: { coins: true } });
    expect(lines._sum.coins?.toString()).toBe("1");
  });

  it("returns the original manual distribution for a repeated key and rejects a changed payload", async () => {
    await db.companyAgent.updateMany({ where: { agentId: agentIds[1] }, data: { openingBalance: 0, currentBalance: 0 } });
    const key = randomUUID();
    const post = (amount: string, date: string) => distributeManualAgentAmount({ agentId: agentIds[1], amount, entryDate: new Date(date), idempotencyKey: key, ...context });
    expect((await post("3", "2026-03-02")).duplicate).toBe(false);
    expect((await post("3", "2026-03-02")).duplicate).toBe(true);
    await expect(post("4", "2026-03-02")).rejects.toThrow(/different details/);
    await expect(post("3", "2026-03-03")).rejects.toThrow(/different details/);
    const lines = await db.ledgerEntryLine.aggregate({ where: { entry: { idempotencyKey: { startsWith: key } } }, _sum: { coins: true } });
    expect(lines._sum.coins?.toString()).toBe("3");
  });

  it("downloads every report format and validates malformed identifiers", async () => {
    for (const format of ["PDF", "PNG", "CSV", "TEXT", "PRINT"] as const) {
      const report = await db.generatedReport.create({ data: { companyId: companyIds[0], type: "COMPANY_LEDGER", format, parameters: { companyId: companyIds[0], startDate: "2026-01-01", endDate: "2026-12-31" } } });
      const response = await sessionHttp(`/api/reports/${report.id}/download`);
      expect(response.status).toBe(200);
      const body = new Uint8Array(await response.arrayBuffer());
      expect(body.length).toBeGreaterThan(20);
      if (format === "PDF") expect(new TextDecoder().decode(body.slice(0, 4))).toBe("%PDF");
      if (format === "PNG") expect([...body.slice(0, 4)]).toEqual([137, 80, 78, 71]);
    }
    expect((await sessionHttp("/api/reports/invalid/download")).status).toBe(404);
    expect((await sessionHttp("/api/backups/invalid/download")).status).toBe(404);
  }, 120_000);

  it("creates, verifies, and downloads a database backup with the recorded checksum", async () => {
    try {
      const backupId = await createDatabaseBackup(userIds[0]);
      await verifyDatabaseBackup(backupId, userIds[0]);
      const backup = await db.backup.findUniqueOrThrow({ where: { id: backupId } });
      expect(backup.verifiedAt).toBeInstanceOf(Date);
      const response = await sessionHttp(`/api/backups/${backupId}/download`);
      expect(response.status).toBe(200);
      const body = Buffer.from(await response.arrayBuffer());
      expect(body.subarray(0, 5).toString()).toBe("PGDMP");
      expect(createHash("sha256").update(body).digest("hex")).toBe(backup.checksum);
    } finally {
      const backups = await db.backup.findMany({ where: { requestedById: userIds[0] } });
      for (const backup of backups) if (backup.storageKey) await rm(resolveBackupPath(backup.storageKey), { force: true });
      await db.backup.deleteMany({ where: { requestedById: userIds[0] } });
    }
  }, 120_000);

  it("does not overdraw rate limits under concurrent requests", async () => {
    const keyHash = hash(`api-rate:${apiTokenIds[0]}`);
    await db.loginThrottle.upsert({ where: { keyHash }, create: { keyHash, attempts: 119 }, update: { attempts: 119, windowStart: new Date() } });
    const responses = await Promise.all(Array.from({ length: 6 }, () => http("/api/v1/companies", token)));
    expect(responses.filter((response) => response.status === 200)).toHaveLength(1);
    expect(responses.filter((response) => response.status === 429)).toHaveLength(5);
    await db.loginThrottle.delete({ where: { keyHash } });
  });
});
