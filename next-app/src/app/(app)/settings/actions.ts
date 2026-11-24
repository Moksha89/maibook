"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionState } from "@/lib/actions/types";
import { requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

const settingsSchema = z.object({
  title: z.string().trim().min(2).max(80),
  legalName: z.string().trim().max(120).optional(),
  supportEmail: z.union([z.literal(""), z.string().email().max(254)]).optional(),
  supportPhone: z.string().trim().max(30).optional(),
  reportFooter: z.string().trim().max(240).optional(),
  emailEnabled: z.coerce.boolean().default(false),
  smsEnabled: z.coerce.boolean().default(false),
  whatsappEnabled: z.coerce.boolean().default(false),
});

export async function updateSettingsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("settings.update");
  const raw = Object.fromEntries(formData);
  const parsed = settingsSchema.safeParse({ ...raw, emailEnabled: formData.has("emailEnabled"), smsEnabled: formData.has("smsEnabled"), whatsappEnabled: formData.has("whatsappEnabled") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, fieldErrors: parsed.error.flatten().fieldErrors };
  const session = await requireSession();
  const values = [
    ["site.branding", { title: parsed.data.title, legalName: parsed.data.legalName || "", compactInterface: true, primaryColor: "#c9952e" }],
    ["site.contact", { email: parsed.data.supportEmail || "", phone: parsed.data.supportPhone || "" }],
    ["reports.branding", { footer: parsed.data.reportFooter || "" }],
    ["integrations.email", { enabled: parsed.data.emailEnabled, provider: "sendgrid" }],
    ["integrations.sms", { enabled: parsed.data.smsEnabled, provider: "twilio" }],
    ["integrations.whatsapp", { enabled: parsed.data.whatsappEnabled, provider: "private-bridge" }],
  ] as const;
  await db.$transaction([
    ...values.map(([key, value]) => db.applicationSetting.upsert({ where: { key }, update: { value, updatedById: session.userId }, create: { key, value, updatedById: session.userId } })),
    db.auditLog.create({ data: { actorId: session.userId, action: "settings.update", entityType: "ApplicationSetting", requestId: randomUUID(), newValues: { keys: values.map(([key]) => key) } } }),
  ]);
  revalidatePath("/settings");
  return { status: "success", message: "Settings saved." };
}
