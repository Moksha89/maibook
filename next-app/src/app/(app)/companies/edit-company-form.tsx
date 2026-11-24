"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/actions/types";
import { updateCompanyAction } from "./actions";
import { dayStamp } from "@/lib/format";

export interface EditableCompany { id: string; name: string; code: string | null; notes: string | null; createdAt: string }
type Field = "name" | "code" | "createdAt" | "notes";
const fields: { key: Field; label: string }[] = [{ key: "name", label: "Company name" }, { key: "code", label: "Company code" }, { key: "createdAt", label: "Created date" }, { key: "notes", label: "Notes" }];

function show(company: EditableCompany, key: Field) {
  if (key === "createdAt") { const [y, m, d] = company.createdAt.split("-").map(Number); return dayStamp(new Date(Date.UTC(y, m - 1, d))); }
  return company[key] || "-";
}

export function EditCompanyForm({ company, canEdit = true }: { company: EditableCompany; canEdit?: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Field | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function open(key: Field) { setEditing(key); setDraft(key === "createdAt" ? company.createdAt : company[key] ?? ""); setError(""); }
  function cancel() { setEditing(null); setError(""); }
  function save(key: Field) {
    const data = new FormData();
    data.set("companyId", company.id); data.set("name", company.name); data.set("code", company.code ?? ""); data.set("notes", company.notes ?? "");
    data.set(key, draft);
    start(async () => {
      const result = await updateCompanyAction({} as ActionState, data);
      if (result.status === "error") { setError(result.message || "Could not save."); return; }
      setEditing(null); setError(""); router.refresh();
    });
  }

  return (
    <dl className="divide-y rounded-lg border bg-white text-xs">
      {fields.map(({ key, label }) => (
        <div key={key} className="flex min-h-11 items-center gap-3 px-3 py-1.5">
          <dt className="w-28 shrink-0 font-semibold text-[#647386]">{label}</dt>
          {editing === key ? (
            <dd className="flex min-w-0 flex-1 items-center gap-1.5">
              <form className="flex min-w-0 flex-1 items-center gap-1.5" onSubmit={(event) => { event.preventDefault(); save(key); }} onKeyDown={(event) => { if (event.key === "Escape") cancel(); }}>
                <Input uppercase={key === "name"} className={`min-w-0 flex-1 ${key === "name" ? "[&_input]:uppercase" : ""}`} aria-label={label} autoFocus type={key === "createdAt" ? "date" : "text"} value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={key === "notes" ? 2000 : key === "code" ? 30 : 120} required={key === "name" || key === "createdAt"} />
                <Button type="submit" size="xs" iconOnly icon={Check} loading={pending} className="!bg-[#ffc107] !text-[#111] !ring-0 hover:!brightness-110" aria-label={`Save ${label.toLowerCase()}`} title="Save" />
                <Button type="button" size="xs" iconOnly variant="secondary" icon={X} onClick={cancel} disabled={pending} className="!bg-[#795548] !text-white !ring-0 hover:!brightness-110" aria-label="Cancel" title="Cancel" />
              </form>
            </dd>
          ) : (
            <dd className="flex min-w-0 flex-1 items-center justify-between gap-2">
              <span className={`min-w-0 break-words font-semibold text-[#152235] ${key === "code" ? "font-mono" : ""}`}>{show(company, key)}</span>
              {canEdit ? <Button type="button" size="xs" iconOnly variant="secondary" icon={Pencil} onClick={() => open(key)} disabled={pending || (editing !== null && editing !== key)} className="shrink-0 !bg-[#2196f3] !text-white !ring-0 hover:!brightness-110" aria-label={`Edit ${label.toLowerCase()}`} title={`Edit ${label.toLowerCase()}`} /> : null}
            </dd>
          )}
        </div>
      ))}
      {error ? <p role="alert" className="px-3 py-2 text-xs text-[#b42318]">{error}</p> : null}
    </dl>
  );
}
