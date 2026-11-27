import Link from "next/link";

import { ActionButton } from "@/components/ui/action-button";
import { FormModal } from "@/components/ui/form-modal";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { accessibleCompanyIds, hasPermission, requirePermission, siteAccessWhere, groupAccessWhere } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { pageRows } from "@/lib/paging";
import { deleteSiteAction } from "./actions";
import { AssignSiteGroupBody, SiteFormBody } from "./site-forms";

export default async function SitesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requirePermission("uplines.read");
  const { page } = await searchParams;
  const companyIds = await accessibleCompanyIds();
  const [canCreate, canEdit, canDelete, sites, groups] = await Promise.all([
    hasPermission("uplines.create"), hasPermission("uplines.update"), hasPermission("uplines.delete"),
    db.site.findMany({ where: siteAccessWhere(companyIds), include: { uplineGroup: { select: { id: true, name: true } } }, orderBy: { name: "asc" } }),
    db.uplineGroup.findMany({ where: groupAccessWhere(companyIds), select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const groupOptions = groups.map((group) => ({ id: group.id, label: group.name }));
  const showActions = canEdit || canDelete;
  const paged = pageRows(sites, page);
  return <>
    <PageHeader title="Sites" actions={canCreate ? <FormModal size="sm" trigger="Add site" title="Create site"><SiteFormBody groups={groupOptions} /></FormModal> : null} />
    <section className="overflow-hidden rounded-lg border bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs">
      <thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">Site</th><th className="px-3 py-2">Upline %</th><th className="whitespace-nowrap px-3 py-2">Upline group</th>{showActions ? <th className="px-3 py-2 text-right">Actions</th> : null}</tr></thead>
      <tbody>{paged.rows.map((site) => <tr key={site.id} className="border-t">
        <td className="px-3 py-2 font-semibold"><Link prefetch={false} href={`/sites/${site.id}`} className="text-[#8a6012] hover:underline">{site.name}</Link></td>
        <td className="px-3 py-2">{site.uplinePercentage.toFixed(2)}%</td>
        <td className="whitespace-nowrap px-3 py-2">{site.uplineGroup ? <Link href={`/upline-groups/${site.uplineGroup.id}`} className="font-semibold text-[#815e15] hover:underline">{site.uplineGroup.name}</Link> : "-"}</td>
        {showActions ? <td className="px-3 py-2"><div className="flex justify-end gap-1">
          {canEdit ? <FormModal compact size="sm" trigger="Assign" title={`Assign ${site.name}`}><AssignSiteGroupBody siteId={site.id} currentGroupId={site.uplineGroupId} groups={groupOptions} /></FormModal> : null}
          {canEdit ? <FormModal compact size="sm" trigger="Edit" title={`Edit ${site.name}`}><SiteFormBody site={{ id: site.id, name: site.name, uplinePercentage: site.uplinePercentage.toString(), uplineGroupId: site.uplineGroupId }} groups={groupOptions} /></FormModal> : null}
          {canDelete ? <ActionButton action={deleteSiteAction} fields={{ siteId: site.id }} label="Delete" danger confirmMessage={`Delete the site ${site.name}?`} /> : null}
        </div></td> : null}
      </tr>)}</tbody>
    </table></div>{!sites.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No sites yet.</p> : null}
    <Pagination pathname="/sites" page={paged.current} pages={paged.pages} total={paged.total} />
    </section>
  </>;
}
