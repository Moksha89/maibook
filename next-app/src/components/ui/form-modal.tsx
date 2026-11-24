"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ModalCloseContext } from "@/components/ui/modal-context";

export function FormModal({ trigger, title, children, size = "lg", compact = false, triggerClassName }: { trigger: string; title: string; children: React.ReactNode; size?: "sm" | "md" | "lg" | "xl"; compact?: boolean; triggerClassName?: string }) {
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
  const width = size === "xl" ? "max-w-5xl" : size === "md" ? "max-w-xl" : size === "sm" ? "max-w-md" : "max-w-3xl";
  return <>
    {compact ? <Button ref={openerRef} type="button" size="xs" iconOnly variant="secondary" className={triggerClassName} onClick={() => setOpen(true)}>{trigger}</Button> : <Button ref={openerRef} type="button" onClick={() => setOpen(true)}>{trigger}</Button>}
    {open ? createPortal(<div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="absolute inset-0 bg-[#08111f]/65" aria-label={`Close ${title}`} onClick={() => setOpen(false)} />
      <section ref={dialogRef} tabIndex={-1} className={`relative max-h-[92dvh] w-full ${width} overflow-y-auto rounded-t-[24px] border border-white/60 bg-white shadow-[0_24px_70px_rgba(8,17,31,0.4)] sm:rounded-[24px]`}>
        <header className="sticky top-0 z-10 flex min-h-12 items-center justify-between gap-3 rounded-t-[24px] border-b border-[#eef1f5] bg-white/95 px-4 py-2 backdrop-blur sm:px-5">
          <h2 id={titleId} className="min-w-0 truncate text-sm font-bold text-[#0d1a2c] sm:text-base" title={title}>{title}</h2>
          <Button type="button" iconOnly variant="secondary" icon={X} className="shrink-0" onClick={() => setOpen(false)} aria-label={`Close ${title}`} title="Close" />
        </header>
        <ModalCloseContext.Provider value={() => setOpen(false)}><div className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5 [&>form]:border-0 [&>form]:p-0! [&>form]:shadow-none">{children}</div></ModalCloseContext.Provider>
      </section>
    </div>, document.body) : null}
  </>;
}
