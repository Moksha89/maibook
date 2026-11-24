"use client";

import { createContext } from "react";

/** Set by FormModal so forms inside can offer a Cancel button. */
export const ModalCloseContext = createContext<(() => void) | null>(null);
