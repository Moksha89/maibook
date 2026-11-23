import type { Metadata } from "next";

import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

function object(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function text(value: unknown, fallback = "") { return typeof value === "string" ? value : fallback; }
function bool(value: unknown) { return value === true; }

export default async function SettingsPage() {
  await requirePermission("settings.read");
  const settings = await db.applicationSetting.findMany();
  const map = new Map(settings.map((setting) => [setting.key, object(setting.value)]));
  const branding = map.get("site.branding") || {};
  const contact = map.get("site.contact") || {};
  const reportBranding = map.get("reports.branding") || {};
  const email = map.get("integrations.email") || {};
  const sms = map.get("integrations.sms") || {};
  const whatsapp = map.get("integrations.whatsapp") || {};
  const values = { title: text(branding.title, "iBook"), legalName: text(branding.legalName), supportEmail: text(contact.email), supportPhone: text(contact.phone), reportFooter: text(reportBranding.footer), emailEnabled: bool(email.enabled), smsEnabled: bool(sms.enabled), whatsappEnabled: bool(whatsapp.enabled) };
  const providers = [
    { name: "Email", configured: Boolean(process.env.SENDGRID_API_KEY), enabled: values.emailEnabled },
    { name: "SMS OTP", configured: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN), enabled: values.smsEnabled },
    { name: "WhatsApp", configured: Boolean(process.env.WHATSAPP_BRIDGE_URL && process.env.WHATSAPP_BRIDGE_TOKEN), enabled: values.whatsappEnabled },
  ];
  return <><PageHeader title="Settings" description="Branding, contact information, report presentation, and provider controls." /><div className="mb-3 grid gap-2 sm:grid-cols-3">{providers.map((provider) => <div key={provider.name} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2"><div><div className="text-xs font-bold">{provider.name}</div><div className="text-[10px] text-[#647386]">{provider.configured ? "Credentials configured" : "Credentials missing"}</div></div><StatusBadge tone={provider.enabled && provider.configured ? "success" : provider.enabled ? "warning" : "neutral"}>{provider.enabled ? "Enabled" : "Disabled"}</StatusBadge></div>)}</div><SettingsForm values={values} /></>;
}
