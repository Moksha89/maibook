import { ActionButton } from "@/components/ui/action-button";
import { hasPermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { stamp } from "@/lib/format";
import { restoreAgentAction, restoreCompanyAction, restoreIdentifierAction } from "./actions";

type DeletedKind = "agent" | "company" | "id";
type Row = { id: string; kind: DeletedKind; typeLabel: string; name: string; detail: string; deletedAt: Date | null; deletedById: string | null; canRestore: boolean };

function joinDetail(parts: Array<string | null | undefined>) {
  return parts.filter((part): part is string => Boolean(part && part.trim())).join(" · ") || "-";
}

/** Lists every soft-deleted agent, company and ID the user can see, with a Restore action when they have permission. */
export async function DeletedTab() {
  const session = await requireSession();
  const superAdmin = session.user.roles.some(({ role }) => role.key === "superadmin");
  const accessFilter = superAdmin ? {} : { userAccess: { some: { userId: session.userId } } };
  const [canRestoreAgents, canRestoreCompanies, canRestoreIds, fullAccess, agents, companies, identifiers] = await Promise.all([
    hasPermission("agents.delete"),
    hasPermission("companies.delete"),
    hasPermission("identifiers.delete"),
    superAdmin ? Promise.resolve(null) : db.companyAccess.findMany({ where: { userId: session.userId, level: "FULL" }, select: { companyId: true } }),
    db.agent.findMany({
      where: { deletedAt: { not: null }, ...(superAdmin ? {} : { companies: { some: { company: accessFilter } } }) },
      select: { id: true, name: true, phone: true, email: true, deletedAt: true, deletedById: true, companies: { include: { company: { select: { id: true, name: true } } }, orderBy: { company: { name: "asc" } } } },
      orderBy: { deletedAt: "desc" },
      take: 200,
    }),
    db.company.findMany({
      where: { deletedAt: { not: null }, ...(superAdmin ? {} : { userAccess: { some: { userId: session.userId } } }) },
      select: { id: true, name: true, notes: true, code: true, deletedAt: true, deletedById: true },
      orderBy: { deletedAt: "desc" },
      take: 200,
    }),
    db.agentIdentifier.findMany({
      where: { deletedAt: { not: null }, ...(superAdmin ? {} : { OR: [{ company: accessFilter }, { companyId: null }] }) },
      select: { id: true, value: true, companyId: true, deletedAt: true, deletedById: true, company: { select: { name: true, deletedAt: true } }, agent: { select: { name: true, deletedAt: true } }, site: { select: { name: true } } },
      orderBy: { deletedAt: "desc" },
      take: 200,
    }),
  ]);
  const fullIds = fullAccess ? new Set(fullAccess.map((row) => row.companyId)) : null;
  const companyIds = companies.map((company) => company.id);
  const logs = companyIds.length ? await db.auditLog.findMany({ where: { action: "company.delete", entityType: "Company", OR: [{ entityId: { in: companyIds } }, { companyId: { in: companyIds } }] }, orderBy: { createdAt: "desc" }, select: { entityId: true, companyId: true, oldValues: true } }) : [];
  const codes = new Map<string, string>();
  for (const log of logs) {
    const id = log.entityId || log.companyId;
    if (!id || codes.has(id) || !log.oldValues || typeof log.oldValues !== "object" || Array.isArray(log.oldValues)) continue;
    const code = (log.oldValues as { code?: unknown }).code;
    if (typeof code === "string" && code.trim()) codes.set(id, code);
  }
  const rows: Row[] = [
    ...agents.map((agent) => ({
      id: agent.id,
      kind: "agent" as const,
      typeLabel: "Agent",
      name: agent.name,
      detail: joinDetail([[agent.phone, agent.email].filter(Boolean).join(" · "), agent.companies.map((link) => link.company.name).join(", ")]),
      deletedAt: agent.deletedAt,
      deletedById: agent.deletedById,
      canRestore: canRestoreAgents && (superAdmin || agent.companies.some((link) => fullIds?.has(link.companyId))),
    })),
    ...companies.map((company) => ({
      id: company.id,
      kind: "company" as const,
      typeLabel: "Company",
      name: company.name,
      detail: joinDetail([company.code || codes.get(company.id), company.notes]),
      deletedAt: company.deletedAt,
      deletedById: company.deletedById,
      canRestore: canRestoreCompanies && (superAdmin || Boolean(fullIds?.has(company.id))),
    })),
    ...identifiers.map((identifier) => ({
      id: identifier.id,
      kind: "id" as const,
      typeLabel: "ID",
      name: identifier.value,
      detail: joinDetail([
        identifier.company ? identifier.company.name + (identifier.company.deletedAt ? " (deleted)" : "") : null,
        identifier.agent ? identifier.agent.name + (identifier.agent.deletedAt ? " (deleted)" : "") : null,
        identifier.site?.name,
      ]),
      deletedAt: identifier.deletedAt,
      deletedById: identifier.deletedById,
      canRestore: canRestoreIds && (superAdmin || !identifier.companyId || Boolean(fullIds?.has(identifier.companyId))),
    })),
  ].sort((a, b) => (b.deletedAt?.getTime() ?? 0) - (a.deletedAt?.getTime() ?? 0));
  const userIds = [...new Set(rows.map((row) => row.deletedById).filter((id): id is string => Boolean(id)))];
  const users = userIds.length ? await db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, displayName: true } }) : [];
  const names = new Map(users.map((user) => [user.id, user.displayName]));

  return (
    <section className="overflow-hidden rounded-lg border bg-white">
      <div className="border-b px-3 py-2"><h2 className="text-sm font-bold">Deleted ({rows.length})</h2></div>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="bg-[#ffeebb] text-[#152235]">
              <tr>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Details</th>
                <th className="px-3 py-2">Deleted on</th>
                <th className="px-3 py-2">Deleted by</th>
                <th className="px-3 py-2 text-right">Restore</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.kind}-${row.id}`} className="cursor-default border-t border-white bg-[#ffe0d6]">
                  <td className="px-3 py-2">{row.typeLabel}</td>
                  <td className="px-3 py-2 font-semibold">{row.name}</td>
                  <td className="px-3 py-2 text-[#647386]">{row.detail}</td>
                  <td className="whitespace-nowrap px-3 py-2">{row.deletedAt ? stamp(row.deletedAt) : "-"}</td>
                  <td className="px-3 py-2">{row.deletedById ? names.get(row.deletedById) ?? "Unknown user" : "-"}</td>
                  <td className="px-3 py-2 text-right">
                    {row.canRestore ? (
                      row.kind === "agent" ? <ActionButton action={restoreAgentAction} fields={{ agentId: row.id }} label="Restore" confirmMessage={`Restore ${row.name}?`} />
                      : row.kind === "company" ? <ActionButton action={restoreCompanyAction} fields={{ companyId: row.id }} label="Restore" confirmMessage={`Restore ${row.name}?`} />
                      : <ActionButton action={restoreIdentifierAction} fields={{ identifierId: row.id }} label="Restore" confirmMessage={`Restore ${row.name}?`} />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="px-3 py-8 text-center text-xs text-[#647386]">Nothing deleted.</p>}
    </section>
  );
}
