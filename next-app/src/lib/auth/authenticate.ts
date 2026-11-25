import "server-only";

import { compare } from "bcryptjs";

import { db } from "@/lib/db";
import { normalizeLoginIdentifier } from "@/lib/domain/normalization";
import type { LoginInput } from "@/lib/validation/auth";
import { ACCOUNT_MAX_ATTEMPTS, accountThrottleKey, clearLoginFailures, recordLoginFailure, throttleKey, assertLoginAllowed } from "./throttle";

const DUMMY_PASSWORD_HASH = "$2b$12$wzjjvIVfIjXYobTfXQu8lecbKjWnFJsSwox7bGTa25tpZX8z7/a16";

export interface LoginContext {
  ipAddress: string;
  userAgent: string;
}

/** Indian mobiles can be typed with or without +91; match both stored forms. */
function phoneVariants(normalized: string) {
  if (/^[6-9]\d{9}$/.test(normalized)) return [normalized, `+91${normalized}`];
  const match = /^\+91([6-9]\d{9})$/.exec(normalized);
  return match ? [normalized, match[1]] : [normalized];
}

export async function authenticate(input: LoginInput, context: LoginContext) {
  const normalizedIdentifier = normalizeLoginIdentifier(input.identifier);
  const keyHash = throttleKey(normalizedIdentifier, context.ipAddress);
  const accountKeyHash = accountThrottleKey(normalizedIdentifier);
  await assertLoginAllowed(keyHash);
  await assertLoginAllowed(accountKeyHash);

  const user = await db.user.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { normalizedUsername: normalizedIdentifier },
        { normalizedEmail: normalizedIdentifier },
        { normalizedPhone: { in: phoneVariants(normalizedIdentifier) } },
      ],
    },
  });
  const passwordMatches = await compare(input.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
  const active = user?.status === "ACTIVE" && (!user.expiresAt || user.expiresAt > new Date());

  if (!user || !passwordMatches || !active) {
    await recordLoginFailure(keyHash);
    await recordLoginFailure(accountKeyHash, ACCOUNT_MAX_ATTEMPTS);
    throw new Error("INVALID_CREDENTIALS");
  }

  await Promise.all([
    clearLoginFailures(keyHash),
    clearLoginFailures(accountKeyHash),
    db.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    }),
  ]);

  return user;
}
