"use client";

import { useContext } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";

import { Button } from "@/components/ui/button";
import { ModalCloseContext } from "@/components/ui/modal-context";

/** Action row at the bottom of a form. Inside a modal it is sticky and gains a Cancel pill. */
export function FormFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  const close = useContext(ModalCloseContext);
  return (
    <div className={clsx("mt-3 flex items-center justify-end gap-2", close && "sticky bottom-0 z-[5] -mx-4 -mb-4 rounded-b-[24px] border-t bg-white/95 px-4 py-2.5 backdrop-blur sm:-mx-5 sm:-mb-5 sm:px-5", className)}>
      {close ? <Button type="button" variant="secondary" size="sm" icon={X} onClick={close}>Cancel</Button> : null}
      {children}
    </div>
  );
}
