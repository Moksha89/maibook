"use client";

import { createElement, useEffect, useRef, useState } from "react";
import type { ElementType, InputHTMLAttributes, ReactNode, Ref, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Building2, CalendarDays, ChevronDown, ChevronUp, Coins, Eye, EyeOff, FileText, Gauge, Hash, Info, Link2, LockKeyhole, Mail, PencilLine, Shield, Smartphone, StickyNote, Tag, UserRound, Users } from "lucide-react";
import { clsx } from "clsx";

type FieldIcon = ElementType<{ className?: string; strokeWidth?: number }>;

const ring = "focus-within:border-[#6a5cf5] focus-within:ring-[3px] focus-within:ring-[#6a5cf5]/20";
const pillBase = "flex h-9 items-stretch overflow-hidden rounded-full border border-[#d5dbe6] bg-white text-sm text-[#152235] transition-shadow has-[:disabled]:bg-[#f2f4f6] has-[[aria-invalid=true]]:border-[#e5484d] has-[[aria-invalid=true]]:ring-[#e5484d]/15";
const bareInput = "min-w-0 flex-1 bg-transparent px-2 text-sm text-[#152235] outline-none placeholder:text-[#8a98a8] disabled:text-[#8a98a8]";
const plainTypes = new Set(["hidden", "file", "checkbox", "radio", "range", "color", "submit", "button"]);

function pickIcon(name: string, type: string, autoComplete?: string): FieldIcon | null {
  const n = `${name} ${autoComplete ?? ""}`.toLowerCase();
  if (type === "password") return LockKeyhole;
  if (type === "email" || /email/.test(n)) return Mail;
  if (type === "tel" || /phone/.test(n)) return null;
  if (type === "date") return null;
  if (/amount|balance/.test(n)) return null;
  if (/percent|share/.test(n)) return null;
  if (/coins/.test(n)) return Coins;
  if (/rate/.test(n)) return Gauge;
  if (/device/.test(n)) return Smartphone;
  if (/code|identifier|token|key/.test(n)) return Hash;
  if (/note|description|reason/.test(n)) return StickyNote;
  if (/url|link|website/.test(n)) return Link2;
  if (/name|user|owner|agent/.test(n)) return UserRound;
  return PencilLine;
}

function IndiaFlag() {
  return (
    <svg viewBox="0 0 20 20" className="size-4 shrink-0" aria-hidden="true">
      <defs><clipPath id="in-flag"><circle cx="10" cy="10" r="9" /></clipPath></defs>
      <g clipPath="url(#in-flag)"><rect width="20" height="7" fill="#ff9933" /><rect y="7" width="20" height="6" fill="#fff" /><rect y="13" width="20" height="7" fill="#138808" /><circle cx="10" cy="10" r="2" fill="none" stroke="#000080" strokeWidth="0.8" /></g>
      <circle cx="10" cy="10" r="9" fill="none" stroke="#d5dbe6" strokeWidth="0.6" />
    </svg>
  );
}

function strengthOf(value: string) {
  const checks = [value.length >= 8, /[a-z]/.test(value) && /[A-Z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)];
  return checks.filter(Boolean).length;
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  icon?: FieldIcon | null;
  prefix?: ReactNode;
  suffix?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  strength?: boolean;
  reveal?: boolean;
  stepper?: boolean;
  ref?: Ref<HTMLInputElement>;
}

function BaseInput({ className, icon, prefix, suffix, hint, error, strength, reveal = true, stepper, ref, type = "text", ...props }: InputProps) {
  const innerRef = useRef<HTMLInputElement | null>(null);
  const [shown, setShown] = useState(false);
  const [value, setValue] = useState("");
  const name = props.name ?? "";
  const isPassword = type === "password";
  const isNumber = type === "number";
  const isDate = type === "date";
  const isAmount = isNumber && /amount|balance/i.test(name);
  const isPercent = isNumber && /percent/i.test(name);
  const showStrength = strength ?? (isPassword && props.autoComplete === "new-password" && !/confirm/i.test(name));
  const showStepper = stepper ?? (isNumber && !isAmount && !isPercent);

  useEffect(() => {
    if (!showStrength) return;
    const input = innerRef.current;
    const form = input?.form;
    if (!input || !form) return;
    const sync = () => setTimeout(() => setValue(input.value), 0);
    form.addEventListener("reset", sync);
    return () => form.removeEventListener("reset", sync);
  }, [showStrength]);

  const setRefs = (node: HTMLInputElement | null) => {
    innerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as { current: HTMLInputElement | null }).current = node;
  };

  if (plainTypes.has(type)) return <input ref={setRefs} type={type} className={className} {...props} />;

  const bump = (direction: 1 | -1) => {
    const input = innerRef.current;
    if (!input || input.disabled || input.readOnly) return;
    const step = Number(input.step);
    const inc = Number.isFinite(step) && step >= 0.01 ? step : 1;
    const current = Number.parseFloat(input.value);
    let next = (Number.isFinite(current) ? current : 0) + direction * inc;
    if (input.min !== "" && next < Number(input.min)) next = Number(input.min);
    if (input.max !== "" && next > Number(input.max)) next = Number(input.max);
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, String(Number(next.toFixed(8))));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.focus();
  };

  const leading = icon === undefined ? pickIcon(name, type, props.autoComplete) : icon;
  const score = strengthOf(value);
  const strengthText = !value ? "Use 8+ characters with upper & lower case, a number and a symbol." : ["Too weak", "Weak password", "Fair password", "Good password", "Strong password"][score];
  const barColor = score <= 1 ? "bg-[#e5484d]" : score === 2 ? "bg-[#f5a524]" : "bg-[#2fb36a]";
  const { onInput, ...rest } = props;
  const trailBtn = "grid w-8 shrink-0 place-items-center text-[#8a98a8] hover:text-[#152235] focus-visible:text-[#152235] focus-visible:outline-none";

  return (
    <span className={clsx("block min-w-0", className)}>
      <span className={clsx(pillBase, ring)}>
        {isAmount ? <span className="grid place-items-center pl-2.5"><span className="grid size-5 place-items-center rounded-full border border-[#c3ccda] text-[11px] font-bold text-[#3b4d63]" aria-hidden="true">₹</span></span> : null}
        {leading && !isAmount ? <span className="grid w-8 shrink-0 place-items-center pl-1 text-[#8a98a8]">{createElement(leading, { className: "size-4", strokeWidth: 1.75 })}</span> : null}
        {prefix ? <span className="flex shrink-0 items-center border-r border-[#e3e8ef] bg-[#f6f8fb] pl-3 pr-2.5 text-xs font-medium text-[#647386]">{prefix}</span> : null}
        <input
          ref={setRefs}
          type={isPassword && reveal && shown ? "text" : type}
          className={clsx(bareInput, isNumber && "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none", isDate && "[&::-webkit-calendar-picker-indicator]:hidden", !leading && !isAmount && !prefix && "pl-3.5")}
          onInput={(event) => { if (showStrength) setValue(event.currentTarget.value); onInput?.(event); }}
          {...rest}
        />
        {isPercent ? <span className="flex shrink-0 items-center border-l border-[#e3e8ef] px-3 text-xs font-semibold text-[#647386]" aria-hidden="true">%</span> : null}
        {suffix ? <span className="flex shrink-0 items-center border-l border-[#e3e8ef] bg-[#f6f8fb] px-3 text-xs font-medium text-[#647386]">{suffix}</span> : null}
        {isPassword && reveal ? <button type="button" className={trailBtn} aria-label={shown ? "Hide password" : "Show password"} title={shown ? "Hide password" : "Show password"} onClick={() => setShown((v) => !v)}>{shown ? <EyeOff className="size-4" strokeWidth={1.75} /> : <Eye className="size-4" strokeWidth={1.75} />}</button> : null}
        {isDate ? <button type="button" className={trailBtn} aria-label={`Open calendar${name ? ` for ${name}` : ""}`} title="Open calendar" tabIndex={-1} onClick={() => { try { innerRef.current?.showPicker(); } catch { innerRef.current?.focus(); } }}><CalendarDays className="size-4" strokeWidth={1.75} /></button> : null}
        {showStepper ? <span className="flex w-6 shrink-0 flex-col border-l border-[#e3e8ef] text-[#8a98a8]"><button type="button" tabIndex={-1} className="grid flex-1 place-items-center hover:bg-[#eef1f6] hover:text-[#152235]" aria-label={`Increase ${name || "value"}`} onClick={() => bump(1)}><ChevronUp className="size-3" strokeWidth={2} /></button><button type="button" tabIndex={-1} className="grid flex-1 place-items-center border-t border-[#e3e8ef] hover:bg-[#eef1f6] hover:text-[#152235]" aria-label={`Decrease ${name || "value"}`} onClick={() => bump(-1)}><ChevronDown className="size-3" strokeWidth={2} /></button></span> : null}
      </span>
      {showStrength ? <span className="mt-1 block" data-strength={score}><span className="flex gap-1" aria-hidden="true">{[1, 2, 3, 4].map((segment) => <span key={segment} className={clsx("h-1 flex-1 rounded-full transition-colors", value && segment <= score ? barColor : "bg-[#dfe5ee]")} />)}</span><span className="mt-0.5 block text-[11px] font-normal text-[#647386]" aria-live="polite">{strengthText}</span></span> : null}
      {error ? <span role="alert" className="mt-1 flex items-center gap-1 text-[11px] font-normal text-[#b42318]"><Info className="size-3" />{error}</span> : hint ? <span className="mt-1 block text-[11px] font-normal text-[#647386]">{hint}</span> : null}
    </span>
  );
}

const countries = [
  { iso: "IN", name: "India", dial: "91", min: 10, max: 10 },
  { iso: "US", name: "United States", dial: "1", min: 10, max: 10 },
  { iso: "GB", name: "United Kingdom", dial: "44", min: 10, max: 10 },
  { iso: "AE", name: "United Arab Emirates", dial: "971", min: 9, max: 9 },
  { iso: "SA", name: "Saudi Arabia", dial: "966", min: 9, max: 9 },
  { iso: "QA", name: "Qatar", dial: "974", min: 8, max: 8 },
  { iso: "SG", name: "Singapore", dial: "65", min: 8, max: 8 },
  { iso: "AU", name: "Australia", dial: "61", min: 9, max: 9 },
  { iso: "LK", name: "Sri Lanka", dial: "94", min: 9, max: 9 },
  { iso: "NP", name: "Nepal", dial: "977", min: 10, max: 10 },
  { iso: "BD", name: "Bangladesh", dial: "880", min: 10, max: 10 },
  { iso: "PK", name: "Pakistan", dial: "92", min: 10, max: 10 },
] as const;
type Country = (typeof countries)[number];
const india = countries[0];

function parsePhone(raw: string): { country: Country; national: string } {
  const text = raw.trim();
  const digits = text.replace(/\D/g, "");
  if (text.startsWith("+")) {
    const hit = [...countries].sort((a, b) => b.dial.length - a.dial.length).find((c) => digits.startsWith(c.dial));
    if (hit) return { country: hit, national: digits.slice(hit.dial.length) };
  }
  if (digits.length === 12 && digits.startsWith("91")) return { country: india, national: digits.slice(2) };
  if (digits.length === 11 && digits.startsWith("0")) return { country: india, national: digits.slice(1) };
  return { country: india, national: digits };
}

function formatNational(country: Country, national: string) {
  const digits = national.slice(0, country.iso === "IN" ? 10 : 15);
  return country.iso === "IN" && digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;
}

function phoneProblem(country: Country, national: string) {
  if (!national) return "";
  if (country.iso === "IN") return /^[6-9]\d{9}$/.test(national) ? "" : "Enter a valid 10-digit Indian mobile number (starts with 6, 7, 8 or 9).";
  return national.length >= country.min && national.length <= 15 ? "" : `Enter a valid ${country.name} phone number.`;
}

  /* eslint-disable @typescript-eslint/no-unused-vars */
function PhoneField({ className, hint, error, ref, onChange, onBlur, defaultValue, placeholder, icon: _i, prefix: _p, suffix: _s, strength: _st, reveal: _r, stepper: _sp, ...props }: InputProps) {
  delete (props as { value?: unknown }).value;
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const initial = String(defaultValue ?? "");
  const innerRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState(() => parsePhone(initial));
  const [touched, setTouched] = useState(false);
  const { country, national } = state;
  const problem = phoneProblem(country, national);
  const canonical = national ? `+${country.dial} ${formatNational(country, national)}` : "";
  const latest = useRef(canonical);
  useEffect(() => { latest.current = canonical; }, [canonical]);
  const name = props.name;

  useEffect(() => { innerRef.current?.setCustomValidity(problem); }, [problem]);
  useEffect(() => {
    const form = innerRef.current?.form;
    if (!form) return;
    const onFormData = (event: FormDataEvent) => { if (name) event.formData.set(name, latest.current); };
    const onReset = () => setTimeout(() => { setState(parsePhone(initial)); setTouched(false); }, 0);
    form.addEventListener("formdata", onFormData);
    form.addEventListener("reset", onReset);
    return () => { form.removeEventListener("formdata", onFormData); form.removeEventListener("reset", onReset); };
  }, [name, initial]);

  const setRefs = (node: HTMLInputElement | null) => {
    innerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as { current: HTMLInputElement | null }).current = node;
  };
  const showError = touched && Boolean(problem);

  return (
    <span className={clsx("block min-w-0", className)}>
      <span className={clsx(pillBase, ring)}>
        <span className="relative flex shrink-0 items-center gap-1.5 border-r border-[#e3e8ef] pl-3 pr-2 text-xs font-semibold text-[#3b4d63]">
          {country.iso === "IN" ? <IndiaFlag /> : <span className="grid h-4 min-w-5 place-items-center rounded-full bg-[#e7ecf6] px-1 text-[9px] font-bold text-[#3b4d63]">{country.iso}</span>}
          +{country.dial}
          <ChevronDown className="size-3 text-[#8a98a8]" strokeWidth={2} aria-hidden="true" />
          <select aria-label="Country code" title="Country code" className="absolute inset-0 cursor-pointer opacity-0" value={country.iso} disabled={props.disabled} onChange={(event) => { const next = countries.find((c) => c.iso === event.target.value) ?? india; setState({ country: next, national: national.slice(0, next.iso === "IN" ? 10 : 15) }); }}>
            {countries.map((c) => <option key={c.iso} value={c.iso}>{c.name} (+{c.dial})</option>)}
          </select>
        </span>
        <input
          ref={setRefs}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          className={bareInput}
          placeholder={country.iso === "IN" ? "98765 43210" : placeholder ?? "Phone number"}
          aria-invalid={showError || undefined}
          value={formatNational(country, national)}
          onChange={(event) => {
            const raw = event.target.value;
            const digits = raw.replace(/\D/g, "");
            const reparse = raw.trim().startsWith("+") || (country.iso === "IN" && digits.length > 10);
            setState(reparse ? parsePhone(raw) : { country, national: digits.slice(0, country.iso === "IN" ? 10 : 15) });
            onChange?.(event);
          }}
          onBlur={(event) => { setTouched(true); onBlur?.(event); }}
          {...props}
        />
      </span>
      {showError ? <span role="alert" className="mt-1 flex items-center gap-1 text-[11px] font-normal text-[#b42318]"><Info className="size-3" />{error ?? problem}</span> : error ? <span role="alert" className="mt-1 text-[11px] text-[#b42318]">{error}</span> : <span className="mt-1 block text-[11px] font-normal text-[#647386]">{hint ?? (country.iso === "IN" ? "10-digit Indian mobile number, e.g. 98765 43210." : `Number without the +${country.dial} prefix.`)}</span>}
    </span>
  );
}

export function Input(props: InputProps) {
  const type = props.type ?? "text";
  const isPhone = type === "tel" || /phone/i.test(props.name ?? "") || props.inputMode === "tel";
  return isPhone && !plainTypes.has(type) ? <PhoneField {...props} /> : <BaseInput {...props} />;
}

export const PasswordInput = (props: InputProps) => <Input {...props} type="password" />;
export const AmountInput = (props: InputProps) => <Input name="amount" {...props} type="number" />;
export const PhoneInput = (props: InputProps) => <Input {...props} type="tel" />;

function pickSelectIcon(name: string): FieldIcon {
  const n = name.toLowerCase();
  if (/company/.test(n)) return Building2;
  if (/agent|sender|receiver|owner/.test(n)) return UserRound;
  if (/upline|share/.test(n)) return Users;
  if (/role|access/.test(n)) return Shield;
  if (/format|report|template/.test(n)) return FileText;
  if (/identifier/.test(n)) return Hash;
  if (/user/.test(n)) return UserRound;
  return Tag;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { icon?: FieldIcon | null; compact?: boolean; hint?: ReactNode; error?: ReactNode }

export function Select({ className, icon, compact, hint, error, children, ...props }: SelectProps) {
  if (props.multiple) return <span className={clsx("block", className)}><select className="min-h-9 w-full rounded-2xl border border-[#d5dbe6] bg-white px-2 py-1 text-sm outline-none focus:border-[#6a5cf5] focus:ring-[3px] focus:ring-[#6a5cf5]/20" {...props}>{children}</select>{hint ? <span className="mt-1 block text-[11px] text-[#647386]">{hint}</span> : null}</span>;
  const leading = icon === undefined ? pickSelectIcon(props.name ?? "") : icon;
  return (
    <span className={clsx("relative min-w-0", compact ? "inline-block" : "block", className)}>
      {leading ? <span className={clsx("pointer-events-none absolute top-1/2 -translate-y-1/2 text-[#8a98a8]", compact ? "left-2.5" : "left-3")}>{createElement(leading, { className: compact ? "size-3.5" : "size-4", strokeWidth: 1.75 })}</span> : null}
      <select
        className={clsx("w-full cursor-pointer appearance-none truncate rounded-full border border-[#d5dbe6] bg-white text-[#152235] outline-none transition-shadow focus:border-[#6a5cf5] focus:ring-[3px] focus:ring-[#6a5cf5]/20 disabled:cursor-not-allowed disabled:bg-[#f2f4f6] disabled:text-[#8a98a8] aria-[invalid=true]:border-[#e5484d]", compact ? "h-8 text-xs" : "h-9 text-sm", leading ? (compact ? "pl-8" : "pl-9") : "pl-3.5", compact ? "pr-7" : "pr-8")}
        {...props}
      >{children}</select>
      <ChevronDown className={clsx("pointer-events-none absolute top-1/2 -translate-y-1/2 text-[#8a98a8]", compact ? "right-2.5 size-3.5" : "right-3 size-4")} strokeWidth={1.75} />
      {error ? <span role="alert" className="mt-1 block text-[11px] text-[#b42318]">{error}</span> : hint ? <span className="mt-1 block text-[11px] text-[#647386]">{hint}</span> : null}
    </span>
  );
}

export function Textarea({ className, hint, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { hint?: ReactNode }) {
  return <span className={clsx("block", className)}><textarea className="min-h-9 w-full rounded-2xl border border-[#d5dbe6] bg-white px-3.5 py-2 text-sm text-[#152235] outline-none placeholder:text-[#8a98a8] focus:border-[#6a5cf5] focus:ring-[3px] focus:ring-[#6a5cf5]/20 disabled:bg-[#f2f4f6]" {...props} />{hint ? <span className="mt-1 block text-[11px] text-[#647386]">{hint}</span> : null}</span>;
}
