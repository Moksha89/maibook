"use client";

import { useState, useTransition, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Undo2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { reverseSettlementAction } from "./actions";

/** Reverse button that opens a small pop-up asking for remarks before reversing. */
export function ReverseSettlementButton({ settlementId, companyId, label }: { settlementId: string; companyId: string; label: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [pending, startTransition] = useTransition();
  const close = () => { if (!pending) { setOpen(false); setRemarks(""); } };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!remarks.trim() || pending) return;
    const data = new FormData();
    data.set("settlementId", settlementId);
    data.set("companyId", companyId);
    data.set("reason", remarks.trim());
    startTransition(async () => {
      try { await reverseSettlementAction(data); toast("Settlement reversed."); setOpen(false); setRemarks(""); router.refresh(); }
      catch { toast("The settlement could not be reversed.", "error"); }
    });
  }

  return <>
    <Button type="button" size="xs" iconOnly icon={Undo2} variant="dangerSoft" aria-label={`Reverse ${label}`} title="Reverse" onClick={() => setOpen(true)} />
    {open ? createPortal(<div className="fixed inset-0 z-[100] grid place-items-center bg-[#0d1a2c]/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-label="Reverse settlement" className="w-full max-w-sm rounded-xl bg-white p-4 text-left shadow-xl">
        <div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-sm font-bold text-[#10233f]">Reverse {label}</h2><button type="button" onClick={close} aria-label="Close" className="grid size-7 place-items-center rounded-full text-[#647386] hover:bg-[#f4f6f8]"><X className="size-4" /></button></div>
        <input autoFocus aria-label="Remarks" placeholder="Remarks" value={remarks} onChange={(event) => setRemarks(event.target.value.toUpperCase())} maxLength={500} required className="h-9 w-full rounded-full border border-[#d5dbe6] px-3 text-xs outline-none focus:border-[#d92d20]" />
        <div className="mt-3 flex justify-end gap-2"><Button type="button" size="xs" variant="secondary" onClick={close} disabled={pending}>Cancel</Button><Button type="submit" size="xs" variant="danger" disabled={!remarks.trim() || pending}>{pending ? "Reversing" : "Reverse"}</Button></div>
      </form>
    </div>, document.body) : null}
  </>;
}
