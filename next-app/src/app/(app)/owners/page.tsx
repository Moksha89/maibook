import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { EditOwnerForm, OwnerForm } from "./owner-form";
import { deleteOwnerAction } from "./actions";
import { TransferForm } from "./transfer-form";
import { stamp } from "@/lib/format";

const toggleClass = (active: boolean) => `!size-7 !ring-0 [&_svg]:!size-3.5 ${active ? "!bg-[#2196f3] !text-white" : ""}`;

export default async function OwnersPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  await requirePermission("owners.read");
  const view = (await searchParams).view === "grid" ? "grid" : "list";
  const session = await requireSession();
  const superAdmin = session.user.roles.some(({ role }) => role.key === "superadmin");
  const access = superAdmin ? {} : { userAccess: { some: { userId: session.userId } } };
  const [canCreate, canEdit, canDelete, companies, owners] = await Promise.all([
    hasPermission("owners.create"), hasPermission("owners.update"), hasPermission("owners.delete"),
    db.company.findMany({ where: { deletedAt: null, ...access }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.owner.findMany({ where: superAdmin ? {} : { OR: [{ createdById: session.userId }, { companyLinks: { some: { company: access } } }, { normalizedName: { in: (await db.shareholder.findMany({ where: { deletedAt: null, company: { deletedAt: null, ...access } }, distinct: ["normalizedName"], select: { normalizedName: true } })).map((row) => row.normalizedName) } }] }, include: { phoneNumbers: true, companyLinks: { select: { companyId: true } } }, orderBy: { name: "asc" } }),
  ]);
  const shareholderCompanies = owners.length ? await db.shareholder.findMany({ where: { deletedAt: null, status: "ACTIVE", normalizedName: { in: owners.map((owner) => owner.normalizedName) }, company: { deletedAt: null, ...(superAdmin ? {} : access) } }, select: { normalizedName: true, companyId: true } }) : [];
  const companyCount = (owner: (typeof owners)[number]) => new Set([...owner.companyLinks.map((link) => link.companyId), ...shareholderCompanies.filter((row) => row.normalizedName === owner.normalizedName).map((row) => row.companyId)]).size;
  const partnerOptions = owners.map((owner) => ({ id: owner.id, name: owner.name }));
  const actions = <><div className="flex items-center gap-1" role="group" aria-label="View"><LinkButton href="/owners" iconOnly icon={List} aria-label="List view" title="List view" className={toggleClass(view === "list")} /><LinkButton href="/owners?view=grid" iconOnly icon={LayoutGrid} aria-label="Grid view" title="Grid view" className={toggleClass(view === "grid")} /></div>{canCreate ? <OwnerForm companies={companies} /> : null}</>;
  const rowActions = (owner: (typeof owners)[number]) => canEdit || canDelete ? <div className="flex justify-end gap-1">{canEdit ? <EditOwnerForm owner={{ id: owner.id, name: owner.name, email: owner.email ?? "", phone: owner.phoneNumbers[0]?.phone ?? "" }} /> : null}{canDelete ? <ActionButton action={deleteOwnerAction} fields={{ ownerId: owner.id }} label="Delete" danger confirmMessage={`Remove ${owner.name}?`} /> : null}</div> : null;
  const phoneOf = (owner: (typeof owners)[number]) => owner.phoneNumbers.map((phone) => phone.phone).join(", ");
  return <>
    <PageHeader title="Owners and business partners" actions={actions} />
    {!owners.length ? <p className="rounded-lg border bg-white px-3 py-8 text-center text-xs text-[#647386]">No owners or business partners yet.</p> : view === "grid" ? (
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{owners.map((owner) => <div key={owner.id} className="flex flex-col rounded-lg border bg-white p-3 text-xs transition-shadow hover:shadow-[0_4px_14px_rgba(13,26,44,0.08)]"><div className="flex items-start justify-between gap-2"><Link prefetch={false} href={`/owners/${owner.id}`} className="min-w-0 truncate text-sm font-bold text-[#0d1a2c] hover:text-[#2196f3]">{owner.name}</Link></div><div className="mt-1.5 space-y-0.5 text-[#3b4d63]"><p className="truncate">{phoneOf(owner) || "-"}</p><p className="truncate">{owner.email || "-"}</p></div><div className="mt-2 flex items-center justify-between gap-2 border-t pt-2"><Link prefetch={false} href={`/owners/${owner.id}`} className="text-[11px] font-semibold text-[#2196f3] hover:underline">{companyCount(owner)} {companyCount(owner) === 1 ? "company" : "companies"}</Link>{rowActions(owner)}</div></div>)}</div>
    ) : (
      <section className="overflow-hidden rounded-lg border bg-white">{canEdit && owners.length > 1 ? <div className="flex items-center justify-end border-b px-3 py-2"><TransferForm partners={partnerOptions} /></div> : null}<div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Created</th><th className="px-3 py-2">Phone</th><th className="px-3 py-2">Email</th>{canEdit || canDelete ? <th className="px-3 py-2 text-right">Actions</th> : null}</tr></thead><tbody>{owners.map((owner) => <tr key={owner.id} className="border-t hover:bg-[#fafbfc]"><td className="px-3 py-2 font-semibold"><Link prefetch={false} href={`/owners/${owner.id}`} className="hover:text-[#2196f3] hover:underline">{owner.name}</Link></td><td className="whitespace-nowrap px-3 py-2 text-[#647386]">{stamp(owner.createdAt)}</td><td className="px-3 py-2">{phoneOf(owner) || "-"}</td><td className="px-3 py-2">{owner.email || "-"}</td>{canEdit || canDelete ? <td className="px-3 py-2">{rowActions(owner)}</td> : null}</tr>)}</tbody></table></div></section>
    )}
  </>;
}
