import "server-only";

import { cache } from "react";

import { db } from "@/lib/db";

export const DEFAULT_BRAND = "Maibook";

function text(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : ""; }

/** Brand name and report footer from application settings, falling back to Maibook. */
export const getBranding = cache(async () => {
  const settings = await db.applicationSetting.findMany({ where: { key: { in: ["site.branding", "reports.branding"] } } });
  const byKey = new Map(settings.map((setting) => [setting.key, setting.value as Record<string, unknown> | null]));
  const site = byKey.get("site.branding");
  const reports = byKey.get("reports.branding");
  return { title: text(site?.title) || DEFAULT_BRAND, legalName: text(site?.legalName), footer: text(reports?.footer) };
});
