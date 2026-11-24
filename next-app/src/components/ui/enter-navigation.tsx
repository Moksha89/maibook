"use client";

import { useEffect } from "react";

const FIELD_SELECTOR = 'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="submit"]):not([disabled]), select:not([disabled])';

/** Pressing Enter in a form field moves to the next field; Enter on the last field submits the form. */
export function EnterNavigation() {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.metaKey || event.isComposing) return;
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
      const form = target.form;
      if (!form || target.closest("[data-enter-submit]")) return;
      const fields = Array.from(form.querySelectorAll<HTMLElement>(FIELD_SELECTOR)).filter((element) => element.offsetParent !== null);
      const index = fields.indexOf(target);
      if (index === -1 || index === fields.length - 1) return;
      event.preventDefault();
      const next = fields[index + 1];
      next.focus();
      if (next instanceof HTMLInputElement && ["text", "number", "email", "tel", "search", "url"].includes(next.type)) next.select();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
  return null;
}
