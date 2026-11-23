/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
async function main() {
const legacy = await mysql.createConnection({ host: process.env.LEGACY_DB_HOST || "127.0.0.1", port: Number(process.env.LEGACY_DB_PORT || 3307), user: process.env.LEGACY_DB_USER || "root", password: process.env.LEGACY_DB_PASSWORD || "localonly", database: process.env.LEGACY_DB_NAME || "ibook_legacy" });
const normalized = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
const slug = (value: string, suffix: string) => `${normalized(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "company"}-${suffix}`;
const money = (value: unknown) => new Prisma.Decimal(String(value || 0));
const split = (value: Prisma.Decimal) => value.greaterThanOrEqualTo(0) ? { credit: value, debit: new Prisma.Decimal(0) } : { credit: new Prisma.Decimal(0), debit: value.abs() };

try {
  const [legacyCompanies] = await legacy.query<any[]>("SELECT * FROM companies ORDER BY id");
  for (const company of legacyCompanies) await prisma.company.upsert({ where: { legacyId: company.company_id }, update: {}, create: { legacyId: company.company_id, name: company.name, normalizedName: `${normalized(company.name)}:${company.company_id}`, slug: slug(company.name, String(company.id)), status: company.still_active ? "ACTIVE" : "INACTIVE", createdAt: company.created_at } });
  const [legacyAgents] = await legacy.query<any[]>("SELECT * FROM partners ORDER BY id");
  for (const agent of legacyAgents) await prisma.agent.upsert({ where: { legacyId: agent.uuid }, update: {}, create: { legacyId: agent.uuid, name: agent.name, normalizedName: `${normalized(agent.name)}:${agent.uuid}`, status: agent.still_active ? "ACTIVE" : "INACTIVE" } });
  const companies = new Map((await prisma.company.findMany({ where: { legacyId: { not: null } } })).map((row) => [row.legacyId!, row.id]));
  const agents = new Map((await prisma.agent.findMany({ where: { legacyId: { not: null } } })).map((row) => [row.legacyId!, row.id]));
  const [assignments] = await legacy.query<any[]>("SELECT * FROM company_assignments ORDER BY id");
  const agentCompanies = new Map<string, Set<string>>();
  for (const assignment of assignments) { const companyId = companies.get(assignment.company_id); const agentId = agents.get(assignment.partner_id); if (!companyId || !agentId) continue; await prisma.companyAgent.upsert({ where: { companyId_agentId: { companyId, agentId } }, update: {}, create: { companyId, agentId, assignedAt: new Date(Number(assignment.timestamp) * 1000) } }); const set = agentCompanies.get(assignment.partner_id) || new Set<string>(); set.add(companyId); agentCompanies.set(assignment.partner_id, set); }
  const roles = new Map((await prisma.role.findMany()).map((role) => [role.key, role.id]));
  const companyIds = new Map(legacyCompanies.map((company) => [Number(company.id), companies.get(company.company_id)!]));
  const [legacyUsers] = await legacy.query<any[]>("SELECT * FROM users ORDER BY id");
  const importedUsers = new Map<number, string>();
  for (const user of legacyUsers) { const legacyId = String(user.user_id || user.id); const username = `${user.username}_legacy_${user.id}`; const record = await prisma.user.upsert({ where: { legacyId }, update: {}, create: { legacyId, username, normalizedUsername: normalized(username), passwordHash: await bcrypt.hash(randomUUID(), 12), displayName: user.name, status: "SUSPENDED", otpEnabled: Boolean(user.otp_auth_enabled), createdAt: user.created_at } }); importedUsers.set(Number(user.id), record.id); const roleKey = user.is_superadmin ? "superadmin" : user.is_admin ? "admin" : user.is_manager ? "manager" : "employee"; const roleId = roles.get(roleKey); if (roleId) await prisma.userRole.upsert({ where: { userId_roleId: { userId: record.id, roleId } }, update: {}, create: { userId: record.id, roleId } }); }
  const [legacyAccess] = await legacy.query<any[]>("SELECT * FROM user_company_access ORDER BY id");
  for (const access of legacyAccess) { const userId = importedUsers.get(Number(access.user_id)); const companyId = companyIds.get(Number(access.company_id)); if (userId && companyId) await prisma.companyAccess.upsert({ where: { userId_companyId: { userId, companyId } }, update: { level: access.access_level === "full" ? "FULL" : "READ" }, create: { userId, companyId, level: access.access_level === "full" ? "FULL" : "READ" } }); }
  const [transactions] = await legacy.query<any[]>("SELECT * FROM transactions ORDER BY CAST(timestamp AS UNSIGNED), id");
  const existing = new Set((await prisma.ledgerEntry.findMany({ where: { legacyId: { not: null } }, select: { legacyId: true } })).map((row) => row.legacyId!));
  const entries: Prisma.LedgerEntryCreateManyInput[] = [];
  const lines: Prisma.LedgerEntryLineCreateManyInput[] = [];
  let skipped = 0;
  for (const transaction of transactions) {
    if (existing.has(transaction.transaction_id)) continue;
    const senderId = agents.get(transaction.name_id); const receiverId = agents.get(transaction.product_id);
    const senderCompanies = agentCompanies.get(transaction.name_id); const receiverCompanies = agentCompanies.get(transaction.product_id);
    const companyId = senderCompanies && receiverCompanies ? [...senderCompanies].find((id) => receiverCompanies.has(id)) : undefined;
    if (!companyId || !senderId || !receiverId) { skipped += 1; continue; }
    const entryId = randomUUID(); const coins = money(transaction.coins); const rate = money(transaction.rate); const receiverCash = coins.mul(rate); const senderCash = receiverCash.neg();
    entries.push({ id: entryId, legacyId: transaction.transaction_id, companyId, entryType: "TRANSACTION", entryDate: new Date(Number(transaction.timestamp) * 1000), remarks: transaction.remarks || null, sourceEntity: "LegacyTransaction", deletedAt: transaction.deleted ? new Date(Number(transaction.timestamp) * 1000) : null });
    lines.push({ entryId, companyId, accountType: "AGENT", agentId: senderId, coins: coins.neg(), rate, cashValue: senderCash, ...split(senderCash), openingBalance: money(transaction.name_opening_balance), closingBalance: money(transaction.name_closing_balance), sequence: 1 }, { entryId, companyId, accountType: "AGENT", agentId: receiverId, coins, rate, cashValue: receiverCash, ...split(receiverCash), openingBalance: money(transaction.product_opening_balance), closingBalance: money(transaction.product_closing_balance), sequence: 2 });
  }
  for (let index = 0; index < entries.length; index += 500) { await prisma.$transaction([prisma.ledgerEntry.createMany({ data: entries.slice(index, index + 500), skipDuplicates: true }), prisma.ledgerEntryLine.createMany({ data: lines.slice(index * 2, (index + 500) * 2), skipDuplicates: true })]); }
  const balances = await prisma.ledgerEntryLine.findMany({ where: { entry: { deletedAt: null, legacyId: { not: null } }, agentId: { not: null } }, select: { companyId: true, agentId: true, closingBalance: true, entry: { select: { entryDate: true, createdAt: true } }, sequence: true }, orderBy: [{ entry: { entryDate: "asc" } }, { entry: { createdAt: "asc" } }, { sequence: "asc" }] });
  const latest = new Map<string, Prisma.Decimal>(); for (const line of balances) latest.set(`${line.companyId}:${line.agentId}`, line.closingBalance);
  for (const [key, currentBalance] of latest) { const [companyId, agentId] = key.split(":"); await prisma.companyAgent.update({ where: { companyId_agentId: { companyId, agentId } }, data: { currentBalance } }); }
  console.log(JSON.stringify({ companies: legacyCompanies.length, agents: legacyAgents.length, assignments: assignments.length, users: legacyUsers.length, accessRules: legacyAccess.length, importedTransactions: entries.length, skippedTransactions: skipped }, null, 2));
} finally { await legacy.end(); await prisma.$disconnect(); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
