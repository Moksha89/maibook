import Link from "next/link";

import { Pagination } from "@/components/ui/pagination";
import { PAGE_SIZE, parsePage } from "@/lib/paging";
import { isSensitiveColumn } from "@/lib/services/database-browser";
import { listPublicTables, tableColumns, tableCount, tableRows } from "@/lib/services/database-browser-db";
import { AddRowForm, CreateTableForm, DeleteRowForm, DropTableForm, EditRowForm } from "./browser-forms";

function cell(value: unknown) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export async function DatabaseBrowserTab({ table, page }: { table?: string; page?: string }) {
  const tables = await listPublicTables();
  const selected = table && tables.some((item) => item.name === table) ? table : tables[0]?.name;
  const columns = selected ? await tableColumns(selected) : [];
  const total = selected ? await tableCount(selected) : 0;
  const paging = parsePage(page, total);
  const rows = selected ? await tableRows(selected, paging.skip, paging.take) : [];
  const primary = columns.filter((column) => column.isPrimary).map((column) => column.name);
  const canEdit = primary.length > 0;

  return (
    <div className="grid min-h-[70vh] overflow-hidden rounded-lg border bg-white lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="border-b bg-[#f7f8fa] lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2"><h2 className="text-sm font-bold">Tables</h2><CreateTableForm /></div>
        <ul className="max-h-[60vh] overflow-y-auto text-xs lg:max-h-[calc(70vh-44px)]">
          {tables.map((item) => (
            <li key={item.name}>
              <Link prefetch={false} href={`/database?tab=browser&table=${encodeURIComponent(item.name)}`} className={`flex items-center justify-between gap-2 px-3 py-1.5 font-mono ${item.name === selected ? "bg-[#2196f3] text-white" : "hover:bg-[#eef2f7]"}`}>
                <span className="truncate">{item.name}</span>
                <span className={`shrink-0 tabular-nums ${item.name === selected ? "text-white/80" : "text-[#647386]"}`}>{item.name === selected ? total.toLocaleString() : item.estimatedRows.toLocaleString()}</span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <section className="min-w-0">
        {selected ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
              <div><h2 className="font-mono text-sm font-bold">{selected}</h2><p className="text-[11px] text-[#647386]">{total.toLocaleString()} {total === 1 ? "row" : "rows"}</p></div>
              <div className="flex items-center gap-1">{canEdit ? <AddRowForm table={selected} columns={columns} /> : null}<DropTableForm table={selected} /></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="bg-[#fff4d7] text-[#59400f]"><tr>{columns.map((column) => <th key={column.name} className="whitespace-nowrap px-3 py-2 font-mono">{column.name}{column.isPrimary ? " *" : ""}</th>)}{canEdit ? <th className="px-3 py-2 text-right">Actions</th> : null}</tr></thead>
                <tbody>
                  {rows.map((row, index) => {
                    const keys: Record<string, string> = {};
                    for (const name of primary) keys[name] = cell(row[name]);
                    return (
                      <tr key={index} className="border-t hover:bg-[#fafbfc]">
                        {columns.map((column) => <td key={column.name} className={`max-w-[240px] truncate px-3 py-2 font-mono ${isSensitiveColumn(column.name) ? "text-[#647386]" : ""}`} title={cell(row[column.name])}>{cell(row[column.name]) || "—"}</td>)}
                        {canEdit ? <td className="px-3 py-2"><div className="flex justify-end gap-1"><EditRowForm table={selected} columns={columns} row={row} /><DeleteRowForm table={selected} keys={keys} /></div></td> : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!rows.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">This table has no rows.</p> : null}
            <Pagination pathname="/database" params={{ tab: "browser", table: selected }} page={paging.current} pages={paging.pages} total={paging.total} />
            {!canEdit ? <p className="border-t px-3 py-2 text-[11px] text-[#647386]">This table has no primary key, so rows can be viewed but not edited or deleted here.</p> : null}
          </>
        ) : <p className="px-3 py-8 text-center text-xs text-[#647386]">No tables found.</p>}
      </section>
    </div>
  );
}
