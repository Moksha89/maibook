"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  if (state.challengeId) return <form action={action} className="space-y-3" noValidate><input type="hidden" name="mode" value="otp" /><input type="hidden" name="challengeId" value={state.challengeId} /><div><label htmlFor="code" className="mb-1 block text-xs font-semibold text-[#3b4d63]">Verification code{state.maskedPhone ? ` sent to ${state.maskedPhone}` : ""}</label><Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} autoFocus /></div>{state.message ? <p className="text-xs text-[#3b4d63]">{state.message}</p> : null}{state.error ? <div role="alert" className="rounded-md border border-[#efb6b0] bg-[#fff1ef] px-3 py-2 text-xs text-[#9e2017]">{state.error}</div> : null}<Button type="submit" className="w-full" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />}{pending ? "Verifying" : "Verify and sign in"}</Button></form>;

  return (
    <form action={action} className="space-y-3" noValidate>
      <div>
        <label htmlFor="identifier" className="mb-1 block text-xs font-semibold text-[#3b4d63]">Username, email, or phone</label>
        <Input id="identifier" name="identifier" autoComplete="username" autoFocus aria-invalid={Boolean(state.fieldErrors?.identifier)} />
        {state.fieldErrors?.identifier ? <p className="mt-1 text-xs text-[#b42318]">{state.fieldErrors.identifier[0]}</p> : null}
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-xs font-semibold text-[#3b4d63]">Password</label>
        <div className="relative"><Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" className="pr-9" aria-invalid={Boolean(state.fieldErrors?.password)} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-9 place-items-center text-[#647386] hover:text-[#10233f]">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>
        {state.fieldErrors?.password ? <p className="mt-1 text-xs text-[#b42318]">{state.fieldErrors.password[0]}</p> : null}
      </div>
      {state.error ? <div role="alert" className="rounded-md border border-[#efb6b0] bg-[#fff1ef] px-3 py-2 text-xs text-[#9e2017]">{state.error}</div> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />}
        {pending ? "Signing in" : "Sign in"}
      </Button>
    </form>
  );
}
