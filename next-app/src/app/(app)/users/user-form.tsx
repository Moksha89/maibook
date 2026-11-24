"use client";

import { useActionState } from "react";
import { LoaderCircle, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/form-modal";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/actions/types";
import { createUserAction } from "./actions";

export function UserForm({ roles, companies }: { roles: { id: string; name: string }[]; companies: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createUserAction, {} as ActionState);
  return <FormModal trigger="Add user" title="Create user" size="xl"><form action={action} className="rounded-lg border bg-white p-3"><div className="mb-3 flex items-center gap-2"><UserPlus className="size-4 text-[#a97819]" /><h2 className="text-sm font-bold">Add user</h2></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Input name="displayName" placeholder="Display name" required /><Input name="username" placeholder="Username" autoComplete="off" required /><Input name="email" type="email" placeholder="Email" /><Input name="phone" placeholder="Phone" /><Input name="password" type="password" placeholder="Temporary password" autoComplete="new-password" required /><select name="roleId" className="h-9 rounded-md border bg-white px-2.5 text-sm" required><option value="">Select role</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select><Input name="maxDevices" type="number" min="1" max="10" defaultValue="2" placeholder="Device limit" /><Input name="expiresAt" type="date" aria-label="Account expiry" /></div><div className="mt-3 rounded-md border p-2"><div className="mb-2 flex items-center justify-between gap-3"><span className="text-xs font-semibold">Company access</span><select name="accessLevel" className="h-8 rounded-md border bg-white px-2 text-xs"><option value="FULL">Full access</option><option value="READ">Read only</option></select></div><div className="flex max-h-40 flex-wrap gap-3 overflow-y-auto">{companies.map((company) => <label key={company.id} className="flex items-center gap-1.5 text-xs"><input type="checkbox" name="companyIds" value={company.id} />{company.name}</label>)}</div></div>{state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}<div className="mt-3 flex justify-end"><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Creating" : "Create user"}</Button></div></form></FormModal>;
}
