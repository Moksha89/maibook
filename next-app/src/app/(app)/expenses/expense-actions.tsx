"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/actions/types";
import { deleteExpenseAction } from "./actions";

/** Icon-only Delete (#ff5722) for one expense, with confirmation. The expense is soft-deleted. */
export function DeleteExpenseButton({ expenseId, label }: { expenseId: string; label: string }) {
  const [state, action, pending] = useActionState(deleteExpenseAction, {} as ActionState);
  return (
    <form action={action} onSubmit={(event) => { if (!window.confirm(`Delete expense ${label}?`)) event.preventDefault(); }} className="inline-flex flex-col items-end gap-0.5">
      <input type="hidden" name="expenseId" value={expenseId} />
      <Button type="submit" size="xs" iconOnly icon={Trash2} aria-label="Delete expense" title="Delete" loading={pending} className="!size-7 !bg-[#ff5722] !text-white !ring-0 hover:!brightness-110 [&_svg]:!size-3.5" />
      {state.status === "error" && state.message ? <span className="max-w-[200px] text-[10px] leading-tight text-[#b42318]">{state.message}</span> : null}
    </form>
  );
}
