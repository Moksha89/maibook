import "server-only";

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

const MAX_OTP_ATTEMPTS = 5;

/** Fails closed: without AUTH_SECRET no code can be issued or verified. */
function otpSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) throw new Error("OTP_SECRET_MISSING");
  return secret;
}
function hashCode(challengeId: string, code: string) { return createHmac("sha256", otpSecret()).update(`${challengeId}:${code}`).digest("hex"); }
function sameHash(a: string, b: string) { const left = Buffer.from(a, "hex"); const right = Buffer.from(b, "hex"); return left.length === right.length && left.length > 0 && timingSafeEqual(left, right); }
async function sendSms(phone: string, body: string) {
  if (process.env.SMS_DELIVERY_ENABLED !== "true") throw new Error("OTP_DELIVERY_DISABLED");
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !from) throw new Error("OTP_DELIVERY_NOT_CONFIGURED");
  const data = new URLSearchParams({ To: phone, From: from, Body: body });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, { method: "POST", headers: { authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`, "content-type": "application/x-www-form-urlencoded" }, body: data, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error("OTP_DELIVERY_FAILED");
}

export async function createLoginChallenge(userId: string, phone: string | null) {
  if (!phone) throw new Error("OTP_PHONE_REQUIRED");
  otpSecret();
  const code = randomInt(100000, 1000000).toString();
  const challenge = await db.otpChallenge.create({ data: { userId, purpose: "LOGIN", codeHash: "pending", expiresAt: new Date(Date.now() + 5 * 60_000) } });
  await db.otpChallenge.update({ where: { id: challenge.id }, data: { codeHash: hashCode(challenge.id, code) } });
  try { await sendSms(phone, `Your Maibook verification code is ${code}. It expires in 5 minutes.`); } catch (error) { await db.otpChallenge.update({ where: { id: challenge.id }, data: { status: "EXPIRED" } }); throw error; }
  return challenge.id;
}

export async function verifyLoginChallenge(challengeId: string, code: string) {
  if (!/^[0-9a-f-]{36}$/i.test(challengeId)) throw new Error("OTP_EXPIRED");
  const expected = hashCode(challengeId, code);
  const now = new Date();
  // Atomically spend one attempt on a live challenge; concurrent guesses cannot exceed the limit.
  const spent = await db.otpChallenge.updateMany({ where: { id: challengeId, purpose: "LOGIN", status: "PENDING", expiresAt: { gt: now }, attempts: { lt: MAX_OTP_ATTEMPTS } }, data: { attempts: { increment: 1 } } });
  if (spent.count !== 1) {
    const challenge = await db.otpChallenge.findUnique({ where: { id: challengeId }, select: { status: true, expiresAt: true, attempts: true } });
    if (challenge && challenge.status === "PENDING" && challenge.expiresAt > now && challenge.attempts >= MAX_OTP_ATTEMPTS) throw new Error("OTP_ATTEMPTS_EXCEEDED");
    throw new Error("OTP_EXPIRED");
  }
  const challenge = await db.otpChallenge.findUnique({ where: { id: challengeId }, include: { user: true } });
  if (!challenge || !sameHash(expected, challenge.codeHash)) throw new Error("OTP_INVALID");
  // Single use: only one request can move PENDING -> VERIFIED.
  const verified = await db.otpChallenge.updateMany({ where: { id: challengeId, status: "PENDING" }, data: { status: "VERIFIED", verifiedAt: new Date() } });
  if (verified.count !== 1) throw new Error("OTP_EXPIRED");
  const user = challenge.user;
  if (user.deletedAt || user.status !== "ACTIVE" || (user.expiresAt && user.expiresAt <= new Date())) throw new Error("OTP_INVALID");
  return user;
}
