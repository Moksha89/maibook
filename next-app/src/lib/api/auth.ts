import "server-only";

import { createHash } from "node:crypto";
import { db } from "@/lib/db";

export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
function tokenHash(value: string) { return createHash("sha256").update(value).digest("hex"); }

export async function authenticateApi(request: Request, scope: string) {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) throw new ApiError(401, "A bearer token is required.");
  const raw = header.slice(7).trim();
  if (!raw) throw new ApiError(401, "A bearer token is required.");
  const token = await db.apiToken.findFirst({ where: { tokenHash: tokenHash(raw), revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }], user: { status: "ACTIVE", deletedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } }, include: { user: { include: { roles: { include: { role: true } }, companyAccess: true } } } });
  if (!token) throw new ApiError(401, "The bearer token is invalid or expired.");
  if (!token.scopes.includes("*") && !token.scopes.includes(scope)) throw new ApiError(403, `The token does not include ${scope}.`);
  const rateKey = tokenHash(`api-rate:${token.id}`);
  const current = await db.loginThrottle.findUnique({ where: { keyHash: rateKey } });
  const now = new Date();
  const freshWindow = !current || now.getTime() - current.windowStart.getTime() >= 60_000;
  if (current && !freshWindow && current.attempts >= 120) throw new ApiError(429, "API rate limit exceeded. Retry in one minute.");
  await db.$transaction([
    db.apiToken.update({ where: { id: token.id }, data: { lastUsedAt: now } }),
    db.loginThrottle.upsert({ where: { keyHash: rateKey }, create: { keyHash: rateKey, attempts: 1, windowStart: now }, update: freshWindow ? { attempts: 1, windowStart: now, lockedUntil: null } : { attempts: { increment: 1 } } }),
  ]);
  return token;
}

export function apiError(error: unknown, requestId: string) { const status = error instanceof ApiError ? error.status : 500; const message = error instanceof ApiError ? error.message : "The request could not be completed."; return Response.json({ ok: false, error: { message, requestId } }, { status, headers: { "x-request-id": requestId } }); }
export function apiData(data: unknown, requestId: string, meta?: unknown) { return Response.json({ ok: true, data, ...(meta ? { meta } : {}) }, { headers: { "x-request-id": requestId } }); }
export function pageParams(request: Request) { const search = new URL(request.url).searchParams; const page = Math.max(1, Number.parseInt(search.get("page") || "1", 10) || 1); const perPage = Math.min(100, Math.max(1, Number.parseInt(search.get("perPage") || "25", 10) || 25)); return { page, perPage, skip: (page - 1) * perPage }; }
export function requestId(request: Request) { return request.headers.get("x-request-id") || crypto.randomUUID(); }
