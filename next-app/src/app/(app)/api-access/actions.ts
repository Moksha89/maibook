"use server";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/actions/types";
import { requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

const allowedScopes = new Set(["companies:read", "agents:read", "settlements:read"]);
export async function createApiTokenAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("api_tokens.create");
  const session = await requireSession();
  const name = String(formData.get("name") || "").trim();
  const scopes = formData.getAll("scopes").map(String).filter((scope) => allowedScopes.has(scope));
  if (name.length < 2 || name.length > 80) return { status: "error", message: "Enter a token name between 2 and 80 characters." };
  if (!scopes.length) return { status: "error", message: "Select at least one scope." };
  const raw = `ibk_${randomBytes(32).toString("base64url")}`;
  const token = await db.apiToken.create({ data: { userId: session.userId, name, scopes, tokenHash: createHash("sha256").update(raw).digest("hex") } });
  await db.auditLog.create({ data: { actorId: session.userId, action: "api_token.create", entityType: "ApiToken", entityId: token.id, requestId: randomUUID(), newValues: { name, scopes } } });
  revalidatePath("/api-access");
  return { status: "success", message: "Copy this token now. It will not be shown again.", data: { token: raw } };
}
export async function revokeApiTokenAction(formData: FormData) { await requirePermission("api_tokens.revoke"); const session = await requireSession(); const id = String(formData.get("tokenId") || ""); const token = await db.apiToken.findFirstOrThrow({ where: { id, userId: session.userId } }); await db.$transaction([db.apiToken.update({ where: { id }, data: { revokedAt: new Date() } }), db.auditLog.create({ data: { actorId: session.userId, action: "api_token.revoke", entityType: "ApiToken", entityId: token.id, requestId: randomUUID() } })]); revalidatePath("/api-access"); }
