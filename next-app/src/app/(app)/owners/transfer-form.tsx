"use client";

import { useModalAction } from "@/components/ui/use-modal-action";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/form-modal";
import { Input, Select } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import type { ActionState } from "@/lib/actions/types";
import { createOwnerTransferAction, updateOwnerTransferAction } from "./actions";

const label = "text-[11px] font-semibold text-[#3b4d63]";
const field = "mt-0.5 !text-xs [&_input]:!h-7 [&_select]:!h-7 [&_select]:!text-xs";

type Partner = { id: string; name: string };

export function TransferForm({ partners, defaultFromId, entry }: {
  partners: Partner[];
  /** When set (a partner's Entries tab), the current partner is the sender and the From field is hidden. */
  defaultFromId?: string;
  entry?: { id: string; fromOwnerId: string; toOwnerId: string; amount: string; remarks: string };
}) {
  const actionFn = entry ? updateOwnerTransferAction : createOwnerTransferAction;
  const [state, action, pending] = useModalAction(actionFn, {} as ActionState);
  const editing = Boolean(entry);
  const lockedFromId = entry?.fromOwnerId ?? defaultFromId;
  const hideFrom = Boolean(lockedFromId);
  const toOptions = hideFrom ? partners.filter((partner) => partner.id !== lockedFromId) : partners;
  return (
    <FormModal compact={editing} size="sm" trigger={editing ? "Edit" : "Internal transfer"} title={editing ? "Edit transfer" : "Internal transfer"} triggerClassName={editing ? "!size-7 [&_svg]:!size-3.5" : undefined}>
      <form action={action} className="text-xs">
        {entry ? <input type="hidden" name="entryId" value={entry.id} /> : null}
        {hideFrom ? <input type="hidden" name="fromOwnerId" value={lockedFromId} /> : (
          <label className={`${label} mb-2 block`}>From
            <Select name="fromOwnerId" className={field} required defaultValue="">
              <option value="" disabled>From</option>
              {partners.map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}
            </Select>
          </label>
        )}
        <label className={`${label} block`}>To
          <Select name="toOwnerId" className={field} required defaultValue={entry?.toOwnerId ?? ""}>
            <option value="" disabled>To</option>
            {toOptions.map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}
          </Select>
        </label>
        <label className={`${label} mt-2 block`}>Amount<Input name="amount" type="number" min={1} step="1" className={field} required defaultValue={entry?.amount} /></label>
        <label className={`${label} mt-2 block`}>Remarks<Input name="remarks" uppercase className={field} defaultValue={entry?.remarks} /></label>
        {state.message ? <p className={`mt-1.5 text-[11px] ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
        <FormFooter className="!mt-2"><Button type="submit" size="sm" disabled={pending}>{pending ? "Saving" : "Save"}</Button></FormFooter>
      </form>
    </FormModal>
  );
}
