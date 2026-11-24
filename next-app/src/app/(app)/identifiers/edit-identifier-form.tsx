"use client";

import { useModalAction } from "@/components/ui/use-modal-action";

import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import type { ActionState } from "@/lib/actions/types";
import { updateIdentifierAction } from "./actions";
import { SegmentedToggle } from "@/components/ui/toggle";

export function EditIdentifierForm({ identifier }: { identifier: { id: string; value: string; type: "AGENT" | "SUB_AGENT"; percentageRate: string } }) {
  const [state, action, pending] = useModalAction(updateIdentifierAction, {} as ActionState);
  return (
    <form action={action} className="rounded-lg border bg-white p-3">
      <input type="hidden" name="identifierId" value={identifier.id} />
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="text-xs font-bold text-[#0d1a2c]">ID value<Input name="value" className="mt-1" defaultValue={identifier.value} required /></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Type<SegmentedToggle name="type" label="ID type" size="md" className="mt-1 w-full" defaultValue={identifier.type} options={[{ value: "AGENT", label: "Agent" }, { value: "SUB_AGENT", label: "Sub Agent" }]} /></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Agent percentage<Input name="percentageRate" className="mt-1" type="number" min="0" max="100" step="0.0001" defaultValue={identifier.percentageRate} required /></label>
      </div>
      <p className="mt-2 text-[11px] text-[#647386]">Existing settlements keep the rate they were posted with. The new rate applies to future settlements.</p>
      {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
      <FormFooter><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Saving" : "Save changes"}</Button></FormFooter>
    </form>
  );
}
