import "server-only";

import { createHash, randomInt } from "node:crypto";
import { db } from "@/lib/db";

function hashCode(challengeId: string, code: string) { return createHash("sha256").update(`${process.env.AUTH_SECRET || "local-only"}:${challengeId}:${code}`).digest("hex"); }
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
  const code = randomInt(100000, 1000000).toString();
  const challenge = await db.otpChallenge.create({ data: { userId, purpose: "LOGIN", codeHash: "pending", expiresAt: new Date(Date.now() + 5 * 60_000) } });
  await db.otpChallenge.update({ where: { id: challenge.id }, data: { codeHash: hashCode(challenge.id, code) } });
  try { await sendSms(phone, `Your Maibook verification code is ${code}. It expires in 5 minutes.`); } catch (error) { await db.otpChallenge.update({ where: { id: challenge.id }, data: { status: "EXPIRED" } }); throw error; }
  return challenge.id;
}

export async function verifyLoginChallenge(challengeId: string, code: string) {
  const challenge = await db.otpChallenge.findUnique({ where: { id: challengeId }, include: { user: true } });
  if (!challenge || challenge.purpose !== "LOGIN" || challenge.status !== "PENDING" || challenge.expiresAt <= new Date()) throw new Error("OTP_EXPIRED");
  if (challenge.attempts >= 5) throw new Error("OTP_ATTEMPTS_EXCEEDED");
  if (hashCode(challenge.id, code) !== challenge.codeHash) { await db.otpChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } }); throw new Error("OTP_INVALID"); }
  await db.otpChallenge.update({ where: { id: challenge.id }, data: { status: "VERIFIED", verifiedAt: new Date() } });
  return challenge.user;
}
