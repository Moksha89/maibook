"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/actions/types";
import { createApiTokenAction } from "./actions";

const scopes = [{ key: "companies:read", label: "Companies" }, { key: "agents:read", label: "Agents" }, { key: "settlements:read", label: "Settlements" }];
export function TokenForm() { const [state, action, pending] = useActionState(createApiTokenAction, {} as ActionState); const token = typeof state.data?.token === "string" ? state.data.token : null; return <form action={action} className="rounded-lg border bg-white p-3"><h2 className="mb-2 text-sm font-bold">Create API token</h2><div className="flex flex-wrap items-end gap-2"><label className="min-w-52 flex-1 text-xs font-semibold">Name<Input name="name" className="mt-1" maxLength={80} required /></label><fieldset className="flex min-h-9 flex-wrap items-center gap-3 rounded-md border px-3"><legend className="sr-only">Scopes</legend>{scopes.map((scope) => <label key={scope.key} className="flex items-center gap-1.5 text-xs"><input type="checkbox" name="scopes" value={scope.key} />{scope.label}</label>)}</fieldset><Button type="submit" disabled={pending}>{pending ? "Creating" : "Create token"}</Button></div>{state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}{token ? <div className="mt-2 rounded-md border border-[#efcf8e] bg-[#fff8e8] p-2"><code className="break-all text-xs font-semibold">{token}</code></div> : null}</form>; }
