import "server-only";

import { compare } from "bcryptjs";

import { db } from "@/lib/db";
import { normalizeLoginIdentifier } from "@/lib/domain/normalization";
import type { LoginInput } from "@/lib/validation/auth";
import { clearLoginFailures, recordLoginFailure, throttleKey, assertLoginAllowed } from "./throttle";

const DUMMY_PASSWORD_HASH = "$2b$12$wzjjvIVfIjXYobTfXQu8lecbKjWnFJsSwox7bGTa25tpZX8z7/a16";

export interface LoginContext {
  ipAddress: string;
  userAgent: string;
}

export async function authenticate(input: LoginInput, context: LoginContext) {
  const normalizedIdentifier = normalizeLoginIdentifier(input.identifier);
  const keyHash = throttleKey(normalizedIdentifier, context.ipAddress);
  await assertLoginAllowed(keyHash);

  const user = await db.user.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { normalizedUsername: normalizedIdentifier },
        { normalizedEmail: normalizedIdentifier },
        { normalizedPhone: normalizedIdentifier },
      ],
    },
  });
  const passwordMatches = await compare(input.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
  const active = user?.status === "ACTIVE" && (!user.expiresAt || user.expiresAt > new Date());

  if (!user || !passwordMatches || !active) {
    await recordLoginFailure(keyHash);
    throw new Error("INVALID_CREDENTIALS");
  }

  await Promise.all([
    clearLoginFailures(keyHash),
    db.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    }),
  ]);

  return user;
}
