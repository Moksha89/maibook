"use client";

import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ModalCloseContext } from "@/components/ui/modal-context";
import type { CSSProperties } from "react";
import type { KeyboardEvent, Ref } from "react";

import { Input } from "@/components/ui/input";
import type { InputProps } from "@/components/ui/input";

type Props = Omit<InputProps, "value" | "onChange" | "list" | "ref"> & {
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
  inputRef?: Ref<HTMLInputElement>;
  /** Open the suggestion list above the field (default) or below it. */
  openUp?: boolean;
  /** Only suggest after the user has typed something (no full list on an empty field). */
  requireQuery?: boolean;
  /** Fill the rest of the first matching option into the field as the user types (selected, so typing on overwrites it). */
  inlineComplete?: boolean;
};

/** Forward a DOM node to a callback or object ref owned by the parent. */
function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) (ref as { current: T | null }).current = node;
}

/** Text field with a filter-as-you-type suggestion list (MyBook Advance style). Free text is still allowed. */
export function AutocompleteInput({ options, value, onValueChange, inputRef, openUp = true, requireQuery = false, inlineComplete = false, ...props }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [typed, setTyped] = useState<string | null>(null);
  const localRef = useRef<HTMLInputElement | null>(null);
  const selection = useRef<[number, number] | null>(null);
  const setRefs = useCallback((node: HTMLInputElement | null) => { localRef.current = node; assignRef(inputRef, node); }, [inputRef]);
  const query = (inlineComplete && typed !== null ? typed : value).trim().toLowerCase();
  const matches = useMemo(() => {
    if (requireQuery && !query) return [];
    const unique = [...new Set(options.map((option) => option.trim()).filter(Boolean))];
    const starts = unique.filter((option) => option.toLowerCase().startsWith(query));
    const contains = unique.filter((option) => !option.toLowerCase().startsWith(query) && option.toLowerCase().includes(query));
    return [...starts, ...contains].filter((option) => option.toLowerCase() !== query).slice(0, 8);
  }, [options, query, requireQuery]);
  useLayoutEffect(() => {
    if (selection.current && localRef.current) { localRef.current.setSelectionRange(selection.current[0], selection.current[1]); selection.current = null; }
  }, [value]);
  const show = open && matches.length > 0;
  // Inside a pop-up the list sits in the layout under the field, so the pop-up grows instead of the list covering its title or buttons.
  const inModal = Boolean(useContext(ModalCloseContext));
  const [place, setPlace] = useState<CSSProperties | null>(null);
  useEffect(() => {
    if (!show || inModal) return;
    const update = () => { const rect = localRef.current?.getBoundingClientRect(); if (!rect) return; const room = window.innerHeight - rect.bottom; const up = openUp ? rect.top > 180 || rect.top > room : room < 180 && rect.top > room; setPlace(up ? { position: "fixed", left: rect.left, width: rect.width, bottom: window.innerHeight - rect.top + 4 } : { position: "fixed", left: rect.left, width: rect.width, top: rect.bottom + 4 }); };
    update();
    window.addEventListener("resize", update); window.addEventListener("scroll", update, true);
    return () => { window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
  }, [show, openUp, inModal]);
  const pick = (option: string) => { onValueChange(option); setTyped(null); setOpen(false); setActive(-1); };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!show) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setActive((index) => (index + 1) % matches.length); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive((index) => (index <= 0 ? matches.length - 1 : index - 1)); }
    else if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setOpen(false); }
    else if (event.key === "Enter" && value.trim()) { event.preventDefault(); event.stopPropagation(); pick(matches[active >= 0 ? active : 0]); }
    else if (event.key === "Tab" && active >= 0) pick(matches[active]);
  };
  return (
    <span className="relative block min-w-0">
      <Input {...props} ref={setRefs} autoComplete="off" role="combobox" aria-expanded={show} aria-autocomplete={inlineComplete ? "both" : "list"} value={value}
        onChange={(event) => {
          const text = event.target.value;
          const inserting = (event.nativeEvent as InputEvent).inputType?.startsWith("insert");
          setOpen(true); setActive(-1);
          if (!inlineComplete) { onValueChange(text); return; }
          setTyped(text);
          const lower = text.toLowerCase();
          const completion = inserting && text.trim() ? options.find((option) => option.toLowerCase().startsWith(lower) && option.length > text.length) : undefined;
          if (completion) { selection.current = [text.length, completion.length]; onValueChange(text + completion.slice(text.length)); }
          else onValueChange(text);
        }}
        onFocus={(event) => { setOpen(true); props.onFocus?.(event); }}
        onBlur={(event) => { setTimeout(() => setOpen(false), 120); setTyped(null); props.onBlur?.(event); }}
        onKeyDown={onKeyDown} />
      {show && (inModal || place) ? <ul role="listbox" style={inModal ? undefined : place ?? undefined} className={`z-[90] max-h-56 font-normal overflow-y-auto rounded-xl border border-[#d5dbe6] bg-white py-1 text-sm shadow-[0_10px_30px_rgba(13,26,44,0.18)] ${inModal ? "mt-1 max-h-40 shadow-sm" : ""}`}>
        {matches.map((option, index) => <li key={option} role="option" aria-selected={index === active} onMouseDown={(event) => { event.preventDefault(); pick(option); }} onMouseEnter={() => setActive(index)} className={`cursor-pointer truncate px-3 py-1.5 ${index === active ? "bg-[#eef3ff] text-[#26407f]" : "text-[#152235]"}`}>{option}</li>)}
      </ul> : null}
    </span>
  );
}
