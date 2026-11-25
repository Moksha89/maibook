import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { accessibleCompanyIds, groupAccessWhere, hasPermission, requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { UplineGroupFormBody } from "../companies/[companyId]/workspace-forms";
import { deleteUplineGroupAction } from "../companies/[companyId]/actions";
import { ActionButton } from "@/components/ui/action-button";
import { FormModal } from "@/components/ui/form-modal";
import { stamp } from "@/lib/format";

export default async function UplineGroupsPage() {
  await requirePermission("uplines.read");
  const companyIds = await accessibleCompanyIds();
  const [canCreate, canEdit, canDelete, groups] = await Promise.all([
    hasPermission("uplines.create"), hasPermission("uplines.update"), hasPermission("uplines.delete"),
    db.uplineGroup.findMany({ where: groupAccessWhere(companyIds), include: { members: { include: { upline: { select: { name: true } } } }, sites: { select: { name: true }, orderBy: { name: "asc" } } }, orderBy: { name: "asc" } }),
  ]);
  return <>
    <PageHeader title="Upline groups" actions={canCreate ? <FormModal compact size="sm" trigger="Add group" title="Create upline group"><UplineGroupFormBody /></FormModal> : null} />
    <section className="overflow-hidden rounded-lg border bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[660px] text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">Group</th><th className="px-3 py-2">Created</th><th className="px-3 py-2">Members and rates</th><th className="px-3 py-2">Sites</th>{canEdit || canDelete ? <th className="px-3 py-2 text-right">Actions</th> : null}</tr></thead><tbody>{groups.map((group) => <tr key={group.id} className="border-t"><td className="px-3 py-2 font-semibold"><Link href={`/upline-groups/${group.id}`} className="text-[#815e15] hover:underline">{group.name}</Link></td><td className="whitespace-nowrap px-3 py-2 text-[#647386]">{stamp(group.createdAt)}</td><td className="px-3 py-2">{group.members.map((member) => `${member.upline.name} ${member.percentageRate.toFixed(2)}%`).join(", ") || "-"}</td><td className="px-3 py-2">{group.sites.map((site) => site.name).join(", ") || "-"}</td>{canEdit || canDelete ? <td className="px-3 py-2"><div className="flex justify-end gap-1">{canEdit ? <FormModal compact size="sm" trigger="Edit" title={`Edit ${group.name}`}><UplineGroupFormBody group={{ id: group.id, name: group.name }} /></FormModal> : null}{canDelete ? <ActionButton action={deleteUplineGroupAction} fields={{ groupId: group.id }} label="Delete" danger confirmMessage={`Delete the group ${group.name}?`} /> : null}</div></td> : null}</tr>)}</tbody></table></div>{!groups.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No upline groups yet.</p> : null}</section>
  </>;
}
