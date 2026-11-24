"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Coins, MessageSquare, X } from "lucide-react";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import type { ActionState } from "@/lib/actions/types";
import { createSettlementAction } from "../../settlements/actions";

const today = () => new Date().toLocaleDateString("en-CA");
const field = "h-8 rounded-full border border-[#d5dbe6] bg-white px-3 text-xs outline-none focus:border-[#3b5fd4]";

/** Compact settlement entry row for one ID. */
export function IdentifierSettlementBar({ companyId, identifierId, uplines }: { companyId: string; identifierId: string; uplines: { id: string; name: string; percentageRate: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState(today());
  const [amount, setAmount] = useState("");
  const [uplineId, setUplineId] = useState("");
  const [remarks, setRemarks] = useState("");
  const value = Number(amount);
  const valid = amount.trim() !== "" && Number.isFinite(value) && value !== 0;
  const clear = () => { setAmount(""); setRemarks(""); setUplineId(""); setDate(today()); };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || pending) return;
    const data = new FormData();
    data.set("companyId", companyId);
    data.set("identifierId", identifierId);
    data.set("amount", String(value));
    data.set("settlementDate", date);
    if (uplineId) data.set("uplineId", uplineId);
    if (remarks.trim()) data.set("remarks", remarks.trim());
    data.set("idempotencyKey", crypto.randomUUID());
    startTransition(async () => {
      const result: ActionState = await createSettlementAction({} as ActionState, data);
      if (result.status === "success") { toast(result.message ?? "Settlement posted."); clear(); router.refresh(); }
      else toast(result.message ?? "The settlement could not be posted.", "error");
    });
  }

  return (
    <form onSubmit={submit} aria-label="Add settlement" className="sticky bottom-2 z-20 mt-3 rounded-lg border bg-white/95 p-2 shadow-[0_-6px_18px_rgba(13,26,44,0.10)] backdrop-blur sm:px-3">
      <div className="flex flex-wrap items-center gap-1.5 lg:flex-nowrap [&_[role=alert]]:hidden [&_.rounded-full]:!h-8 [&_.rounded-full]:!text-xs [&_.w-8]:!w-6 [&_.w-8_svg]:!size-3.5">
        <input type="date" aria-label="Date" title="Date" value={date} max={today()} onChange={(event) => setDate(event.target.value)} className={`${field} w-36 shrink-0`} required />
        <Input type="number" step="0.01" inputMode="decimal" icon={Coins} aria-label="Settlement amount" title="Settlement amount" value={amount} onChange={(event) => setAmount(event.target.value)} className="w-32 shrink-0" required />
        <select aria-label="Upline" title="Upline" value={uplineId} onChange={(event) => setUplineId(event.target.value)} className={`${field} w-44 shrink-0`}><option value="">No upline</option>{uplines.map((upline) => <option key={upline.id} value={upline.id}>{upline.name} · {Number(upline.percentageRate)}%</option>)}</select>
        <Input icon={MessageSquare} aria-label="Remarks" title="Remarks" value={remarks} onChange={(event) => setRemarks(event.target.value.toUpperCase())} maxLength={500} className="min-w-0 flex-1 basis-32" />
        <div className="flex shrink-0 gap-1 [&_button]:!size-6 [&_button_svg]:!size-3">
          <Button type="submit" iconOnly icon={Check} aria-label="Post settlement" title="Post settlement" disabled={!valid || pending} className="!bg-[#ffc107] !text-[#111] !ring-0 hover:!brightness-110" />
          <Button type="button" variant="secondary" iconOnly icon={X} aria-label="Clear" title="Clear" onClick={clear} className="!bg-[#795548] !text-white !ring-0 hover:!brightness-110" />
        </div>
      </div>
    </form>
  );
}
