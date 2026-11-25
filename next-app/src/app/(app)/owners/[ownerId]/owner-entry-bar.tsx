"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Check, X } from "lucide-react";
import { useModalAction } from "@/components/ui/use-modal-action";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import type { ActionState } from "@/lib/actions/types";
import { createOwnerEntryAction } from "../actions";

const today = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; };
const nowTime = () => { const now = new Date(); return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`; };

/** Compact payment row for an owner or business partner: Paid (to partner) or Received (from partner). */
export function OwnerEntryBar({ ownerId, companies }: { ownerId: string; companies: { id: string; name: string }[] }) {
  const [state, action, pending] = useModalAction(createOwnerEntryAction, {} as ActionState);
  const [direction, setDirection] = useState<"PAID" | "RECEIVED">("PAID");
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state]);
  const pill = (value: "PAID" | "RECEIVED", text: string, Icon: typeof Check, on: string) => <button type="button" aria-pressed={direction === value} aria-label={text} title={text} onClick={() => setDirection(value)} className={`grid w-8 place-items-center ${direction === value ? on : "bg-white text-[#647386] hover:bg-[#f4f6f8]"}`}><Icon className="size-3.5" strokeWidth={2} /></button>;
  return <form ref={formRef} action={action} aria-label="Partner entry" className="sticky bottom-2 z-20 mt-3 rounded-lg border bg-white/95 shadow-[0_-6px_18px_rgba(13,26,44,0.10)] backdrop-blur"><div className="p-2 sm:px-3">
    <input type="hidden" name="ownerId" value={ownerId} />
    <input type="hidden" name="direction" value={direction} />
    <div className="flex flex-wrap items-center gap-1.5 lg:flex-nowrap [&_[role=alert]]:hidden [&_select]:h-8 [&_select]:text-xs [&_.rounded-full]:!h-8 [&_.rounded-full]:!text-xs [&_.w-8]:!w-6 [&_.w-8_svg]:!size-3.5">
      <Input name="entryDate" type="date" aria-label="Date" title="Date" defaultValue={today()} className="w-36 shrink-0" required />
      <Input name="entryTime" type="time" aria-label="Time" title="Time" defaultValue={nowTime()} className="w-28 shrink-0" required />
      <div role="group" aria-label="Type" className="flex h-8 shrink-0 overflow-hidden rounded-full border border-[#d5dbe6]">{pill("PAID", "Paid to partner", ArrowUpRight, "bg-[#f44336] text-white")}{pill("RECEIVED", "Received from partner", ArrowDownLeft, "bg-[#16a34a] text-white")}</div>
      {companies.length ? <Select name="companyId" aria-label="Company" title="Company" className="w-36 shrink-0" defaultValue={companies.length === 1 ? companies[0].id : ""} required><option value="" disabled>{companies.length > 1 ? "Select company" : companies[0].name}</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</Select> : null}
      <Input name="amount" type="number" aria-label="Amount" title="Amount" min={1} step="1" className="w-28 shrink-0" required />
      <Input name="remarks" aria-label="Remarks" title="Remarks" uppercase className="min-w-0 flex-1 basis-32" />
      <div className="flex shrink-0 gap-1 [&_button]:!size-6 [&_button_svg]:!size-3">
        <Button type="submit" iconOnly icon={Check} aria-label="Save entry" title="Save entry" disabled={pending} className="!bg-[#ffc107] !text-[#111] !ring-0 hover:!brightness-110" />
        <Button type="reset" variant="secondary" iconOnly icon={X} aria-label="Clear" title="Clear" className="!bg-[#795548] !text-white !ring-0 hover:!brightness-110" />
      </div>
    </div>
    {state.message ? <p className={`mt-1 text-[11px] ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
  </div></form>;
}
