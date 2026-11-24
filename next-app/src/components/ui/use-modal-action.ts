"use client";

import { useActionState, useContext, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { toast } from "@/components/ui/toast";
import { ModalCloseContext } from "@/components/ui/modal-context";
import type { ActionState } from "@/lib/actions/types";

/**
 * Drop-in replacement for useActionState for forms. On success it shows a toast, refreshes the
 * current page's data in place and closes the surrounding modal (if any). Errors stay inline.
 */
export function useModalAction(action: (state: ActionState, formData: FormData) => Promise<ActionState>, initialState: ActionState) {
  const [state, formAction, pending] = useActionState(action, initialState);
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
