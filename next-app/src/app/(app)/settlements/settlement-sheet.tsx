"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import type { ActionState } from "@/lib/actions/types";
import { createSettlementAction } from "./actions";

export interface SheetRow { id: string; value: string;
  type: string; companyId: string; companyName: string; agentName: string; siteName: string; appliedPercent: number }

const money = (value: number) => value.toLocaleString("en-IN", { maximumFractionDigits: 0, signDisplay: "negative" });

function Row({ row }: { row: SheetRow }) {
  const router = useRouter();
  const [amountText, setAmountText] = useState("");
  const [pending, startTransition] = useTransition();
  const amount = Number(amountText);
  const valid = amountText.trim() !== "" && Number.isFinite(amount) && amount !== 0;
  const share = valid ? Math.round(amount * row.appliedPercent) / 100 || 0 : null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || pending) return;
    const data = new FormData();
    data.set("companyId", row.companyId);
    data.set("identifierId", row.id);
    data.set("amount", String(amount));
    data.set("settlementDate", new Date().toLocaleDateString("en-CA"));
    data.set("idempotencyKey", crypto.randomUUID());
    startTransition(async () => {
      const result: ActionState = await createSettlementAction({} as ActionState, data);
      if (result.status === "success") { toast(`${row.value}: ${result.message ?? "Settlement posted."}`); setAmountText(""); router.refresh(); }
      else toast(result.message ?? "The settlement could not be posted.", "error");
    });
  }

  return (
    <tr className="border-t hover:bg-[#fafbfc]">
      <td className="px-3 py-1.5 font-mono font-semibold">{row.value}</td>
      <td className="px-3 py-1.5">{row.type === "SUB_AGENT" ? "Sub Agent" : "Agent"}</td>
      <td className="px-3 py-1.5">{row.siteName}</td>
      <td className="px-3 py-1.5">{row.companyName}</td>
      <td className="px-3 py-1.5">{row.agentName}</td>
      <td className="px-3 py-1.5 text-right font-mono">
        <span className="text-[#647386]">{row.appliedPercent.toFixed(2)}%</span>
        {share !== null ? <span className="ml-2 font-semibold text-[#10233f]">{money(share)}</span> : null}
      </td>
      <td className="px-3 py-1.5">
        <form onSubmit={submit} className="flex items-center justify-end gap-1.5">
          <input type="number" step="0.01" inputMode="decimal" aria-label={`Settlement amount for ${row.value}`} value={amountText} onChange={(event) => setAmountText(event.target.value)} disabled={pending} className="h-7 w-32 rounded-full border border-[#d5dbe6] bg-white px-3 text-right font-mono text-xs outline-none focus:border-[#3b5fd4]" />
          <Button type="submit" size="xs" iconOnly icon={Check} loading={pending} aria-label={`Post settlement for ${row.value}`} title="Post settlement" disabled={!valid || pending} className="!size-6 !bg-[#ffc107] !text-[#111] !ring-0 hover:!brightness-110 [&_svg]:!size-3" />
        </form>
      </td>
    </tr>
  );
}

export function SettlementSheet({ rows }: { rows: SheetRow[] }) {
  return (
    <section className="mt-3 overflow-hidden rounded-lg border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-xs">
          <thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">ID</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Site</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Agent</th><th className="px-3 py-2 text-right">Agent share</th><th className="px-3 py-2 text-right">Settlement amount</th></tr></thead>
          <tbody>{rows.map((row) => <Row key={row.id} row={row} />)}</tbody>
        </table>
      </div>
      {!rows.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No IDs with an agent yet.</p> : null}
    </section>
  );
}
