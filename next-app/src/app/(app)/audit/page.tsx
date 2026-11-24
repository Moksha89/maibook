import type { Metadata } from "next";
import Link from "next/link";
import { FilterForm } from "@/components/ui/filter-form";

import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { auditWhere, type AuditFilters } from "@/lib/services/audit-query";
import { ExpandingSearch } from "@/components/ui/expanding-search";
import { Select } from "@/components/ui/input";
import { Button, LinkButton } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";

export const metadata: Metadata = { title: "Audit log" };

const PAGE_SIZE = 100;

export default async function AuditPage({ searchParams }: { searchParams: Promise<AuditFilters & { page?: string }> }) {
  await requirePermission("audit.read");
  const query = await searchParams;
  const where = auditWhere(query);
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  const [logs, total, users, companies, entities] = await Promise.all([
    db.auditLog.findMany({ where, include: { actor: { select: { displayName: true, username: true } }, company: { select: { name: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.auditLog.count({ where }),
    db.user.findMany({ where: { deletedAt: null }, select: { id: true, displayName: true }, orderBy: { displayName: "asc" } }),
    db.company.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.auditLog.findMany({ distinct: ["entityType"], select: { entityType: true }, orderBy: { entityType: "asc" } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const { page: _page, ...filters } = query; void _page;
  const qs = (extra: Record<string, string>) => new URLSearchParams(Object.entries({ ...filters, ...extra }).filter(([, value]) => value) as [string, string][]).toString();
  const field = "h-9 rounded-md border bg-white px-2.5 text-sm";
  return <><PageHeader title="Audit log" description="Immutable security, financial, permission, backup, and data-change history." actions={<LinkButton href={`/api/audit/export?${qs({})}`} variant="secondary">Export CSV</LinkButton>} /><FilterForm className="mb-3 grid gap-2 rounded-lg border bg-white p-3 sm:grid-cols-2 lg:grid-cols-4"><div className="flex h-9 items-center"><ExpandingSearch defaultValue={query.q ?? ""} label="Search audit log by actor, entity or request ID" placeholder="Actor, entity or request ID" width="w-full" className="max-w-full" /></div><input name="action" defaultValue={query.action} className={field} placeholder="Action contains" /><Select name="user" defaultValue={query.user ?? ""} ><option value="">All users</option>{users.map((user) => <option key={user.id} value={user.id}>{user.displayName}</option>)}</Select><Select name="company" defaultValue={query.company ?? ""} ><option value="">All companies</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</Select><Select name="entity" defaultValue={query.entity ?? ""} ><option value="">All record types</option>{entities.map((entity) => <option key={entity.entityType} value={entity.entityType}>{entity.entityType}</option>)}</Select><div className="flex items-center"><DateRangePicker fromName="from" toName="to" defaultFrom={query.from} defaultTo={query.to} /></div><div className="flex gap-2"><Button type="submit" className="flex-1">Filter</Button><LinkButton href="/audit" variant="secondary">Reset</LinkButton></div></FilterForm><section className="overflow-hidden rounded-lg border bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">Time</th><th className="px-3 py-2">Actor</th><th className="px-3 py-2">Action</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Entity</th><th className="px-3 py-2">Request ID</th><th className="px-3 py-2">IP</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id} className="border-t hover:bg-[#fafbfc]"><td className="whitespace-nowrap px-3 py-2">{log.createdAt.toLocaleString()}</td><td className="px-3 py-2">{log.actor?.displayName || "System"}<div className="text-[10px] text-[#647386]">{log.actor?.username}</div></td><td className="px-3 py-2 font-mono text-[11px] font-semibold">{log.action}</td><td className="px-3 py-2">{log.company?.name || "—"}</td><td className="px-3 py-2">{log.entityType}{log.entityId ? <div className="font-mono text-[10px] text-[#647386]">{log.entityId}</div> : null}</td><td className="px-3 py-2 font-mono text-[10px]">{log.requestId}</td><td className="px-3 py-2 font-mono text-[10px]">{log.ipAddress || "—"}</td></tr>)}</tbody></table></div>{!logs.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No audit records match the filters.</p> : null}</section><div className="mt-3 flex items-center justify-between text-xs text-[#647386]"><span>{total} record{total === 1 ? "" : "s"} · page {page} of {pages}</span><span className="flex gap-2">{page > 1 ? <Link prefetch={false} className="rounded-md border bg-white px-3 py-1.5 font-semibold text-[#10233f]" href={`/audit?${qs({ page: String(page - 1) })}`}>Previous</Link> : null}{page < pages ? <Link prefetch={false} className="rounded-md border bg-white px-3 py-1.5 font-semibold text-[#10233f]" href={`/audit?${qs({ page: String(page + 1) })}`}>Next</Link> : null}</span></div></>;
}
