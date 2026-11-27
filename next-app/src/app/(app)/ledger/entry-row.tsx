"use client";

import { useSyncExternalStore } from "react";
import type { MouseEvent, ReactNode } from "react";

/** One ledger line as the entry bar needs it (coins signed from the row owner's point of view). */
export interface EntryRowData { entryId: string; lineId: string; editable: boolean; deleted: boolean; modified: boolean; counterparty: string; coins: string; rate: string; remarks: string; entryDate: string; companyId?: string; ownerAgentId?: string; counterpartyAgentId?: string }

// Tiny shared store: the table rows (server-rendered list) and the entry bar are separate client islands.
let current: EntryRowData | null = null;
const listeners = new Set<() => void>();
export function selectEntry(data: EntryRowData | null) { current = data; listeners.forEach((listener) => listener()); }
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function useSelectedEntry() { return useSyncExternalStore(subscribe, () => current, () => null); }

/** MyBook Advance style row: click (or Enter/Space) selects it for Delete/Modify in the entry bar; selected rows are blue. */
export function EntryRow({ data, className, children }: { data: EntryRowData; className: string; children: ReactNode }) {
  const selected = useSelectedEntry();
  const isSelected = selected?.lineId === data.lineId;
  const toggle = (event?: MouseEvent) => {
    if (event && (event.target as HTMLElement).closest("a,button,input,select,textarea")) return;
    selectEntry(isSelected ? null : data);
  };
  return <tr tabIndex={0} aria-selected={isSelected} data-selected={isSelected || undefined} onClick={toggle} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(); } }} style={isSelected ? { backgroundColor: "#287fea", color: "#fff" } : undefined} className={`cursor-pointer select-none border-t border-white outline-none hover:brightness-95 ${isSelected ? "" : className}`}>{children}</tr>;
}
