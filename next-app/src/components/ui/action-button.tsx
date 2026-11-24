"use client";

import { useActionState } from "react";
import { clsx } from "clsx";

import type { ActionState } from "@/lib/actions/types";

/** A small one-click form button for server actions with inline error feedback and optional confirmation. */
export function ActionButton({ action, fields, label, confirmMessage, danger = false }: { action: (state: ActionState, formData: FormData) => Promise<ActionState>; fields: Record<string, string>; label: string; confirmMessage?: string; danger?: boolean }) {
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  return (
    <form action={formAction} onSubmit={(event) => { if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault(); }} className="inline-flex flex-col items-start gap-0.5">
      {Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      <button type="submit" disabled={pending} className={clsx("h-7 rounded border bg-white px-2 text-xs font-semibold hover:bg-[#f4f6f8] disabled:opacity-55", danger ? "border-[#f0b4ae] text-[#b42318] hover:bg-[#fdecea]" : "text-[#53657a]")}>{pending ? "Working" : label}</button>
      {state.status === "error" && state.message ? <span className="max-w-[240px] text-[10px] leading-tight text-[#b42318]">{state.message}</span> : null}
    </form>
  );
}
