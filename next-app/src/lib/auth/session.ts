import "server-only";

import { cookies } from "next/headers";
import { connection } from "next/server";
import { unauthorized } from "next/navigation";

import { db } from "@/lib/db";
import { hashToken, randomToken } from "./crypto";

const SESSION_COOKIE = "ibook_session";
const DEVICE_COOKIE = "ibook_device";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export interface SessionContext {
  ipAddress: string;
  userAgent: string;
}

export async function createSession(userId: string, maxDevices: number, context: SessionContext) {
  const cookieStore = await cookies();
  const currentDeviceToken = cookieStore.get(DEVICE_COOKIE)?.value;
  const deviceToken = currentDeviceToken ?? randomToken();
  const fingerprint = hashToken(`${deviceToken}:${context.userAgent}`);

  const device = await db.$transaction(async (tx) => {
    const existingDevice = await tx.deviceRegistration.findUnique({
      where: { userId_fingerprint: { userId, fingerprint } },
    });

    if (existingDevice?.revokedAt) throw new Error("DEVICE_REVOKED");
    if (existingDevice) {
      return tx.deviceRegistration.update({
        where: { id: existingDevice.id },
        data: { lastSeenAt: new Date() },
      });
    }

    const activeDeviceCount = await tx.deviceRegistration.count({
      where: { userId, revokedAt: null },
    });
    if (activeDeviceCount >= maxDevices) throw new Error("DEVICE_LIMIT");

    return tx.deviceRegistration.create({
      data: { userId, fingerprint, name: context.userAgent.slice(0, 160) },
    });
  });

  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await db.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      deviceId: device.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent.slice(0, 500),
      expiresAt,
    },
  });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  cookieStore.set(SESSION_COOKIE, token, { ...cookieOptions, expires: expiresAt });
  cookieStore.set(DEVICE_COOKIE, deviceToken, {
    ...cookieOptions,
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  });
}

export async function getSession() {
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  return db.session.findFirst({
    where: {
      tokenHash: hashToken(token),
      revokedAt: null,
      expiresAt: { gt: new Date() },
      user: { status: "ACTIVE", deletedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      OR: [{ deviceId: null }, { device: { is: { revokedAt: null } } }],
    },
    include: {
      user: {
        include: {
          roles: { include: { role: true } },
          permissionOverrides: { include: { permission: true } },
        },
      },
    },
  });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) unauthorized();
  return session;
}

export async function revokeCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  cookieStore.delete(SESSION_COOKIE);
}
