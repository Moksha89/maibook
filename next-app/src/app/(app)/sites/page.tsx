import Link from "next/link";

import { ActionButton } from "@/components/ui/action-button";
import { FormModal } from "@/components/ui/form-modal";
import { PageHeader } from "@/components/ui/page-header";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { deleteSiteAction } from "./actions";
import { AssignSiteGroupBody, SiteFormBody } from "./site-forms";
import { stamp } from "@/lib/format";

export default async function SitesPage() {
  await requirePermission("uplines.read");
  const session = await requireSession();
  const superAdmin = session.user.roles.some(({ role }) => role.key === "superadmin");
  const access = superAdmin ? {} : { userAccess: { some: { userId: session.userId } } };
  const [canCreate, canEdit, canDelete, sites, groups] = await Promise.all([
    hasPermission("uplines.create"), hasPermission("uplines.update"), hasPermission("uplines.delete"),
    db.site.findMany({ where: superAdmin ? {} : { OR: [{ uplineGroupId: null }, { uplineGroup: { company: { deletedAt: null, ...access } } }] }, include: { uplineGroup: { select: { id: true, name: true, company: { select: { name: true } } } } }, orderBy: { name: "asc" } }),
    db.uplineGroup.findMany({ where: { company: { deletedAt: null, ...access } }, select: { id: true, name: true, company: { select: { name: true } } }, orderBy: { name: "asc" } }),
  ]);
  const multiCompany = new Set(groups.map((group) => group.company.name)).size > 1;
  const groupLabel = (group: { name: string; company: { name: string } }) => multiCompany ? `${group.name} (${group.company.name})` : group.name;
  const groupOptions = groups.map((group) => ({ id: group.id, label: groupLabel(group) }));
  const showActions = canEdit || canDelete;
  return <>
    <PageHeader title="Sites" actions={canCreate ? <FormModal size="sm" trigger="Add site" title="Create site"><SiteFormBody groups={groupOptions} /></FormModal> : null} />
    <section className="overflow-hidden rounded-lg border bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[660px] text-left text-xs">
      <thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">Site</th><th className="px-3 py-2">Created</th><th className="px-3 py-2">Upline %</th><th className="whitespace-nowrap px-3 py-2">Upline group</th>{showActions ? <th className="px-3 py-2 text-right">Actions</th> : null}</tr></thead>
      <tbody>{sites.map((site) => <tr key={site.id} className="border-t">
        <td className="px-3 py-2 font-semibold"><Link prefetch={false} href={`/sites/${site.id}`} className="text-[#8a6012] hover:underline">{site.name}</Link></td><td className="whitespace-nowrap px-3 py-2 text-[#647386]">{stamp(site.createdAt)}</td>
        <td className="px-3 py-2">{site.uplinePercentage.toFixed(2)}%</td>
        <td className="whitespace-nowrap px-3 py-2">{site.uplineGroup ? <Link href={`/upline-groups/${site.uplineGroup.id}`} className="font-semibold text-[#815e15] hover:underline">{groupLabel(site.uplineGroup)}</Link> : "-"}</td>
        {showActions ? <td className="px-3 py-2"><div className="flex justify-end gap-1">
          {canEdit ? <FormModal compact size="sm" trigger="Assign" title={`Assign ${site.name}`}><AssignSiteGroupBody siteId={site.id} currentGroupId={site.uplineGroupId} groups={groupOptions} /></FormModal> : null}
          {canEdit ? <FormModal compact size="sm" trigger="Edit" title={`Edit ${site.name}`}><SiteFormBody site={{ id: site.id, name: site.name, uplinePercentage: site.uplinePercentage.toString(), uplineGroupId: site.uplineGroupId }} groups={groupOptions} /></FormModal> : null}
          {canDelete ? <ActionButton action={deleteSiteAction} fields={{ siteId: site.id }} label="Delete" danger confirmMessage={`Delete the site ${site.name}?`} /> : null}
        </div></td> : null}
      </tr>)}</tbody>
    </table></div>{!sites.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No sites yet.</p> : null}</section>
  </>;
}
