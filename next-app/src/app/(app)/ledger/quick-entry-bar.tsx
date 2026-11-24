"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, Coins, MessageSquare, Percent, UserRound, Wallet, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useModalAction } from "@/components/ui/use-modal-action";
import type { ActionState } from "@/lib/actions/types";
import { createTransferAction } from "./actions";

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
  const listId = useId();
  const remarksId = useId();
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
  const counterparty = useMemo(() => company?.agents.find((agent) => agent.id !== ownerId && normalise(agent.name) === normalise(name)), [company, ownerId, name]);
  const amount = Number(coins);
  const received = amount > 0;
  const idempotencyKey = state.data?.idempotencyKey ?? initialIdempotencyKey;

  useEffect(() => { setRate(company?.defaultRate ?? ""); setAgentChoice((current) => (company?.agents.some((agent) => agent.id === current) ? current : "")); }, [company]);
  const handled = useRef(state);
  useEffect(() => {
    if (state.status !== "success" || handled.current === state) return;
    handled.current = state;
    setName(""); setCoins(""); setRemarks(""); setRate(company?.defaultRate ?? ""); setClientError("");
    nameRef.current?.focus();
  }, [state, company]);

  function clear() { setName(""); setCoins(""); setRemarks(""); setRate(company?.defaultRate ?? ""); setClientError(""); nameRef.current?.focus(); }
  function check(event: React.FormEvent<HTMLFormElement>) {
    if (!owner) { event.preventDefault(); setClientError("Choose the agent whose ledger you are entering."); return; }
    if (!counterparty) { event.preventDefault(); setClientError("Select a valid agent of this company in Name."); return; }
    if (!Number.isFinite(amount) || amount === 0) { event.preventDefault(); setClientError("Enter the coins (positive to receive, negative to send)."); return; }
    setClientError("");
  }

  const names = company?.agents.filter((agent) => agent.id !== ownerId) ?? [];
  return (
    <>
    <div aria-hidden className="h-40 sm:h-28" data-print-hidden />
    <form action={action} onSubmit={check} aria-label="Quick entry" data-print-hidden className="fixed bottom-0 left-[var(--shell-left,0px)] right-0 z-20 border-t bg-white/95 shadow-[0_-6px_18px_rgba(13,26,44,0.10)] backdrop-blur"><div className="mx-auto max-w-[1600px] p-2 sm:px-3 lg:px-4">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="companyId" value={company?.id ?? ""} />
      <input type="hidden" name="entryDate" value={localDate()} />
      <input type="hidden" name="senderAgentId" value={received ? counterparty?.id ?? "" : owner?.id ?? ""} />
      <input type="hidden" name="receiverAgentId" value={received ? owner?.id ?? "" : counterparty?.id ?? ""} />
      <input type="hidden" name="coins" value={Number.isFinite(amount) && amount !== 0 ? String(Math.abs(amount)) : ""} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(110px,1fr))]">
        {fixedCompanyId ? null : <Select aria-label="Company" value={company?.id ?? ""} onChange={(event) => setCompanyId(event.target.value)}>{companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>}
        {fixedAgentId ? null : <Select aria-label="Agent (ledger owner)" value={agentChoice} onChange={(event) => setAgentChoice(event.target.value)}><option value="">Agent…</option>{company?.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</Select>}
        <div role="status" aria-label="Counterparty balance" title="Counterparty balance" className="flex h-9 items-center gap-2 overflow-hidden rounded-full border border-[#d5dbe6] bg-[#f7f8fa] px-3 text-sm text-[#152235]"><Wallet className="size-4 shrink-0 text-[#647386]" /><span className="truncate font-mono">{counterparty ? Number(counterparty.balance).toLocaleString(undefined, { maximumFractionDigits: 2 }) : <span className="text-[#8a98a8]">Balance</span>}</span></div>
        <Input ref={nameRef} name="counterpartyName" aria-label="Name (counterparty)" placeholder="Name" icon={UserRound} list={listId} autoComplete="off" required value={name} onChange={(event) => setName(event.target.value)} />
        <datalist id={listId}>{names.map((agent) => <option key={agent.id} value={agent.name} />)}</datalist>
        <Input aria-label="Coins" placeholder="Coins" icon={Coins} inputMode="decimal" autoComplete="off" required value={coins} onChange={(event) => setCoins(event.target.value.replace(/[^0-9.\-]/g, ""))} />
        <Input name="rate" aria-label="Rate" placeholder="Rate" icon={Percent} inputMode="decimal" autoComplete="off" required value={rate} onChange={(event) => setRate(event.target.value.replace(/[^0-9.]/g, ""))} />
        <Input name="remarks" aria-label="Remarks" placeholder="Remarks" icon={MessageSquare} maxLength={500} list={remarksId} autoComplete="off" value={remarks} onChange={(event) => setRemarks(event.target.value)} />
        <datalist id={remarksId}>{remarkOptions.map((remark) => <option key={remark} value={remark} />)}</datalist>
        <div className="flex items-center gap-2"><Button type="submit" icon={Check} loading={pending} disabled={!company}>OK</Button><Button type="button" variant="secondary" icon={X} onClick={clear}>Clear</Button></div>
      </div>
      {clientError || state.status === "error" ? <p role="alert" className="mt-1.5 px-1 text-xs text-[#b42318]">{clientError || state.message}</p> : owner && counterparty && amount ? <p className="mt-1.5 px-1 text-[11px] text-[#647386]">{owner.name} {received ? "receives" : "sends"} {Math.abs(amount)} {received ? "from" : "to"} {counterparty.name}. Tab moves on; Enter saves from Remarks.</p> : null}
    </div></form>
    </>
  );
}
