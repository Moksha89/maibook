"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authenticate } from "@/lib/auth/authenticate";
import { createLoginChallenge, verifyLoginChallenge } from "@/lib/auth/otp";
import { createSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation/auth";

export interface LoginState { error?: string; message?: string; challengeId?: string; maskedPhone?: string; fieldErrors?: { identifier?: string[]; password?: string[]; code?: string[] } }

async function requestContext() { const store = await headers(); return { ipAddress: store.get("x-forwarded-for")?.split(",")[0]?.trim() || "local", userAgent: store.get("user-agent") || "Unknown device" }; }
async function finishLogin(user: { id: string; maxDevices: number }, context: { ipAddress: string; userAgent: string }) { await createSession(user.id, user.maxDevices, context); await db.$transaction([db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }), db.auditLog.create({ data: { actorId: user.id, action: "auth.login", entityType: "User", entityId: user.id, ipAddress: context.ipAddress, userAgent: context.userAgent, requestId: randomUUID() } })]); }

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const context = await requestContext();
  if (formData.get("mode") === "otp") {
    const challengeId = String(formData.get("challengeId") || "");
    const code = String(formData.get("code") || "").trim();
    if (!/^\d{6}$/.test(code)) return { challengeId, error: "Enter the six-digit verification code." };
    try { const user = await verifyLoginChallenge(challengeId, code); await finishLogin(user, context); } catch (error) { const codeName = error instanceof Error ? error.message : "OTP_INVALID"; return { challengeId, error: codeName === "OTP_EXPIRED" ? "The code expired. Sign in again to request a new one." : codeName === "OTP_ATTEMPTS_EXCEEDED" ? "Too many incorrect codes. Sign in again." : "The verification code is incorrect." }; }
    redirect("/dashboard");
  }
  const parsed = loginSchema.safeParse({ identifier: formData.get("identifier"), password: formData.get("password") });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const user = await authenticate(parsed.data, context);
    if (user.otpEnabled) { const challengeId = await createLoginChallenge(user.id, user.phone); return { challengeId, maskedPhone: user.phone ? `••••${user.phone.slice(-4)}` : undefined, message: "A six-digit verification code was sent to your phone." }; }
    await finishLogin(user, context);
  } catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_CREDENTIALS";
    if (code === "LOGIN_THROTTLED") return { error: "Too many attempts. Try again in 15 minutes." };
    if (code === "DEVICE_LIMIT") return { error: "This account has reached its registered device limit." };
    if (code === "DEVICE_REVOKED") return { error: "This device has been revoked. Contact an administrator." };
    if (code.startsWith("OTP_")) return { error: "OTP delivery is unavailable. Ask an administrator to verify the SMS provider settings." };
    return { error: "The username or password is incorrect." };
  }
  redirect("/dashboard");
}
