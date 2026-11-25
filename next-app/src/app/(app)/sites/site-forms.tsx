"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormFooter } from "@/components/ui/form-footer";
import { Input, Select } from "@/components/ui/input";
import { modalField, modalLabel } from "@/components/ui/form-styles";
import { useModalAction } from "@/components/ui/use-modal-action";
import type { ActionState } from "@/lib/actions/types";
import { assignSiteGroupAction, assignSitesToGroupAction, createSiteAction, updateSiteAction } from "./actions";

function ErrorLine({ state }: { state: ActionState }) {
  return state.status === "error" && state.message ? <p className="mt-2 text-xs text-red-600">{state.message}</p> : null;
}

export function SiteFormBody({ site, groupId, groups }: { site?: { id: string; name: string; uplinePercentage: string; uplineGroupId?: string | null }; groupId?: string; groups?: { id: string; label: string }[] }) {
  const [state, action, pending] = useModalAction(site ? updateSiteAction : createSiteAction, {} as ActionState);
  return <form action={action} className="grid gap-2 text-xs">
    {site ? <input type="hidden" name="siteId" value={site.id} /> : null}
    {!site && groupId ? <input type="hidden" name="uplineGroupId" value={groupId} /> : null}
    <label className={modalLabel}>Site name<Input uppercase name="name" defaultValue={site?.name} required className={modalField} /></label>
    <label className={modalLabel}>Upline %<Input name="uplinePercentage" type="number" min="0" max="100" step="0.0001" defaultValue={site?.uplinePercentage} required className={modalField} /></label>
    {groups && !groupId ? <label className={modalLabel}>Upline<Select name="uplineGroupId" defaultValue={site?.uplineGroupId ?? ""} className={modalField}><option value="">None</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}</Select></label> : null}
    <ErrorLine state={state} />
    <FormFooter className="!mt-1"><Button type="submit" size="sm" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{site ? "Save changes" : "Create"}</Button></FormFooter>
  </form>;
}

export function AssignSiteGroupBody({ siteId, currentGroupId, groups }: { siteId: string; currentGroupId: string | null; groups: { id: string; label: string }[] }) {
  const [state, action, pending] = useModalAction(assignSiteGroupAction, {} as ActionState);
  return <form action={action} className="grid gap-2 text-xs">
    <input type="hidden" name="siteId" value={siteId} />
    <label className={modalLabel}>Upline group<Select name="uplineGroupId" defaultValue={currentGroupId ?? ""} className={modalField}><option value="">None</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}</Select></label>
    <ErrorLine state={state} />
    <FormFooter className="!mt-1"><Button type="submit" size="sm" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}Save</Button></FormFooter>
  </form>;
}

export function AssignSiteToGroupBody({ groupId, sites }: { groupId: string; sites: { id: string; name: string }[] }) {
  const [state, action, pending] = useModalAction(assignSitesToGroupAction, {} as ActionState);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const needle = query.trim().toUpperCase();
  const selectedCount = sites.filter((site) => selected[site.id]).length;
  return <form action={action} className="grid gap-2 text-xs">
    <input type="hidden" name="uplineGroupId" value={groupId} />
    {sites.length > 8 ? <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-7 w-full rounded-full border border-[#d5dbe6] px-2.5 text-xs outline-none" /> : null}
    <div className="max-h-48 overflow-y-auto rounded-md border border-[#e8edf3] px-2 py-1">
      {sites.map((site) => {
        const hide = Boolean(needle) && !site.name.toUpperCase().includes(needle);
        return <label key={site.id} className={`flex items-center gap-1.5 py-0.5 ${hide ? "hidden" : ""}`}><input type="checkbox" name="siteId" value={site.id} checked={Boolean(selected[site.id])} onChange={(event) => setSelected((current) => ({ ...current, [site.id]: event.target.checked }))} /><span className="truncate font-semibold">{site.name}</span></label>;
      })}
    </div>
    <ErrorLine state={state} />
    <FormFooter className="!mt-1"><Button type="submit" size="sm" disabled={pending || !selectedCount}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}Assign</Button></FormFooter>
  </form>;
}
