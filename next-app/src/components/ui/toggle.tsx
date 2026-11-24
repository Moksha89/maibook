"use client";

import { createElement, useId, useState, type ElementType, type InputHTMLAttributes, type ReactNode } from "react";
import { clsx } from "clsx";
import { Check, X } from "lucide-react";

type ToggleIcon = ElementType<{ className?: string; strokeWidth?: number }>;

const TRACK = "bg-[#8fa2ff]";
const KNOB = "bg-[#0033ff]";

export interface SegmentedOption { value: string; label: string; icon?: ToggleIcon }

/**
 * Two- or three-way choice: a periwinkle pill track with a bright blue pill that slides behind the active option.
 * Real radio inputs sit underneath, so it submits with a form (`name`) and works with the arrow keys.
 */
export function SegmentedToggle({ options, name, defaultValue, value, onChange, label, className, size = "sm" }: { options: SegmentedOption[]; name?: string; defaultValue?: string; value?: string; onChange?: (value: string) => void; label: string; className?: string; size?: "xs" | "sm" | "md" }) {
  const [inner, setInner] = useState(defaultValue ?? options[0]?.value ?? "");
  const groupId = useId();
  const current = value ?? inner;
  const index = Math.max(0, options.findIndex((option) => option.value === current));
  return (
    <div role="radiogroup" aria-label={label} className={clsx("relative inline-grid rounded-full p-0.5", TRACK, size === "md" ? "h-9" : size === "xs" ? "h-7" : "h-8", className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      <span aria-hidden className={clsx("pointer-events-none absolute inset-y-0.5 left-0.5 rounded-full shadow-sm transition-transform duration-[250ms] ease-out motion-reduce:transition-none", KNOB)} style={{ width: `calc((100% - 4px) / ${options.length})`, transform: `translateX(${index * 100}%)` }} />
      {options.map((option) => (
        <label key={option.value} className={clsx("relative z-10 flex cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold", size === "xs" ? "px-2.5 text-[10px]" : "px-3 text-xs", " transition-colors duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-white", option.value === current ? "text-white" : "text-white/60 hover:text-white/85")}>
          <input type="radio" name={name ?? groupId} value={option.value} checked={option.value === current} onChange={() => { setInner(option.value); onChange?.(option.value); }} className="sr-only" />
          {option.icon ? createElement(option.icon, { className: "size-3.5", strokeWidth: 2 }) : null}
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

/**
 * On/off switch in the same style: a pill track with a blue pill knob that slides between a cross (off) and a tick (on).
 * It is a native checkbox with role="switch", so it posts exactly like the checkbox it replaces (`name`, value "on").
 */
export function Switch({ label, className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role" | "className"> & { label?: ReactNode; className?: string }) {
  return (
    <label className={clsx("inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-[#0d1a2c] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-55", className)}>
      <span className="relative inline-block h-7 w-14 shrink-0">
        <input type="checkbox" role="switch" {...props} className="peer absolute inset-0 z-20 m-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed" />
        <span aria-hidden className={clsx("absolute inset-0 rounded-full transition-[box-shadow] peer-focus-visible:ring-2 peer-focus-visible:ring-[#0033ff] peer-focus-visible:ring-offset-1", TRACK, "opacity-70 peer-checked:opacity-100")} />
        <span aria-hidden className="absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-[#4a5a8a] shadow-sm transition-[transform,background-color] duration-[250ms] ease-out motion-reduce:transition-none peer-checked:translate-x-full peer-checked:bg-[#0033ff]" />
        <span aria-hidden className="absolute inset-y-0 left-0 grid w-1/2 place-items-center text-white transition-opacity duration-200 peer-checked:opacity-50"><X className="size-3.5" strokeWidth={2.5} /></span>
        <span aria-hidden className="absolute inset-y-0 right-0 grid w-1/2 place-items-center text-white opacity-50 transition-opacity duration-200 peer-checked:opacity-100"><Check className="size-3.5" strokeWidth={2.5} /></span>
      </span>
      {label ? <span>{label}</span> : null}
    </label>
  );
}
