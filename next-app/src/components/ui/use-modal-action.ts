"use client";

import { useActionState, useCallback, useContext, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { toast } from "@/components/ui/toast";
import { ModalCloseContext } from "@/components/ui/modal-context";
import type { ActionState } from "@/lib/actions/types";

/**
 * Drop-in replacement for useActionState for forms. On success it shows a toast, refreshes the
 * current page's data in place and closes the surrounding modal (if any). Errors stay inline.
 */
export function useModalAction(action: (state: ActionState, formData: FormData) => Promise<ActionState>, initialState: ActionState) {
  const safeAction = useCallback(async (state: ActionState, formData: FormData): Promise<ActionState> => {
    try { return await action(state, formData); }
    catch (error) {
      // Redirects/navigation signals must keep working; everything else becomes a friendly inline error.
      const digest = (error as { digest?: string } | null)?.digest ?? "";
      if (digest.startsWith("NEXT_REDIRECT")) throw error;
      if (digest.startsWith("NEXT_HTTP_ERROR_FALLBACK;401")) return { status: "error", message: "Your session has expired. Please sign in again." };
      if (digest.startsWith("NEXT_HTTP_ERROR_FALLBACK;403")) return { status: "error", message: "You do not have permission to do this." };
      const text = String((error as { message?: string } | null)?.message ?? "");
      if (/unexpected response|Failed to find Server Action|older or newer deployment/i.test(text)) {
        // The site was updated while this tab stayed open: the page's scripts no longer match the server.
        setTimeout(() => window.location.reload(), 1500);
        return { status: "error", message: "Maibook was just updated. Reloading this page so you can try again…" };
      }
      return { status: "error", message: "We could not save this. Check the details and try again." + (digest ? ` (ref ${digest.slice(0, 8)})` : "") };
    }
  }, [action]);
  const [state, formAction, pending] = useActionState(safeAction, initialState);
  const close = useContext(ModalCloseContext);
  const router = useRouter();
  const handled = useRef<ActionState | null>(null);
  useEffect(() => {
    if (state.status !== "success" || handled.current === state) return;
    handled.current = state;
    toast(state.message || "Saved.");
    router.refresh();
    close?.();
  }, [state, close, router]);
  return [state, formAction, pending] as const;
}
