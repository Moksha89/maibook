"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FormModal({ trigger, title, children, size = "lg", compact = false }: { trigger: string; title: string; children: React.ReactNode; size?: "md" | "lg" | "xl"; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const openerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const opener = openerRef.current;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    const focusableSelector = 'button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), a[href]';
    const initialFocus = dialog?.querySelector<HTMLElement>('input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])') ?? dialog;
    initialFocus?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); return; }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
      if (!focusable.length) { event.preventDefault(); dialog.focus(); return; }
      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", handleKeyDown); opener?.focus(); };
  }, [open]);
  const width = size === "xl" ? "max-w-4xl" : size === "md" ? "max-w-lg" : "max-w-2xl";
  return <>
    {compact ? <button ref={openerRef} type="button" onClick={() => setOpen(true)} className="h-7 rounded border bg-white px-2 text-xs font-semibold text-[#203650] hover:bg-[#f4f6f8]">{trigger}</button> : <Button ref={openerRef} type="button" onClick={() => setOpen(true)}><Plus className="size-4" />{trigger}</Button>}
    {open ? <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="absolute inset-0 bg-[#08111f]/65" aria-label={`Close ${title}`} onClick={() => setOpen(false)} />
      <section ref={dialogRef} tabIndex={-1} className={`relative max-h-[92dvh] w-full ${width} overflow-y-auto rounded-t-xl border bg-[#f4f6f8] shadow-2xl sm:rounded-xl`}>
        <header className="sticky top-0 z-10 flex h-11 items-center justify-between border-b bg-white px-3">
          <h2 id={titleId} className="text-sm font-bold text-[#0d1a2c]">{title}</h2>
          <button type="button" onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-md text-[#53657a] hover:bg-[#eef1f4]" aria-label={`Close ${title}`}><X className="size-4" /></button>
        </header>
        <div className="p-2 sm:p-3 [&>form]:border-0 [&>form]:shadow-none">{children}</div>
      </section>
    </div> : null}
  </>;
}
