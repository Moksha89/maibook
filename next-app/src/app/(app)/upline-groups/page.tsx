import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { ViewToggle } from "@/components/ui/view-toggle";
import { accessibleCompanyIds, groupAccessWhere, hasPermission, requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { pageRows } from "@/lib/paging";
import { directoryView } from "@/lib/view-preference";
import { UplineGroupFormBody } from "../companies/[companyId]/workspace-forms";
import { deleteUplineGroupAction } from "../companies/[companyId]/actions";
import { ActionButton } from "@/components/ui/action-button";
import { FormModal } from "@/components/ui/form-modal";

export default async function UplineGroupsPage({ searchParams }: { searchParams: Promise<{ view?: string; page?: string }> }) {
  await requirePermission("uplines.read");
  const query = await searchParams;
  const view = await directoryView("upline-groups", query.view);
  const companyIds = await accessibleCompanyIds();
  const [canCreate, canEdit, canDelete, groups] = await Promise.all([
    hasPermission("uplines.create"), hasPermission("uplines.update"), hasPermission("uplines.delete"),
    db.uplineGroup.findMany({ where: groupAccessWhere(companyIds), include: { members: { include: { upline: { select: { name: true } } } }, sites: { select: { name: true }, orderBy: { name: "asc" } } }, orderBy: { name: "asc" } }),
  ]);
  const paged = pageRows(groups, query.page);
  const actions = (group: (typeof groups)[number]) => canEdit || canDelete ? <div className="flex justify-end gap-1">{canEdit ? <FormModal compact size="sm" trigger="Edit" title={`Edit ${group.name}`}><UplineGroupFormBody group={{ id: group.id, name: group.name }} /></FormModal> : null}{canDelete ? <ActionButton action={deleteUplineGroupAction} fields={{ groupId: group.id }} label="Delete" danger confirmMessage={`Delete the group ${group.name}?`} /> : null}</div> : null;
  return <>
    <PageHeader title="Upline groups" actions={<><ViewToggle section="upline-groups" view={view} />{canCreate ? <FormModal compact size="sm" trigger="Add group" title="Create upline group"><UplineGroupFormBody /></FormModal> : null}</>} />
    {!groups.length ? <p className="rounded-lg border bg-white px-3 py-8 text-center text-xs text-[#647386]">No upline groups yet.</p> : view === "grid" ? (
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{paged.rows.map((group) => <div key={group.id} className="flex flex-col rounded-lg border bg-white p-3 text-xs"><Link href={`/upline-groups/${group.id}`} className="truncate text-sm font-bold text-[#0d1a2c] hover:text-[#2196f3]">{group.name}</Link><p className="mt-1.5 text-[#3b4d63]">{group.members.map((member) => `${member.upline.name} ${member.percentageRate.toFixed(2)}%`).join(", ") || "-"}</p><p className="mt-1 text-[#647386]">{group.sites.map((site) => site.name).join(", ") || "-"}</p><div className="mt-2 flex justify-end border-t pt-2">{actions(group)}</div></div>)}</div>
    ) : (
      <section className="overflow-hidden rounded-lg border bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">Group</th><th className="px-3 py-2">Members and rates</th><th className="px-3 py-2">Sites</th>{canEdit || canDelete ? <th className="px-3 py-2 text-right">Actions</th> : null}</tr></thead><tbody>{paged.rows.map((group) => <tr key={group.id} className="border-t"><td className="px-3 py-2 font-semibold"><Link href={`/upline-groups/${group.id}`} className="text-[#815e15] hover:underline">{group.name}</Link></td><td className="px-3 py-2">{group.members.map((member) => `${member.upline.name} ${member.percentageRate.toFixed(2)}%`).join(", ") || "-"}</td><td className="px-3 py-2">{group.sites.map((site) => site.name).join(", ") || "-"}</td>{canEdit || canDelete ? <td className="px-3 py-2">{actions(group)}</td> : null}</tr>)}</tbody></table></div></section>
    )}
    {groups.length ? <div className="mt-2 overflow-hidden rounded-lg border bg-white"><Pagination pathname="/upline-groups" params={{ view }} page={paged.current} pages={paged.pages} total={paged.total} /></div> : null}
  </>;
}
