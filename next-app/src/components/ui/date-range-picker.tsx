"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Eraser, X } from "lucide-react";

import { Button } from "@/components/ui/button";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ISO = /^\d{4}-\d{2}-\d{2}$/;

// All calendar maths uses plain YYYY-MM-DD strings (no timezone drift); "today" is taken in Asia/Kolkata.
export function istToday(): string { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date()); }
const toUtc = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return Date.UTC(y, m - 1, d); };
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const addDays = (iso: string, days: number) => fromUtc(toUtc(iso) + days * 86_400_000);
const firstOfMonth = (iso: string) => `${iso.slice(0, 7)}-01`;
const shortDate = (iso: string, withYear: boolean) => `${iso.slice(8, 10)} ${MONTHS[Number(iso.slice(5, 7)) - 1].slice(0, 3)}${withYear ? ` ${iso.slice(0, 4)}` : ""}`;

export function formatRange(from: string, to: string): string {
  if (!from || !to) return from ? `${shortDate(from, true)} – …` : "Select dates";
  if (from === to) return shortDate(from, true);
  return from.slice(0, 4) === to.slice(0, 4) ? `${shortDate(from, false)} – ${shortDate(to, true)}` : `${shortDate(from, true)} – ${shortDate(to, true)}`;
}

function monthGrid(monthStart: string): string[] {
  const first = toUtc(monthStart);
  const weekday = (new Date(first).getUTCDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(Date.UTC(Number(monthStart.slice(0, 4)), Number(monthStart.slice(5, 7)), 0)).getUTCDate();
  const rows = Math.ceil((weekday + daysInMonth) / 7);
  return Array.from({ length: rows * 7 }, (_, index) => fromUtc(first + (index - weekday) * 86_400_000));
}

const presets: { label: string; range: (today: string) => [string, string] }[] = [
  { label: "Today", range: (today) => [today, today] },
  { label: "Last 7 days", range: (today) => [addDays(today, -6), today] },
  { label: "Last 30 days", range: (today) => [addDays(today, -29), today] },
  { label: "This month", range: (today) => [firstOfMonth(today), today] },
  { label: "Last month", range: (today) => { const end = addDays(firstOfMonth(today), -1); return [firstOfMonth(end), end]; } },
];

export interface DateRangePickerProps { fromName: string; toName: string; defaultFrom?: string; defaultTo?: string; required?: boolean; label?: string; className?: string }

/**
 * Calendar-icon button that opens a range calendar. The first click sets From, the second sets To.
 * The chosen dates are posted as plain YYYY-MM-DD values under `fromName` and `toName`, exactly like two date inputs.
 */
export function DateRangePicker({ fromName, toName, defaultFrom = "", defaultTo = "", required = false, label = "Select dates", className }: DateRangePickerProps) {
  const [value, setValue] = useState({ from: ISO.test(defaultFrom) ? defaultFrom : "", to: ISO.test(defaultTo) ? defaultTo : "" });
  const [draft, setDraft] = useState<{ from: string; to: string }>(value);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => firstOfMonth(value.from || "2026-01-01"));
  const [hover, setHover] = useState("");
  const [today, setToday] = useState("");
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  function openPicker() {
    const now = istToday();
    setToday(now);
    setDraft(value);
    setHover("");
    setView(firstOfMonth(value.from || now));
    setOpen(true);
  }

  function close() { setOpen(false); triggerRef.current?.focus(); }

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(320, window.innerWidth - 16);
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
      const height = popoverRef.current?.offsetHeight ?? 420;
      const below = rect.bottom + 8;
      const top = below + height > window.innerHeight - 8 ? Math.max(8, rect.top - height - 8) : below;
      setPosition({ top, left });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [open, view]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { event.stopPropagation(); event.preventDefault(); close(); } };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey, true); // capture: keeps Escape from also closing a surrounding modal
    document.addEventListener("pointerdown", onPointer);
    popoverRef.current?.querySelector<HTMLElement>("button[data-day]")?.focus();
    return () => { window.removeEventListener("keydown", onKey, true); document.removeEventListener("pointerdown", onPointer); };
  }, [open]);

  const days = useMemo(() => monthGrid(view), [view]);
  const picking = Boolean(draft.from) && !draft.to;
  const shown = picking && hover ? (hover < draft.from ? { from: hover, to: draft.from } : { from: draft.from, to: hover }) : draft;
  const preview = picking && Boolean(hover);

  function pick(day: string) {
    if (!draft.from || draft.to) { setDraft({ from: day, to: "" }); return; }
    const next = day < draft.from ? { from: day, to: draft.from } : { from: draft.from, to: day };
    setDraft(next); setValue(next); setHover("");
  }

  function apply(from: string, to: string) { const next = { from, to }; setDraft(next); setValue(next); setView(firstOfMonth(from || today || istToday())); }

  function moveMonth(delta: number) { const y = Number(view.slice(0, 4)); const m = Number(view.slice(5, 7)) - 1 + delta; setView(fromUtc(Date.UTC(y, m, 1))); }

  const text = formatRange(value.from, value.to);
  const popover = open ? (
    <div ref={popoverRef} role="dialog" aria-label="Select a time range" style={{ top: position?.top ?? -9999, left: position?.left ?? -9999, width: Math.min(320, typeof window === "undefined" ? 320 : window.innerWidth - 16) }} className="fixed z-[90] rounded-xl border bg-white p-3 shadow-[0_12px_40px_rgba(8,17,31,0.22)]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#0d1a2c]">Select a time range</h3>
        <Button type="button" iconOnly size="xs" icon={X} onClick={close} aria-label="Close calendar" title="Close" />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">{presets.map((preset) => <button key={preset.label} type="button" onClick={() => { const [from, to] = preset.range(today || istToday()); apply(from, to); }} className="rounded-full border border-[#c6d0dc] px-2 py-0.5 text-[11px] font-semibold text-[#3b4d63] hover:border-[#3b6ef5] hover:bg-[#f3f6fb]">{preset.label}</button>)}</div>
      <div className="mt-3 flex items-center justify-between">
        <Button type="button" iconOnly size="xs" icon={ChevronLeft} onClick={() => moveMonth(-1)} aria-label="Previous month" />
        <div aria-live="polite" className="text-sm font-bold text-[#0d1a2c]">{MONTHS[Number(view.slice(5, 7)) - 1]} {view.slice(0, 4)}</div>
        <Button type="button" iconOnly size="xs" icon={ChevronRight} onClick={() => moveMonth(1)} aria-label="Next month" />
      </div>
      <div className="mt-1 grid grid-cols-7 text-center text-xs font-semibold text-[#2f62d9]">{WEEKDAYS.map((weekday) => <div key={weekday} className="py-1">{weekday}</div>)}</div>
      <div className="grid grid-cols-7 gap-y-1" onMouseLeave={() => setHover("")}>
        {days.map((day) => {
          const inMonth = day.slice(0, 7) === view.slice(0, 7);
          const start = shown.from === day;
          const end = shown.to === day;
          const startOnly = start && !shown.to;
          const inRange = startOnly || (Boolean(shown.from && shown.to) && day >= shown.from && day <= shown.to);
          const single = startOnly || (inRange && shown.from === shown.to);
          const isToday = day === today;
          return (
            <button key={day} type="button" data-day={day} aria-label={`${Number(day.slice(8))} ${MONTHS[Number(day.slice(5, 7)) - 1]} ${day.slice(0, 4)}`} aria-pressed={inRange || start} onMouseEnter={() => setHover(day)} onFocus={() => setHover(day)} onClick={() => pick(day)}
              className={clsx("relative h-8 text-[13px] font-medium outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[#3b6ef5]/70",
                inRange ? clsx(preview ? "bg-[#3b6ef5]/75" : "bg-[#3b6ef5]", "font-bold text-white", start && "rounded-l-full", end && "rounded-r-full", single && "rounded-full") : clsx("rounded-full hover:bg-[#edf1f4]", inMonth ? "text-[#0d1a2c]" : "text-[#8a98a8]", isToday && "ring-1 ring-inset ring-[#3b6ef5]/60"),
                inRange && !inMonth && "opacity-85")}>
              {Number(day.slice(8))}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-[11px] text-[#647386]">{picking ? "Now pick the end date" : draft.from ? formatRange(draft.from, draft.to) : "Pick the start date"}</p>
        <div className="flex gap-1.5">
          <Button type="button" size="xs" variant="secondary" icon={Eraser} onClick={() => { apply("", ""); }}>Clear</Button>
          <Button type="button" size="xs" icon={Check} onClick={close}>Done</Button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <span className={clsx("relative inline-flex", className)}>
      <input type="hidden" name={fromName} value={value.from} />
      <input type="hidden" name={toName} value={value.to} />
      {required ? <input aria-hidden tabIndex={-1} required value={value.from && value.to ? "ok" : ""} onChange={() => undefined} className="pointer-events-none absolute inset-0 opacity-0" /> : null}
      <Button ref={triggerRef} type="button" variant="secondary" icon={CalendarDays} aria-haspopup="dialog" aria-expanded={open} aria-label={`${label}: ${text}`} title={label} onClick={() => (open ? close() : openPicker())}>{text}</Button>
      {popover ? createPortal(popover, document.body) : null}
    </span>
  );
}
