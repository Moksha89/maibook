import "server-only";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { hashToken } from "./crypto";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function throttleKey(identifier: string, ipAddress: string) {
  return hashToken(`${identifier}:${ipAddress}`);
}

export async function assertLoginAllowed(keyHash: string) {
  const throttle = await db.loginThrottle.findUnique({ where: { keyHash } });
  if (throttle?.lockedUntil && throttle.lockedUntil > new Date()) {
    throw new Error("LOGIN_THROTTLED");
  }
}

export async function recordLoginFailure(keyHash: string) {
  await db.$transaction(
    async (tx) => {
      const now = new Date();
      const existing = await tx.loginThrottle.findUnique({ where: { keyHash } });
      const windowExpired = !existing || now.getTime() - existing.windowStart.getTime() > WINDOW_MS;
      const attempts = windowExpired ? 1 : existing.attempts + 1;
      const lockedUntil = attempts >= MAX_ATTEMPTS ? new Date(now.getTime() + WINDOW_MS) : null;

      await tx.loginThrottle.upsert({
        where: { keyHash },
        update: { attempts, windowStart: windowExpired ? now : existing!.windowStart, lockedUntil },
        create: { keyHash, attempts, windowStart: now, lockedUntil },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function clearLoginFailures(keyHash: string) {
  await db.loginThrottle.deleteMany({ where: { keyHash } });
}
