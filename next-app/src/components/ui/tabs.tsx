"use client";

import { useRef, type KeyboardEvent } from "react";
import Link from "next/link";
import { clsx } from "clsx";

export interface TabItem { key: string; label: string; href?: string }

/**
 * Rounded blue tab bar with a white block that slides under the active tab.
 * Items with `href` navigate (query/URL stay as they were); items without it call `onChange`.
 * Tabs are equal width, scroll sideways on narrow screens, and respond to Arrow/Home/End keys.
 */
export function Tabs({ items, active, onChange, label, className, minTabWidth = 112 }: { items: TabItem[]; active: string; onChange?: (key: string) => void; label: string; className?: string; minTabWidth?: number }) {
  const listRef = useRef<HTMLDivElement>(null);
  const index = Math.max(0, items.findIndex((item) => item.key === active));

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const tabs = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]') ?? []);
    const current = tabs.indexOf(document.activeElement as HTMLElement);
    if (current < 0) return;
    const next = event.key === "ArrowRight" ? (current + 1) % tabs.length : event.key === "ArrowLeft" ? (current - 1 + tabs.length) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
    if (next < 0) return;
    event.preventDefault();
    tabs[next].focus();
  }

  return (
    <div className={clsx("overflow-x-auto rounded-[14px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}>
      <div ref={listRef} role="tablist" aria-label={label} onKeyDown={onKeyDown} className="relative grid rounded-[14px] bg-[#7aa5f5] p-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(${minTabWidth}px, 1fr))` }}>
        <span aria-hidden className="pointer-events-none absolute inset-y-1 left-1 rounded-[12px] border border-[#6b97ea] bg-white shadow-sm transition-transform duration-[250ms] ease-out motion-reduce:transition-none" style={{ width: `calc((100% - 8px) / ${items.length})`, transform: `translateX(${index * 100}%)` }} />
        {items.map((item) => {
          const selected = item.key === active;
          const classes = clsx("relative z-10 flex h-8 items-center justify-center whitespace-nowrap rounded-[12px] px-3 text-[13px] font-bold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#1d3f9e]", selected ? "text-[#3b5fd4]" : "text-white hover:text-white/85");
          return item.href ? (
            <Link key={item.key} href={item.href} role="tab" aria-selected={selected} tabIndex={selected ? 0 : -1} className={classes}>{item.label}</Link>
          ) : (
            <button key={item.key} type="button" role="tab" aria-selected={selected} tabIndex={selected ? 0 : -1} onClick={() => onChange?.(item.key)} className={classes}>{item.label}</button>
          );
        })}
      </div>
    </div>
  );
}
