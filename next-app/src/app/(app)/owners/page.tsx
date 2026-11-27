import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { ViewToggle } from "@/components/ui/view-toggle";
import { ActionButton } from "@/components/ui/action-button";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { pageRows } from "@/lib/paging";
import { directoryView } from "@/lib/view-preference";
import { partnerBalanceDue } from "@/lib/services/partner-entries";
import { partnerSharesForEvents } from "@/lib/services/partner-pnl";
import { EditOwnerForm, OwnerForm } from "./owner-form";
import { deleteOwnerAction } from "./actions";
import { TransferForm } from "./transfer-form";
import { balanceTone, whole } from "@/lib/format";

const money = (value: number) => Number(whole(value)).toLocaleString("en-IN");

export default async function OwnersPage({ searchParams }: { searchParams: Promise<{ view?: string; page?: string }> }) {
  await requirePermission("owners.read");
  const query = await searchParams;
  const view = await directoryView("owners", query.view);
  const session = await requireSession();
  const superAdmin = session.user.roles.some(({ role }) => role.key === "superadmin");
  const access = superAdmin ? {} : { userAccess: { some: { userId: session.userId } } };
  const [canCreate, canEdit, canDelete, companies, owners] = await Promise.all([
    hasPermission("owners.create"), hasPermission("owners.update"), hasPermission("owners.delete"),
    db.company.findMany({ where: { deletedAt: null, ...access }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.owner.findMany({ where: superAdmin ? {} : { OR: [{ createdById: session.userId }, { companyLinks: { some: { company: access } } }, { normalizedName: { in: (await db.shareholder.findMany({ where: { deletedAt: null, company: { deletedAt: null, ...access } }, distinct: ["normalizedName"], select: { normalizedName: true } })).map((row) => row.normalizedName) } }] }, include: { phoneNumbers: true, companyLinks: { select: { companyId: true } } }, orderBy: { name: "asc" } }),
  ]);
  const ownerIds = owners.map((owner) => owner.id);
  const accessibleIds = new Set(companies.map((company) => company.id));
  const histories = ownerIds.length ? await db.ownerShareHistory.findMany({ where: { ownerId: { in: ownerIds }, companyId: { in: [...accessibleIds] } }, orderBy: { effectiveFrom: "asc" } }) : [];
  const companyIds = [...new Set([...owners.flatMap((owner) => owner.companyLinks.map((link) => link.companyId)), ...histories.map((row) => row.companyId)].filter((id) => accessibleIds.has(id)))];
  const [settlements, expenses, payments] = companyIds.length || ownerIds.length ? await Promise.all([
    companyIds.length ? db.settlement.findMany({ where: { companyId: { in: companyIds }, status: "POSTED" }, select: { companyId: true, createdAt: true, amount: true, absoluteAmount: true, agentShare: true, uplineShare: true, companyShare: true } }) : Promise.resolve([]),
    companyIds.length ? db.expense.findMany({ where: { companyId: { in: companyIds }, deletedAt: null }, select: { companyId: true, createdAt: true, amount: true } }) : Promise.resolve([]),
    ownerIds.length ? db.ownerEntry.findMany({ where: { ownerId: { in: ownerIds }, deletedAt: null }, select: { ownerId: true, direction: true, amount: true } }) : Promise.resolve([]),
  ]) : [[], [], []];
  const balances = new Map<string, number>();
  for (const owner of owners) {
    const ownerCompanyIds = new Set([...owner.companyLinks.map((link) => link.companyId), ...histories.filter((row) => row.ownerId === owner.id).map((row) => row.companyId)].filter((id) => accessibleIds.has(id)));
    let profit = 0;
    for (const companyId of ownerCompanyIds) {
      const history = histories.filter((row) => row.ownerId === owner.id && row.companyId === companyId);
      profit += partnerSharesForEvents(history, settlements.filter((row) => row.companyId === companyId), expenses.filter((row) => row.companyId === companyId)).pnlShare;
    }
    balances.set(owner.id, partnerBalanceDue(profit, payments.filter((row) => row.ownerId === owner.id).map((row) => ({ direction: row.direction, amount: Number(row.amount.toString()) }))));
  }
  const paged = pageRows(owners, query.page);
  const partnerOptions = owners.map((owner) => ({ id: owner.id, name: owner.name }));
  const rowActions = (owner: (typeof owners)[number]) => canEdit || canDelete ? <div className="flex justify-end gap-1">{canEdit ? <EditOwnerForm owner={{ id: owner.id, name: owner.name, email: owner.email ?? "", phone: owner.phoneNumbers[0]?.phone ?? "" }} /> : null}{canDelete ? <ActionButton action={deleteOwnerAction} fields={{ ownerId: owner.id }} label="Delete" danger confirmMessage={`Remove ${owner.name}?`} /> : null}</div> : null;
  return <>
    <PageHeader title="Owners and business partners" actions={<><ViewToggle section="owners" view={view} />{canEdit && owners.length > 1 ? <TransferForm partners={partnerOptions} /> : null}{canCreate ? <OwnerForm companies={companies} /> : null}</>} />
    {!owners.length ? <p className="rounded-lg border bg-white px-3 py-8 text-center text-xs text-[#647386]">No owners or business partners yet.</p> : view === "grid" ? (
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{paged.rows.map((owner) => { const balance = balances.get(owner.id) ?? 0; return <div key={owner.id} className="flex flex-col rounded-lg border bg-white p-3 text-xs"><Link prefetch={false} href={`/owners/${owner.id}`} className="truncate text-sm font-bold text-[#0d1a2c] hover:text-[#2196f3]">{owner.name}</Link><p className={`mt-1.5 font-mono text-sm font-semibold ${balanceTone(balance)}`}>{money(balance)}</p><div className="mt-2 flex justify-end border-t pt-2">{rowActions(owner)}</div></div>; })}</div>
    ) : (
      <section className="overflow-hidden rounded-lg border bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[480px] text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">Name</th><th className="px-3 py-2 text-right">Balance due</th>{canEdit || canDelete ? <th className="px-3 py-2 text-right">Actions</th> : null}</tr></thead><tbody>{paged.rows.map((owner) => { const balance = balances.get(owner.id) ?? 0; return <tr key={owner.id} className="border-t hover:bg-[#fafbfc]"><td className="px-3 py-2 font-semibold"><Link prefetch={false} href={`/owners/${owner.id}`} className="hover:text-[#2196f3] hover:underline">{owner.name}</Link></td><td className={`px-3 py-2 text-right font-mono font-semibold ${balanceTone(balance)}`}>{money(balance)}</td>{canEdit || canDelete ? <td className="px-3 py-2">{rowActions(owner)}</td> : null}</tr>; })}</tbody></table></div></section>
    )}
    {owners.length ? <div className="mt-2 overflow-hidden rounded-lg border bg-white"><Pagination pathname="/owners" params={{ view }} page={paged.current} pages={paged.pages} total={paged.total} /></div> : null}
  </>;
}
