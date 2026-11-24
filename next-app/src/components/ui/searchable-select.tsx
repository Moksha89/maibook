"use client";

import { createElement, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ElementType, KeyboardEvent, ReactNode, SelectHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { clsx } from "clsx";

type Item = { value: string; label: string; disabled: boolean };
type Place = { left: number; width: number; top?: number; bottom?: number; maxHeight: number };

const valueSetter = typeof window === "undefined" ? undefined : Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;

/**
 * Dropdown with type-to-search. A real <select> stays underneath (invisible), so names, values,
 * onChange, defaultValue, required and form resets all behave exactly as before.
 */
export function SearchableSelect({ compact, leading, selectProps, children }: { compact?: boolean; leading: ElementType<{ className?: string; strokeWidth?: number }> | null; selectProps: SelectHTMLAttributes<HTMLSelectElement>; children: ReactNode }) {
  const selectRef = useRef<HTMLSelectElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [label, setLabel] = useState("");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState(0);
  const [place, setPlace] = useState<Place | null>(null);
  const [current, setCurrent] = useState("");
  const [fit, setFit] = useState<{ height: number; fontSize: string } | null>(null);

  const sync = useCallback(() => {
    const el = selectRef.current;
    if (!el) return;
    setLabel(el.selectedOptions[0]?.text ?? "");
    setCurrent(el.value);
  }, []);
  useLayoutEffect(sync);
  // Containers that resize <select> (compact modal fields, entry bars) resize the trigger the same way.
  useLayoutEffect(() => {
    const el = selectRef.current;
    const trigger = triggerRef.current;
    if (!el || !trigger || fit) return;
    const style = getComputedStyle(el);
    const height = Math.round(parseFloat(style.height));
    if (height && Math.abs(height - trigger.offsetHeight) > 1) setFit({ height, fontSize: style.fontSize });
  });
  useEffect(() => {
    const el = selectRef.current;
    const form = el?.form;
    const onReset = () => setTimeout(sync, 0);
    el?.addEventListener("change", sync);
    form?.addEventListener("reset", onReset);
    return () => { el?.removeEventListener("change", sync); form?.removeEventListener("reset", onReset); };
  }, [sync]);

  const close = useCallback((refocus = false) => { setOpen(false); setQuery(""); if (refocus) triggerRef.current?.focus(); }, []);

  const openList = (initial = "") => {
    const el = selectRef.current;
    const trigger = triggerRef.current;
    if (!el || !trigger || el.disabled) return;
    const options = [...el.options].map((option) => ({ value: option.value, label: option.text, disabled: option.disabled }));
    const rect = trigger.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 8;
    const above = rect.top - 8;
    const up = below < 220 && above > below;
    const maxHeight = Math.max(120, Math.min(300, up ? above : below));
    const width = Math.max(rect.width, 200);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    setPlace(up ? { left, width, bottom: window.innerHeight - rect.top + 4, maxHeight } : { left, width, top: rect.bottom + 4, maxHeight });
    setItems(options);
    setQuery(initial);
    setActive(initial ? 0 : Math.max(0, options.findIndex((option) => option.value === el.value)));
    setOpen(true);
  };

  const q = query.trim().toLowerCase();
  const filtered = q ? items.filter((item) => item.label.toLowerCase().includes(q)) : items;

  const pick = (item: Item | undefined) => {
    const el = selectRef.current;
    if (!item || item.disabled || !el) return;
    if (el.value !== item.value) {
      valueSetter?.call(el, item.value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
    sync();
    close(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (popRef.current?.contains(target) || triggerRef.current?.contains(target) || inputRef.current?.contains(target)) return;
      close();
    };
    const onScroll = (event: Event) => { if (!popRef.current?.contains(event.target as Node) && event.target !== inputRef.current) close(); };
    const onResize = () => close();
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => { document.removeEventListener("mousedown", onDown); window.removeEventListener("scroll", onScroll, true); window.removeEventListener("resize", onResize); };
  }, [open, close]);

  useEffect(() => { if (open) listRef.current?.children[active]?.scrollIntoView({ block: "nearest" }); }, [active, open]);

  const onTriggerKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) { event.preventDefault(); openList(); return; }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); openList(event.key); }
  };
  const onSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") { event.preventDefault(); setActive((index) => Math.min(filtered.length - 1, index + 1)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive((index) => Math.max(0, index - 1)); }
    else if (event.key === "Enter") { event.preventDefault(); event.stopPropagation(); pick(filtered[active]); }
    else if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(true); }
    else if (event.key === "Tab") close();
  };

  const invalid = selectProps["aria-invalid"] === true || selectProps["aria-invalid"] === "true";
  const disabled = Boolean(selectProps.disabled);

  return (
    <span className="relative block">
      <button
        ref={triggerRef}
        type="button"
        data-select-trigger=""
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={selectProps["aria-label"]}
        title={label || undefined}
        style={fit ? { height: fit.height, fontSize: fit.fontSize } : undefined}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onTriggerKey}
        className={clsx("relative flex w-full cursor-pointer items-center rounded-full border border-[#d5dbe6] bg-white text-left text-[#152235] outline-none transition-shadow focus:border-[#6a5cf5] focus:ring-[3px] focus:ring-[#6a5cf5]/20 disabled:cursor-not-allowed disabled:bg-[#f2f4f6] disabled:text-[#8a98a8]", invalid && "border-[#e5484d]", open && "border-[#6a5cf5] ring-[3px] ring-[#6a5cf5]/20", compact ? "h-8 text-xs" : "h-9 text-sm", leading ? (compact ? "pl-8" : "pl-9") : "pl-3.5", compact ? "pr-7" : "pr-8")}
      >
        {leading ? <span className={clsx("pointer-events-none absolute top-1/2 -translate-y-1/2 text-[#8a98a8]", compact ? "left-2.5" : "left-3")}>{createElement(leading, { className: compact ? "size-3.5" : "size-4", strokeWidth: 1.75 })}</span> : null}
        <span className="min-w-0 flex-1 truncate" style={open ? { visibility: "hidden" } : undefined}>{label || "\u00a0"}</span>
        <ChevronDown className={clsx("pointer-events-none absolute top-1/2 -translate-y-1/2 text-[#8a98a8]", compact ? "right-2.5 size-3.5" : "right-3 size-4")} strokeWidth={1.75} />
      </button>
      {open ? <input ref={inputRef} autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setActive(0); }} onKeyDown={onSearchKey} placeholder={label || "Search"} aria-label="Search options" autoComplete="off" style={{ position: "absolute", top: 0, bottom: 0, zIndex: 2, left: leading ? (compact ? 32 : 36) : 14, right: compact ? 28 : 32, width: "auto", height: "100%", minWidth: 0, background: "transparent", border: 0, outline: "none", padding: 0, fontSize: fit?.fontSize ?? (compact ? 12 : 14), color: "#152235" }} /> : null}
      <select ref={selectRef} tabIndex={-1} aria-hidden="true" {...selectProps} className="pointer-events-none absolute inset-0 h-full w-full opacity-0">{children}</select>
      {open && place ? createPortal(
        <div ref={popRef} style={{ position: "fixed", zIndex: 95, left: place.left, width: place.width, top: place.top, bottom: place.bottom, maxHeight: place.maxHeight }} className="fixed z-[95] flex flex-col overflow-hidden rounded-xl border border-[#d5dbe6] bg-white text-xs text-[#152235] shadow-lg">
          <ul ref={listRef} role="listbox" className="min-h-0 flex-1 overflow-y-auto py-1">
            {filtered.map((item, index) => (
              <li key={`${item.value}-${index}`} role="option" aria-selected={item.value === current} aria-disabled={item.disabled} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => pick(item)} className={clsx("flex cursor-pointer items-center gap-2 px-3 py-1.5", index === active && "bg-[#f0eeff]", item.disabled && "cursor-not-allowed text-[#8a98a8]")}>
                <span className="min-w-0 flex-1 truncate">{item.label || "\u00a0"}</span>
                {item.value === current ? <Check className="size-3.5 shrink-0 text-[#6a5cf5]" strokeWidth={2} /> : null}
              </li>
            ))}
            {!filtered.length ? <li className="px-3 py-2 text-[#8a98a8]">No matches</li> : null}
          </ul>
        </div>,
        document.body,
      ) : null}
    </span>
  );
}
