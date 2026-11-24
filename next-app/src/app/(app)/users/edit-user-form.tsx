"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/actions/types";
import { updateUserAction } from "./actions";

export interface EditableUser {
  id: string; displayName: string; username: string; email: string | null; phone: string | null; roleId: string; maxDevices: number; expiresAt: string; otpEnabled: boolean;
  accessLevel: "FULL" | "READ"; companyIds: string[]; overrides: Record<string, "GRANT" | "DENY">;
}

export function EditUserForm({ user, roles, companies, modules }: { user: EditableUser; roles: { id: string; name: string }[]; companies: { id: string; name: string }[]; modules: string[] }) {
  const [state, action, pending] = useActionState(updateUserAction, {} as ActionState);
  return (
    <form action={action} className="rounded-lg border bg-white p-3">
      <input type="hidden" name="userId" value={user.id} />
      <p className="mb-2 text-xs text-[#647386]">Username <span className="font-mono font-semibold">{user.username}</span> cannot be changed.</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs font-semibold text-[#3b4d63]">Display name<Input name="displayName" className="mt-1" defaultValue={user.displayName} required /></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Email<Input name="email" type="email" className="mt-1" defaultValue={user.email ?? ""} /></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Phone<Input name="phone" className="mt-1" defaultValue={user.phone ?? ""} /></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Role<select name="roleId" className="mt-1 h-9 w-full rounded-md border bg-white px-2.5 text-sm" defaultValue={user.roleId} required>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Device limit<Input name="maxDevices" type="number" min="1" max="10" className="mt-1" defaultValue={user.maxDevices} required /></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Account expiry<Input name="expiresAt" type="date" className="mt-1" defaultValue={user.expiresAt} /></label>
        <label className="text-xs font-semibold text-[#3b4d63] sm:col-span-2">Reset password (optional)<Input name="newPassword" type="password" className="mt-1" autoComplete="new-password" placeholder="Leave blank to keep the current password" /></label>
        <label className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#3b4d63]"><input type="checkbox" name="otpEnabled" defaultChecked={user.otpEnabled} />Require OTP at sign-in</label>
      </div>
      <div className="mt-3 rounded-md border p-2">
        <div className="mb-2 flex items-center justify-between gap-3"><span className="text-xs font-semibold">Company access</span><select name="accessLevel" defaultValue={user.accessLevel} className="h-8 rounded-md border bg-white px-2 text-xs"><option value="FULL">Full access</option><option value="READ">Read only</option></select></div>
        <div className="flex max-h-32 flex-wrap gap-3 overflow-y-auto">{companies.map((company) => <label key={company.id} className="flex items-center gap-1.5 text-xs"><input type="checkbox" name="companyIds" value={company.id} defaultChecked={user.companyIds.includes(company.id)} />{company.name}</label>)}</div>
      </div>
      <details className="mt-3 rounded-md border p-2">
        <summary className="cursor-pointer text-xs font-semibold">Module overrides (optional)</summary>
        <p className="mt-1 text-[11px] text-[#647386]">Grant or deny a whole module for this user, regardless of their role.</p>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">{modules.map((module) => <label key={module} className="flex items-center justify-between gap-2 text-xs"><input type="hidden" name="overrideModules" value={module} /><span className="font-medium capitalize">{module.replace("_", " ")}</span><select name={`override.${module}`} defaultValue={user.overrides[module] ?? ""} className="h-7 rounded-md border bg-white px-1.5 text-xs"><option value="">Role default</option><option value="GRANT">Grant</option><option value="DENY">Deny</option></select></label>)}</div>
      </details>
      {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
      <div className="mt-3 flex justify-end"><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Saving" : "Save changes"}</Button></div>
    </form>
  );
}
