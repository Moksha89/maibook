"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/actions/types";
import { updateIdentifierAction } from "./actions";

export function EditIdentifierForm({ identifier }: { identifier: { id: string; value: string; type: "AGENT" | "SUB_AGENT"; percentageRate: string } }) {
  const [state, action, pending] = useActionState(updateIdentifierAction, {} as ActionState);
  return (
    <form action={action} className="rounded-lg border bg-white p-3">
      <input type="hidden" name="identifierId" value={identifier.id} />
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="text-xs font-semibold text-[#3b4d63]">ID value<Input name="value" className="mt-1" defaultValue={identifier.value} required /></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Type<select name="type" className="mt-1 h-9 w-full rounded-md border bg-white px-2.5" defaultValue={identifier.type}><option value="AGENT">Agent</option><option value="SUB_AGENT">Sub Agent</option></select></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Agent percentage<Input name="percentageRate" className="mt-1" type="number" min="0" max="100" step="0.0001" defaultValue={identifier.percentageRate} required /></label>
      </div>
      <p className="mt-2 text-[11px] text-[#647386]">Existing settlements keep the rate they were posted with. The new rate applies to future settlements.</p>
      {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
      <div className="mt-3 flex justify-end"><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Saving" : "Save changes"}</Button></div>
    </form>
  );
}
