"use client";

import { useState } from "react";
import { useModalAction } from "@/components/ui/use-modal-action";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/form-modal";
import { Input, Select } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import type { ActionState } from "@/lib/actions/types";
import { assignOwnerCompanyAction, createOwnerAction, updateOwnerAction } from "./actions";

type Company = { id: string; name: string };
const label = "text-[11px] font-semibold text-[#3b4d63]";
const field = "mt-0.5 !text-xs [&_*:has(>input)]:!h-7 [&_input]:!h-full [&_input]:!text-xs [&_select]:!h-7 [&_select]:!text-xs [&_[data-select-trigger]]:!h-7 [&_[data-select-trigger]]:!text-xs [&_svg]:!size-3.5";
const hint = <span className="font-normal text-[#8a98a8]"> (optional)</span>;

function Message({ state }: { state: ActionState }) {
  return state.message ? <p className={`mt-1.5 text-[11px] ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null;
}

const ShareInput = () => <Input name="percentage" className={field} type="number" min={0} max={100} step="0.01" required />;

function OwnerFormBody({ companies }: { companies: Company[] }) {
  const [state, action, pending] = useModalAction(createOwnerAction, {} as ActionState);
  const [companyId, setCompanyId] = useState("");
  return <form action={action} className="text-xs"><div className="grid gap-x-2 gap-y-1.5 sm:grid-cols-2">
    <label className={label}>Name<Input name="name" className={field} uppercase required /></label>
    <label className={label}>Mobile number{hint}<Input name="phone" className={field} inputMode="tel" /></label>
    <label className={label}>Company{hint}<Select name="companyId" className={field} value={companyId} onChange={(event) => setCompanyId(event.target.value)}><option value="">No company (assign later)</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</Select></label>
    <label className={label}>Email address{hint}<Input name="email" className={field} type="email" /></label>
    {companyId ? <label className={label}>Share %<ShareInput /></label> : null}
  </div><Message state={state} /><FormFooter className="!mt-2"><Button type="submit" size="sm" disabled={pending}>{pending ? "Saving" : "Add owner"}</Button></FormFooter></form>;
}

export function OwnerForm(props: Parameters<typeof OwnerFormBody>[0]) {
  return <FormModal size="md" trigger="Add owner" title="Add owner or business partner"><OwnerFormBody {...props} /></FormModal>;
}

function EditOwnerBody({ owner }: { owner: { id: string; name: string; email: string; phone: string } }) {
  const [state, action, pending] = useModalAction(updateOwnerAction, {} as ActionState);
  return <form action={action} className="text-xs"><input type="hidden" name="ownerId" value={owner.id} /><div className="grid gap-x-2 gap-y-1.5 sm:grid-cols-2">
    <label className={label}>Name<Input name="name" className={field} defaultValue={owner.name} uppercase required /></label>
    <label className={label}>Mobile number{hint}<Input name="phone" className={field} inputMode="tel" defaultValue={owner.phone} /></label>
    <label className={`${label} sm:col-span-2`}>Email address{hint}<Input name="email" className={field} type="email" defaultValue={owner.email} /></label>
  </div><Message state={state} /><FormFooter className="!mt-2"><Button type="submit" size="sm" disabled={pending}>{pending ? "Saving" : "Save changes"}</Button></FormFooter></form>;
}

export function EditOwnerForm(props: Parameters<typeof EditOwnerBody>[0]) {
  return <FormModal compact size="md" trigger="Edit" title={`Edit ${props.owner.name}`}><EditOwnerBody {...props} /></FormModal>;
}

function AssignCompanyBody({ ownerId, companies }: { ownerId: string; companies: Company[] }) {
  const [state, action, pending] = useModalAction(assignOwnerCompanyAction, {} as ActionState);
  return <form action={action} className="text-xs"><input type="hidden" name="ownerId" value={ownerId} /><div className="grid grid-cols-[minmax(0,1fr)_96px] items-start gap-2">
    <label className={label}>Company<Select name="companyId" className={field} required defaultValue="">{companies.length ? <option value="" disabled>Select company</option> : <option value="" disabled>No more companies to assign</option>}{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</Select></label>
    <label className={label}>Share %<ShareInput /></label>
  </div><Message state={state} /><FormFooter className="!mt-2"><Button type="submit" size="sm" disabled={pending || !companies.length}>{pending ? "Saving" : "Assign"}</Button></FormFooter></form>;
}

export function AssignCompanyForm(props: { ownerId: string; ownerName: string; companies: Company[] }) {
  return <FormModal compact size="sm" trigger="Assign company" title={`Assign ${props.ownerName}`}><AssignCompanyBody ownerId={props.ownerId} companies={props.companies} /></FormModal>;
}
