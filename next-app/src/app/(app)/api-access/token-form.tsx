"use client";

import { useModalAction } from "@/components/ui/use-modal-action";
import { Button } from "@/components/ui/button";
import { NoCloseScope } from "@/components/ui/modal-context";
import { FormModal } from "@/components/ui/form-modal";
import { Input } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import type { ActionState } from "@/lib/actions/types";
import { createApiTokenAction } from "./actions";

const scopes = [{ key: "companies:read", label: "Companies" }, { key: "agents:read", label: "Agents" }, { key: "settlements:read", label: "Settlements" }];
function TokenFormBody() {
  const [state, action, pending] = useModalAction(createApiTokenAction, {} as ActionState);
  const token = typeof state.data?.token === "string" ? state.data.token : null;
  return <><form action={action} className="rounded-lg border bg-white p-3"><label className="text-xs font-semibold">Name<Input name="name" className="mt-1" maxLength={80} required /></label><fieldset className="mt-2 flex min-h-9 flex-wrap items-center gap-3 rounded-md border px-3"><legend className="sr-only">Scopes</legend>{scopes.map((scope) => <label key={scope.key} className="flex items-center gap-1.5 text-xs"><input type="checkbox" name="scopes" value={scope.key} />{scope.label}</label>)}</fieldset>{state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}{token ? <div className="mt-2 rounded-md border border-[#efcf8e] bg-[#fff8e8] p-2"><code className="break-all text-xs font-semibold">{token}</code></div> : null}<FormFooter><Button type="submit" disabled={pending}>{pending ? "Creating" : "Create token"}</Button></FormFooter></form></>;
}

export function TokenForm() {
  // The new token is shown once inside the modal, so this modal stays open after creating it.
  return <FormModal trigger="Create token" title="Create API token"><NoCloseScope><TokenFormBody /></NoCloseScope></FormModal>;
}
