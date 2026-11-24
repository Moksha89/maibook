"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Coins, MessageSquare, Pencil, Percent, RotateCcw, Trash2, UserRound, Wallet, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { useModalAction } from "@/components/ui/use-modal-action";
import type { ActionState } from "@/lib/actions/types";
import { createTransferAction, deleteLedgerEntryAction, restoreLedgerEntryAction, updateLedgerEntryAction } from "./actions";
import { selectEntry, useSelectedEntry } from "./entry-row";
import type { EntryRowData } from "./entry-row";
import { balanceTone } from "@/lib/format";

export interface QuickEntryAgent { id: string; name: string; balance: string }
export interface QuickEntryCompany { id: string; name: string; defaultRate: string | null; agents: QuickEntryAgent[] }

const normalise = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
const localDate = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; };

/**
 * Inline entry row recovered from the MyBook Advance ("classic") ledger screen: counterparty balance (read-only),
 * Name (counterparty), Coins, Rate, Remarks, OK, Clear. Coins are signed from the selected agent's point of view:
 * a positive amount is received from the counterparty, a negative amount is sent to the counterparty.
 * The selected agent and company are implied in the old app; here they are fixed by the page or picked in the row.
 */
export function QuickEntryBar({ companies, remarkOptions, initialIdempotencyKey, fixedCompanyId, fixedAgentId }: { companies: QuickEntryCompany[]; remarkOptions: string[]; initialIdempotencyKey: string; fixedCompanyId?: string; fixedAgentId?: string }) {
  const [state, action, pending] = useModalAction(createTransferAction, {} as ActionState);
  const [savedRemarks, setSavedRemarks] = useState<string[]>([]);
  const nameRef = useRef<HTMLInputElement>(null);
  const [companyId, setCompanyId] = useState(fixedCompanyId ?? companies[0]?.id ?? "");
  const company = companies.find((item) => item.id === companyId) ?? companies[0];
  const [agentChoice, setAgentChoice] = useState("");
  const ownerId = fixedAgentId ?? agentChoice;
  const owner = company?.agents.find((agent) => agent.id === ownerId);
  const [name, setName] = useState("");
  const [coins, setCoins] = useState("");
  const [rate, setRate] = useState(company?.defaultRate ?? "");
  const [remarks, setRemarks] = useState("");
  const [clientError, setClientError] = useState("");
  const router = useRouter();
  const selected = useSelectedEntry();
  const [editing, setEditing] = useState<EntryRowData | null>(null);
  const [busy, startBusy] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<EntryRowData | null>(null);
  useEffect(() => { if (!confirmDelete) return; const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setConfirmDelete(null); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [confirmDelete]);
  const counterparty = useMemo(() => company?.agents.find((agent) => agent.id !== ownerId && normalise(agent.name) === normalise(name)), [company, ownerId, name]);
  const amount = Number(coins);
  const received = amount > 0;
  const idempotencyKey = state.data?.idempotencyKey ?? initialIdempotencyKey;

  useEffect(() => { setRate(company?.defaultRate ?? ""); setAgentChoice((current) => (company?.agents.some((agent) => agent.id === current) ? current : "")); }, [company]);
  const handled = useRef(state);
  useEffect(() => {
    if (state.status !== "success" || handled.current === state) return;
    handled.current = state;
    const newRemark = remarks.trim();
    if (newRemark) setSavedRemarks((current) => [newRemark, ...current.filter((item) => item !== newRemark)]);
    setName(""); setCoins(""); setRemarks(""); setRate(company?.defaultRate ?? ""); setClientError("");
    nameRef.current?.focus();
  }, [state, company]);

  function clear() { setEditing(null); setName(""); setCoins(""); setRemarks(""); setRate(company?.defaultRate ?? ""); setClientError(""); nameRef.current?.focus(); }
  function toggleDelete() {
    if (!selected) { setClientError("Click an entry in the table first."); return; }
    setClientError(""); setConfirmDelete(selected);
  }
  function runDelete() {
    const target = confirmDelete;
    if (!target) return;
    const restoring = target.deleted;
    const data = new FormData(); data.set("entryId", target.entryId);
    startBusy(async () => {
      try { await (restoring ? restoreLedgerEntryAction : deleteLedgerEntryAction)(data); setClientError(""); setConfirmDelete(null); selectEntry(null); if (editing?.entryId === target.entryId) clear(); router.refresh(); }
      catch (error) { setClientError(error instanceof Error ? error.message : "The entry could not be changed."); }
    });
  }
  function modify() {
    if (!selected) { setClientError("Click an entry in the table first."); return; }
    if (selected.deleted) { setClientError("Restore the entry before modifying it."); return; }
    if (!selected.editable) { setClientError("Only agent-to-agent transfers can be modified here."); return; }
    setEditing(selected); setName(selected.counterparty.toUpperCase()); setCoins(String(Number(selected.coins))); setRate(String(Number(selected.rate))); setRemarks(selected.remarks.toUpperCase()); setClientError("");
  }
  function submitUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || !company) return;
    const value = Number(coins);
    if (!Number.isFinite(value) || value === 0) { setClientError("Enter the coins."); return; }
    if (Math.sign(value) !== Math.sign(Number(editing.coins))) { setClientError("The direction (sent or received) can't change. Delete the entry and enter it again."); return; }
    const data = new FormData();
    data.set("entryId", editing.entryId); data.set("companyId", company.id); data.set("coins", String(Math.abs(value))); data.set("rate", rate); data.set("entryDate", editing.entryDate); data.set("remarks", remarks);
    startBusy(async () => {
      const result = await updateLedgerEntryAction({} as ActionState, data);
      if (result.status === "error") { setClientError(result.message || "The entry could not be updated."); return; }
      selectEntry(null); clear(); router.refresh();
    });
  }
  function check(event: React.FormEvent<HTMLFormElement>) {
    if (!owner) { event.preventDefault(); setClientError("Choose the agent whose ledger you are entering."); return; }
    if (!counterparty) { event.preventDefault(); setClientError("Select a valid agent of this company in Name."); return; }
    if (!Number.isFinite(amount) || amount === 0) { event.preventDefault(); setClientError("Enter the coins (positive to receive, negative to send)."); return; }
    setClientError("");
  }

  const names = company?.agents.filter((agent) => agent.id !== ownerId) ?? [];
  return (
    <>
    <form action={action} onSubmit={editing ? submitUpdate : check} aria-label="Quick entry" data-print-hidden className="sticky bottom-2 z-20 mt-3 rounded-lg border bg-white/95 shadow-[0_-6px_18px_rgba(13,26,44,0.10)] backdrop-blur"><div className="p-2 sm:px-3">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="companyId" value={company?.id ?? ""} />
      <input type="hidden" name="entryDate" value={localDate()} />
      <input type="hidden" name="senderAgentId" value={received ? counterparty?.id ?? "" : owner?.id ?? ""} />
      <input type="hidden" name="receiverAgentId" value={received ? owner?.id ?? "" : counterparty?.id ?? ""} />
      <input type="hidden" name="coins" value={Number.isFinite(amount) && amount !== 0 ? String(Math.abs(amount)) : ""} />
      <div className="flex flex-wrap items-center gap-1.5 lg:flex-nowrap [&_[role=alert]]:hidden [&_select]:h-8 [&_select]:text-xs [&_.rounded-full]:!h-8 [&_.rounded-full]:!text-xs [&_.w-8]:!w-6 [&_.w-8_svg]:!size-3.5">
        {fixedCompanyId ? null : <Select className="w-32 shrink-0" aria-label="Company" value={company?.id ?? ""} onChange={(event) => setCompanyId(event.target.value)}>{companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>}
        {fixedAgentId ? null : <Select className="w-32 shrink-0" aria-label="Agent (ledger owner)" value={agentChoice} onChange={(event) => setAgentChoice(event.target.value)}><option value="">Agent…</option>{company?.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</Select>}
        <div role="status" aria-label={counterparty ? `${counterparty.name} balance` : "Balance"} title={counterparty ? `${counterparty.name} balance` : "Balance"} className="flex h-8 w-24 shrink-0 items-center gap-1 overflow-hidden rounded-full border border-[#d5dbe6] bg-[#f7f8fa] px-2 text-xs text-[#152235]"><Wallet className="size-3.5 shrink-0 text-[#647386]" /><span className="truncate font-mono">{counterparty ? <span className={balanceTone(counterparty.balance)}>{Number(counterparty.balance).toLocaleString(undefined, { maximumFractionDigits: 0, signDisplay: "negative" })}</span> : null}</span></div>
        <div className="min-w-0 flex-[1.3] basis-32 [&_input]:uppercase [&_li]:uppercase"><AutocompleteInput inputRef={nameRef} name="counterpartyName" aria-label="Name (counterparty)" icon={UserRound} required uppercase options={names.map((agent) => agent.name.toUpperCase())} value={name} onValueChange={setName} openUp={false} requireQuery inlineComplete readOnly={Boolean(editing)} /></div>
        
        <Input className="w-24 shrink-0" aria-label="Coins" icon={Coins} inputMode="decimal" autoComplete="off" required value={coins} onChange={(event) => setCoins(event.target.value.replace(/[^0-9.\-]/g, ""))} />
        <Input className="w-[4.5rem] shrink-0" name="rate" aria-label="Rate" icon={Percent} inputMode="decimal" autoComplete="off" required value={rate} onChange={(event) => setRate(event.target.value.replace(/[^0-9.]/g, ""))} />
        <div className="min-w-0 flex-[1.3] basis-32 [&_input]:uppercase [&_li]:uppercase"><AutocompleteInput name="remarks" aria-label="Remarks" icon={MessageSquare} maxLength={500} uppercase options={[...new Set([...savedRemarks, ...remarkOptions].map((item) => item.toUpperCase()))]} value={remarks} onValueChange={setRemarks} /></div>
        
        <div className="flex h-8 shrink-0 items-center gap-1 [&_button]:!size-6 [&_button_svg]:!size-3" role="toolbar" aria-label="Entry actions">
          <Button type="submit" size="xs" iconOnly className="!bg-[#ffc107] !text-[#111] !ring-0 hover:!brightness-110" icon={Check} loading={pending || (busy && Boolean(editing))} disabled={!company} aria-label={editing ? "Update entry" : "OK, save entry"} title={editing ? "Update" : "OK"} />
          <Button type="button" size="xs" iconOnly variant="secondary" className="!bg-[#795548] !text-white !ring-0 hover:!brightness-110" icon={X} onClick={clear} aria-label="Clear" title="Clear" />
          <Button type="button" size="xs" iconOnly variant={selected?.deleted ? "secondary" : "danger"} className={selected?.deleted ? "!bg-[#16a34a] !text-white !ring-0 hover:!brightness-110" : "!bg-[#ff5722] !text-white !ring-0 hover:!brightness-110"} icon={selected?.deleted ? RotateCcw : Trash2} onClick={toggleDelete} disabled={!selected || busy} aria-label={selected?.deleted ? "Restore" : "Delete"} title={selected?.deleted ? "Restore the selected entry" : "Delete the selected entry"} />
          <Button type="button" size="xs" iconOnly variant="secondary" className="!bg-[#2196f3] !text-white !ring-0 hover:!brightness-110" icon={Pencil} onClick={modify} disabled={!selected || selected.deleted || busy} aria-label="Modify" title="Modify the selected entry" />
        </div>
      </div>
      {clientError || state.status === "error" ? <p role="alert" className="mt-1.5 px-1 text-xs text-[#b42318]">{clientError || state.message}</p> : owner && counterparty && amount ? <p className="mt-1.5 px-1 text-[11px] text-[#647386]">{owner.name} {received ? "receives" : "sends"} {Math.abs(amount)} {received ? "from" : "to"} {counterparty.name}.</p> : <p className="mt-1 px-1 text-[11px]">{editing ? <span className="text-[11px] font-semibold text-[#1e3a8a]">Modifying the entry with {editing.counterparty}.</span> : null}</p>}
    </div></form>
    {confirmDelete ? <div className="fixed inset-0 z-50 grid place-items-center bg-[#0d1a2c]/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setConfirmDelete(null); }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="entry-confirm-title" className="w-full max-w-sm rounded-xl border bg-white p-4 shadow-[0_20px_50px_rgba(13,26,44,0.25)]">
        <h2 id="entry-confirm-title" className="text-sm font-bold text-[#152235]">{confirmDelete.deleted ? "Restore this entry?" : "Delete this entry?"}</h2>
        <p className="mt-1.5 text-xs text-[#3b4d63]">{confirmDelete.counterparty} · {confirmDelete.coins} coins @ {Number(confirmDelete.rate)}{confirmDelete.remarks ? ` · ${confirmDelete.remarks}` : ""}</p>
        <p className="mt-1 text-[11px] text-[#647386]">{confirmDelete.deleted ? "It will count again and balances will be recalculated." : "It stays in the list in red and can be restored. Balances will be recalculated."}</p>
        <div className="mt-3 flex justify-end gap-2"><Button type="button" size="xs" variant="secondary" icon={X} onClick={() => setConfirmDelete(null)} disabled={busy} autoFocus>Cancel</Button><Button type="button" size="xs" variant={confirmDelete.deleted ? "primary" : "danger"} icon={confirmDelete.deleted ? RotateCcw : Trash2} onClick={runDelete} loading={busy}>{confirmDelete.deleted ? "Restore" : "Delete"}</Button></div>
      </div>
    </div> : null}
    </>
  );
}
