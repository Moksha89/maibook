"use client";

import { useContext, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";

import { Button } from "@/components/ui/button";
import { ModalCloseContext } from "@/components/ui/modal-context";

/** Action row at the bottom of a form. Inside a modal it is sticky and gains a Cancel pill. */
export function FormFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  const close = useContext(ModalCloseContext);
  const rootRef = useRef<HTMLDivElement>(null);
  // Keep the submit button disabled until the whole form passes its (native + custom) validation.
  useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!form) return;
    const submit = () => rootRef.current?.querySelector<HTMLButtonElement>("button[type=submit]") ?? null;
    const sync = () => {
      const button = submit();
      if (!button) return;
      // Read validity without firing invalid events before the user interacts.
      const bad = form.querySelector<HTMLInputElement>(":invalid");
      if (!bad) {
        if (button.dataset.vdis === "1") { delete button.dataset.vdis; button.disabled = false; button.removeAttribute("title"); }
      } else if (!button.disabled && !button.querySelector(".animate-spin")) {
        button.dataset.vdis = "1"; button.disabled = true; button.title = `${bad.name || "A field"}: ${bad.validationMessage || "needs attention"}`;
      }
    };
    const later = () => { sync(); setTimeout(sync, 60); };
    const observer = new MutationObserver(sync);
    observer.observe(form, { attributes: true, subtree: true, attributeFilter: ["disabled", "min", "max", "required", "pattern"] });
    form.addEventListener("input", later); form.addEventListener("change", later); form.addEventListener("reset", () => setTimeout(sync, 0));
    const timer = setTimeout(sync, 0);
    return () => { observer.disconnect(); form.removeEventListener("input", later); form.removeEventListener("change", later); clearTimeout(timer); };
  }, []);
  return (
    <div ref={rootRef} className={clsx("mt-3 flex items-center justify-end gap-2", close && "sticky bottom-0 z-[5] -mx-4 -mb-4 rounded-b-[24px] border-t bg-white/95 px-4 py-2.5 backdrop-blur sm:-mx-5 sm:-mb-5 sm:px-5", className)}>
      {close ? <Button type="button" variant="secondary" size="sm" icon={X} onClick={close}>Cancel</Button> : null}
      {children}
    </div>
  );
}
