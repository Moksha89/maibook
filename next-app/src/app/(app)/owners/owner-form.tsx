"use client";

import { useModalAction } from "@/components/ui/use-modal-action";import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/form-modal";
import { Input, Select } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import type { ActionState } from "@/lib/actions/types";
import { createOwnerAction } from "./actions";

type Company = { id: string; name: string; agents: { id: string; name: string }[] };
function OwnerFormBody({ companies }: { companies: Company[] }) {
  const [state, action, pending] = useModalAction(createOwnerAction, {} as ActionState);
  const [companyId, setCompanyId] = useState(companies[0]?.id || "");
  const agents = companies.find((company) => company.id === companyId)?.agents || [];
  return <><form action={action} className="rounded-lg border bg-white p-3"><div className="grid gap-2 sm:grid-cols-2"><label className="text-xs font-semibold">Company<Select name="companyId" className="mt-1" value={companyId} onChange={(event) => setCompanyId(event.target.value)} required>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</Select></label><label className="text-xs font-semibold">Name<Input name="name" className="mt-1" required /></label><label className="text-xs font-semibold">Email<Input name="email" className="mt-1" type="email" /></label><label className="text-xs font-semibold">Phone<Input name="phone" className="mt-1" /></label><label className="text-xs font-semibold sm:col-span-2">Assigned agents<Select name="agentIds" className="mt-1" multiple size={Math.min(5, Math.max(2, agents.length))}>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</Select></label></div>{state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}<FormFooter><Button type="submit" disabled={pending || !companies.length}>{pending ? "Saving" : "Add owner"}</Button></FormFooter></form></>;
}

export function OwnerForm(props: Parameters<typeof OwnerFormBody>[0]) {
  return <FormModal trigger="Add owner" title="Add owner or business partner"><OwnerFormBody {...props} /></FormModal>;
}
