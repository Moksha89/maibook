"use client";

import { useModalAction } from "@/components/ui/use-modal-action";

import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import type { ActionState } from "@/lib/actions/types";
import { changePasswordAction, updateProfileAction } from "./actions";

function Feedback({ state }: { state: ActionState }) { return state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null; }

export function ProfileForm({ profile }: { profile: { displayName: string; email: string; phone: string } }) {
  const [state, action, pending] = useModalAction(updateProfileAction, {} as ActionState);
  return (
    <form action={action} className="rounded-lg border bg-white p-3">
      <h2 className="mb-3 text-sm font-bold">Profile</h2>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="text-xs font-bold text-[#0d1a2c]">Display name<Input name="displayName" className="mt-1" defaultValue={profile.displayName} required /></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Email<Input name="email" type="email" className="mt-1" defaultValue={profile.email} /></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Phone<Input name="phone" className="mt-1" defaultValue={profile.phone} /></label>
      </div>
      <Feedback state={state} />
      <FormFooter><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}Save profile</Button></FormFooter>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useModalAction(changePasswordAction, {} as ActionState);
  return (
    <form action={action} className="rounded-lg border bg-white p-3">
      <h2 className="mb-3 text-sm font-bold">Change password</h2>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="text-xs font-bold text-[#0d1a2c]">Current password<Input name="currentPassword" type="password" autoComplete="current-password" className="mt-1" required /></label>
        <label className="text-xs font-bold text-[#0d1a2c]">New password<Input name="newPassword" type="password" autoComplete="new-password" className="mt-1" required /></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Confirm new password<Input name="confirmPassword" type="password" autoComplete="new-password" className="mt-1" required /></label>
      </div>
      
      <Feedback state={state} />
      <FormFooter><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}Change password</Button></FormFooter>
    </form>
  );
}
