"use client";

import { useModalAction } from "@/components/ui/use-modal-action";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import { modalField, modalLabel } from "@/components/ui/form-styles";
import type { ActionState } from "@/lib/actions/types";
import { createSettlementAction } from "./actions";
import { balanceColor } from "@/lib/format";

interface IdentifierOption { id: string; value: string; type: string; agentName: string; percentageRate: string; sitePercentage?: string | null; balance: string; agentBalance: string }
interface CompanyOption { id: string; name: string; identifiers: IdentifierOption[]; uplines: { id: string; name: string; percentageRate: string }[] }

const money = (value: number) => value.toLocaleString("en-IN", { maximumFractionDigits: 0, signDisplay: "negative" });
const round = (value: number) => Math.round(value * 100) / 100 || 0;

function owes(value: number) {
  if (Math.abs(value) < 0.5) return { text: "SETTLED", color: "#3b4d63", background: "#eef1f5" };
  return value > 0 ? { text: "AGENT OWES COMPANY", color: "#2563eb", background: "#e8f0fe" } : { text: "COMPANY OWES AGENT", color: "#d92d20", background: "#fde8e7" };
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return <div className="min-w-0"><div className="text-[10px] font-semibold uppercase text-[#59400f]">{label}</div><div className="truncate font-mono text-xs font-semibold" style={tone ? { color: tone } : undefined}>{value}</div></div>;
}

export function SettlementFormBody({ companies, initialIdempotencyKey }: { companies: CompanyOption[]; initialIdempotencyKey: string }) {
  const [state, action, pending] = useModalAction(createSettlementAction, {} as ActionState);
  const [companyId, setCompanyId] = useState(companies.find((option) => option.identifiers.length)?.id ?? companies[0]?.id ?? "");
  const [identifierId, setIdentifierId] = useState("");
  const [uplineId, setUplineId] = useState("");
  const [amountText, setAmountText] = useState("");
  const company = companies.find((option) => option.id === companyId);
  const identifier = company?.identifiers.find((option) => option.id === identifierId);
  const upline = company?.uplines.find((option) => option.id === uplineId);
  const amount = Number(amountText);
  const ready = Boolean(identifier) && Number.isFinite(amount) && amount !== 0;

  const configured = Number(identifier?.percentageRate ?? 0);
  const applied = identifier?.type === "SUB_AGENT" ? 100 - configured : configured;
  const sign = amount < 0 ? -1 : 1;
  const absolute = Math.abs(amount || 0);
  const agentShare = round(round(absolute * applied / 100) * sign);
  const uplinePercent = identifier?.sitePercentage != null ? Number(identifier.sitePercentage) : Number(upline?.percentageRate ?? 0);
  const uplineShare = round(round(absolute * uplinePercent / 100) * -sign);
  const companyShare = round(absolute * sign - uplineShare - agentShare);
  const agentBalance = Number(identifier?.agentBalance ?? 0);
  const agentEntry = identifier?.type === "SUB_AGENT" ? agentShare : -agentShare;
  const balanceAfter = round(agentBalance + agentEntry);
  const now = owes(agentEntry);
  const after = owes(balanceAfter);

  return (
    <form action={action} className="text-xs">
      <input type="hidden" name="idempotencyKey" value={state.data?.idempotencyKey ?? initialIdempotencyKey} />
      <div className="grid grid-cols-3" style={{ columnGap: 12, rowGap: 8 }}>
        <label className={modalLabel}>Company<Select name="companyId" className={modalField} value={companyId} onChange={(event) => { setCompanyId(event.target.value); setIdentifierId(""); setUplineId(""); }}>{companies.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</Select></label>
        <label className={modalLabel}>ID<Select key={companyId} name="identifierId" className={modalField} value={identifierId} required onChange={(event) => setIdentifierId(event.target.value)}><option value="">None</option>{company?.identifiers.map((option) => <option key={option.id} value={option.id}>{option.value}</option>)}</Select></label>
        <label className={modalLabel}>Upline<Select key={`u-${companyId}`} name="uplineId" className={modalField} value={uplineId} onChange={(event) => setUplineId(event.target.value)}><option value="">None</option>{company?.uplines.map((option) => <option key={option.id} value={option.id}>{option.name} · {option.percentageRate}%</option>)}</Select></label>
      </div>
      <div className="mt-2 grid grid-cols-5 rounded-lg border border-[#f0dca8] bg-[#fff8e6] px-3 py-2" style={{ columnGap: 12 }}>
        <Stat label="Agent" value={identifier?.agentName ?? "-"} />
        <Stat label="Type" value={identifier ? (identifier.type === "SUB_AGENT" ? "Sub Agent" : "Agent") : "-"} />
        <Stat label="Agent %" value={identifier ? `${applied.toFixed(2)}%` : "-"} />
        <Stat label="ID balance" value={identifier ? money(Number(identifier.balance)) : "-"} tone={identifier ? balanceColor(identifier.balance) : undefined} />
        <Stat label="Agent balance" value={identifier ? money(agentBalance) : "-"} tone={identifier ? balanceColor(agentBalance) : undefined} />
      </div>
      <div className="mt-2 grid grid-cols-3" style={{ columnGap: 12, rowGap: 8 }}>
        <label className={modalLabel}>Settlement amount<Input name="amount" className={modalField} type="number" step="0.01" required value={amountText} onChange={(event) => setAmountText(event.target.value)} /></label>
        <label className={modalLabel}>Date<Input name="settlementDate" className={modalField} type="date" defaultValue={new Date().toLocaleDateString("en-CA")} required /></label>
        <label className={modalLabel}>Remarks<Input name="remarks" className={modalField} maxLength={500} /></label>
      </div>
      <div className="mt-2 overflow-hidden rounded-lg border border-[#d5dbe6]">
        <div className="grid grid-cols-4 bg-white px-3 py-2" style={{ columnGap: 12 }}>
          <Stat label="Agent share" value={ready ? money(agentShare) : "-"} />
          <Stat label="Upline share" value={ready ? money(uplineShare) : "-"} />
          <Stat label="Company share" value={ready ? money(companyShare) : "-"} />
          <Stat label="Agent balance after" value={ready ? money(balanceAfter) : "-"} tone={ready ? balanceColor(balanceAfter) : undefined} />
        </div>
        {ready ? (
          <div className="flex items-center justify-between gap-3 border-t border-[#eef1f5] px-3 py-2" style={{ background: now.background }}>
            <span className="text-[11px] font-bold" style={{ color: now.color }}>{now.text} {Math.abs(agentEntry) >= 0.5 ? money(Math.abs(agentEntry)) : ""}</span>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: after.color, background: "#ffffff" }}>BALANCE: {after.text} {Math.abs(balanceAfter) >= 0.5 ? money(Math.abs(balanceAfter)) : ""}</span>
          </div>
        ) : null}
      </div>
      {state.message && state.status === "error" ? <p className="mt-2 text-xs text-[#b42318]">{state.message}</p> : null}
      <FormFooter className="!mt-2"><Button type="submit" disabled={pending || !company?.identifiers.length}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Posting" : "Post settlement"}</Button></FormFooter>
    </form>
  );
}
