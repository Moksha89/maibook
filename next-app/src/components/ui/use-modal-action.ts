"use client";

import { useActionState, useCallback, useContext, useEffect, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { toast } from "@/components/ui/toast";
import { ModalCloseContext } from "@/components/ui/modal-context";
import type { ActionState } from "@/lib/actions/types";

/** Turn a failed Server Action (including production React #441 / stale-deployment 404s) into an inline message. */
export function messageForServerActionError(error: unknown): { message: string; reload?: boolean } {
  const digest = (error as { digest?: string } | null)?.digest ?? "";
  if (digest.startsWith("NEXT_REDIRECT")) throw error;
  if (digest.startsWith("NEXT_HTTP_ERROR_FALLBACK;401")) return { message: "Your session has expired. Please sign in again." };
  if (digest.startsWith("NEXT_HTTP_ERROR_FALLBACK;403")) return { message: "You do not have permission to do this." };
  if (digest.startsWith("NEXT_HTTP_ERROR_FALLBACK;404")) return { message: "This action could not be completed. Refresh the page and try again." };
  const text = String((error as { message?: string } | null)?.message ?? "");
  if (/unexpected response|Failed to find Server Action|older or newer deployment|Minified React error #441/i.test(text)) {
    return { message: "Maibook was just updated. Reloading this page so you can try again…", reload: true };
  }
  if (error instanceof Error && error.message && !/^Minified React error/i.test(error.message)) return { message: error.message };
  return { message: "We could not save this. Check the details and try again." + (digest ? ` (ref ${digest.slice(0, 8)})` : "") };
}

/**
 * Drop-in replacement for useActionState for forms. On success it shows a toast, refreshes the
 * current page's data in place and closes the surrounding modal (if any). Errors stay inline.
 */
/** React clears an uncontrolled form after every submit. After a rejected submit, put back what the user typed. */
function restoreFormValues(form: HTMLFormElement, data: FormData) {
  const nativeSetter = (element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
    const proto = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    return Object.getOwnPropertyDescriptor(proto, "value")?.set;
  };
  for (const element of Array.from(form.elements) as (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[]) {
    const name = element.name;
    if (!name || !data.has(name) || element.disabled) continue;
    if (element instanceof HTMLInputElement) {
      if (element.type === "hidden" || element.type === "password" || element.type === "file" || element.type === "submit") continue;
      if (element.type === "checkbox" || element.type === "radio") { element.checked = data.getAll(name).map(String).includes(element.value); continue; }
    }
    const value = String(data.getAll(name)[0] ?? "");
    if (element.value === value) continue;
    nativeSetter(element)?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

export function useModalAction(action: (state: ActionState, formData: FormData) => Promise<ActionState>, initialState: ActionState) {
  const submitted = useRef<{ form: HTMLFormElement | null; data: FormData | null }>({ form: null, data: null });
  const safeAction = useCallback(async (state: ActionState, formData: FormData): Promise<ActionState> => {
    const active = typeof document !== "undefined" ? document.activeElement : null;
    const forms = typeof document !== "undefined" ? document.querySelectorAll<HTMLFormElement>('[role="dialog"] form') : [];
    submitted.current = { form: (active instanceof HTMLElement ? active.closest("form") : null) ?? (forms.length === 1 ? forms[0] : null), data: formData };
    try { return await action(state, formData); }
    catch (error) {
      const result = messageForServerActionError(error);
      if (result.reload) setTimeout(() => window.location.reload(), 1500);
      return { status: "error", message: result.message };
    }
  }, [action]);
  const [state, formAction, pending] = useActionState(safeAction, initialState);
  const close = useContext(ModalCloseContext);
  const router = useRouter();
  const handled = useRef<ActionState | null>(null);
  const restored = useRef<ActionState | null>(null);
  useLayoutEffect(() => {
    if (state.status !== "error" || restored.current === state) return;
    restored.current = state;
    const { form, data } = submitted.current;
    if (form?.isConnected && data) restoreFormValues(form, data);
  }, [state]);
  useEffect(() => {
    if (state.status !== "success" || handled.current === state) return;
    handled.current = state;
    toast(state.message || "Saved.");
    router.refresh();
    close?.();
  }, [state, close, router]);
  return [state, formAction, pending] as const;
}
