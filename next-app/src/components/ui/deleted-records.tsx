import Link from "next/link";
import { Trash2 } from "lucide-react";

import { db } from "@/lib/db";
import { stamp } from "@/lib/format";

export type DeletedRow = { id: string; name: string; detail?: string | null; deletedAt: Date | null; deletedById: string | null };

/** Icon-only switch that shows or hides soft-deleted records under a list. */
export function DeletedToggle({ active, q }: { active: boolean; q?: string }) {
  const params = new URLSearchParams();
  if (q?.trim()) params.set("q", q.trim());
  if (!active) params.set("deleted", "1");
  const href = params.size ? `?${params.toString()}` : "?";
  return <Link prefetch={false} href={href} title={active ? "Hide deleted" : "Show deleted"} aria-label={active ? "Hide deleted" : "Show deleted"} className={`grid size-8 shrink-0 place-items-center rounded-full ${active ? "bg-[#ff5722] text-white" : "bg-[#f4f6f8] text-[#647386] hover:bg-[#e8ecf1]"}`}><Trash2 className="size-4" /></Link>;
}

/** Read-only list of soft-deleted records: what, when and by whom. */
export async function DeletedRecords({ title, rows }: { title: string; rows: DeletedRow[] }) {
  const ids = [...new Set(rows.map((row) => row.deletedById).filter((id): id is string => Boolean(id)))];
  const users = ids.length ? await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, displayName: true } }) : [];
  const names = new Map(users.map((user) => [user.id, user.displayName]));
  return (
    <section className="mt-3 overflow-hidden rounded-lg border bg-white">
      <h2 className="border-b px-3 py-2 text-sm font-bold">{title} ({rows.length})</h2>
      {rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead className="bg-[#ffeebb] text-[#152235]"><tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Details</th><th className="px-3 py-2">Deleted on</th><th className="px-3 py-2">Deleted by</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="cursor-default border-t border-white bg-[#ffe0d6]"><td className="px-3 py-2 font-semibold">{row.name}</td><td className="px-3 py-2 text-[#647386]">{row.detail || "-"}</td><td className="whitespace-nowrap px-3 py-2">{row.deletedAt ? stamp(row.deletedAt) : "-"}</td><td className="px-3 py-2">{row.deletedById ? names.get(row.deletedById) ?? "Unknown user" : "-"}</td></tr>)}</tbody></table></div> : <p className="px-3 py-6 text-center text-xs text-[#647386]">Nothing deleted.</p>}
    </section>
  );
}
