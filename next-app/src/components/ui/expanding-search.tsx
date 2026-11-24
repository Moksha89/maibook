"use client";

import { useRef, useState } from "react";
import { clsx } from "clsx";
import { Search } from "lucide-react";

/**
 * A round search button that smoothly widens into a pill-shaped input when clicked.
 * Drop it inside any GET form: the input submits as `name` (default "q"). It stays open while it holds a value
 * (for example one restored from the URL) and collapses on Escape or on blur when empty.
 */
export function ExpandingSearch({ name = "q", defaultValue = "", placeholder = "What are you looking for ...", label = "Search", className, width = "w-60 sm:w-72" }: { name?: string; defaultValue?: string; placeholder?: string; label?: string; className?: string; width?: string }) {
  const [value, setValue] = useState(defaultValue);
  const [manualOpen, setManualOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const open = manualOpen || value.length > 0;

  function expand() {
    setManualOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div
      role="search"
      className={clsx("relative inline-flex h-8 max-w-full items-center overflow-hidden rounded-full border-[1.5px] bg-white transition-[width,border-color,box-shadow] duration-300 ease-out motion-reduce:transition-none focus-within:border-[#3b6ef5] focus-within:ring-2 focus-within:ring-[#3b6ef5]/25", open ? `${width} border-[#c6d0dc]` : "w-8 border-[#c6d0dc] hover:border-[#3b6ef5]", className)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null) && value.trim() === "") setManualOpen(false); }}
    >
      <input
        ref={inputRef}
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => { if (event.key === "Escape") { setValue(""); setManualOpen(false); event.currentTarget.blur(); } }}
        placeholder={placeholder}
        aria-label={label}
        autoComplete="off"
        tabIndex={open ? 0 : -1}
        className={clsx("h-full w-full min-w-0 bg-transparent pl-3.5 pr-8 text-[13px] text-[#0d1a2c] outline-none transition-opacity duration-200 placeholder:text-[#7a8a9c]", open ? "opacity-100" : "pointer-events-none opacity-0")}
      />
      <button
        type={open ? "submit" : "button"}
        aria-label={open ? `${label} — submit` : `${label} — open search`}
        aria-expanded={open}
        title={label}
        onClick={(event) => { if (!open) { event.preventDefault(); expand(); } }}
        className="absolute right-0 top-0 grid size-8 place-items-center rounded-full text-[#0d1a2c] hover:text-[#3b6ef5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ef5]/60"
      >
        <Search className="size-4" strokeWidth={2.4} />
      </button>
    </div>
  );
}
