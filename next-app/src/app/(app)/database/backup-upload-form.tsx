"use client";

import { useModalAction } from "@/components/ui/use-modal-action";

import { LoaderCircle, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/actions/types";

/** Posts to the dedicated upload route (the only endpoint with the large body limit). */
async function uploadBackup(_: ActionState, formData: FormData): Promise<ActionState> {
  const response = await fetch("/api/backups/upload", { method: "POST", body: formData, credentials: "same-origin" }).catch(() => null);
  if (!response) return { status: "error", message: "The upload failed. Check your connection and try again." };
  if (response.status === 401) return { status: "error", message: "Your session has expired. Please sign in again." };
  if (response.status === 403) return { status: "error", message: "You do not have permission to do this." };
  if (response.status === 413) return { status: "error", message: "The archive is larger than the upload limit." };
  return (await response.json().catch(() => null)) as ActionState | null ?? { status: "error", message: "The archive could not be validated." };
}

export function BackupUploadForm() {
  const [state, action, pending] = useModalAction(uploadBackup, {} as ActionState);
  return (
    <form action={action} className="mb-3 rounded-lg border bg-white p-3">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-bold"><Upload className="size-4 text-[#a97819]" />Upload a backup archive</h2>
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="text-xs font-bold text-[#0d1a2c]">Archive (.dump, pg_dump -Fc)<Input name="archive" type="file" accept=".dump,.backup" className="mt-1" required /></label>
        <label className="text-xs font-bold text-[#0d1a2c]">SHA-256 (optional)<Input name="checksum" className="mt-1 font-mono" maxLength={64} /></label>
        <Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Validating" : "Upload and validate"}</Button>
      </div>
      {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
    </form>
  );
}
