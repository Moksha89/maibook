"use client";

import { createContext } from "react";

/** Set by FormModal so forms inside can offer a Cancel button and close on success. */
export const ModalCloseContext = createContext<(() => void) | null>(null);

/** Forms inside this scope keep the surrounding modal open after success (used for guided setup steps). */
export function NoCloseScope({ children }: { children: React.ReactNode }) {
  return <ModalCloseContext.Provider value={null}>{children}</ModalCloseContext.Provider>;
}
