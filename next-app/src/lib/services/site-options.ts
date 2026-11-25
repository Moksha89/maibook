import { db } from "@/lib/db";

/** Sites for ID creation. Company-less groups (and unassigned sites) are included; sites in a company the user cannot access are left out. Company is no longer inherited from the group. */
export async function siteOptionsFor(companies: { id: string }[]) {
  const ids = new Set(companies.map((company) => company.id));
  const sites = await db.site.findMany({ select: { id: true, name: true, uplineGroup: { select: { companyId: true } } }, orderBy: { name: "asc" } });
  return sites.filter((site) => !site.uplineGroup?.companyId || ids.has(site.uplineGroup.companyId)).map((site) => ({ id: site.id, name: site.name }));
}

export function companyOptionsFor(companies: { id: string; name: string; agents: { agent: { id: string; name: string } }[] }[]) {
  return companies.map((company) => ({ id: company.id, name: company.name, agents: company.agents.map(({ agent }) => agent) }));
}
