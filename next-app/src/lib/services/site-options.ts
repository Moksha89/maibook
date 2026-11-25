import { db } from "@/lib/db";

/** Sites for ID creation, each with its upline group's company when that company is accessible. */
export async function siteOptionsFor(companies: { id: string }[]) {
  const ids = new Set(companies.map((company) => company.id));
  const sites = await db.site.findMany({ select: { id: true, name: true, uplineGroup: { select: { companyId: true } } }, orderBy: { name: "asc" } });
  // Sites tied to a company the user cannot access are left out entirely.
  return sites.filter((site) => !site.uplineGroup || ids.has(site.uplineGroup.companyId)).map((site) => ({ id: site.id, name: site.name, companyId: site.uplineGroup && ids.has(site.uplineGroup.companyId) ? site.uplineGroup.companyId : null }));
}

export function companyOptionsFor(companies: { id: string; name: string; agents: { agent: { id: string; name: string } }[] }[]) {
  return companies.map((company) => ({ id: company.id, name: company.name, agents: company.agents.map(({ agent }) => agent) }));
}
