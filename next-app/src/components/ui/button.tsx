import { Children, createElement, forwardRef, isValidElement, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ElementType, type ReactNode } from "react";
import { clsx } from "clsx";
import Link from "next/link";
import { Ban, Check, Database, Download, Eye, FileBarChart, Filter, KeyRound, LoaderCircle, LogIn, LogOut, Pencil, Plug, Plus, Power, PowerOff, Printer, RefreshCw, RotateCcw, Save, Search, Send, Trash2, Undo2, Unlink, Upload, X } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "dangerSoft" | "ghost";
export type ButtonSize = "sm" | "xs";

// Pill with a filled icon circle on the left. Primary mirrors the approved reference: dark fill, blue outline, blue circle.
const shell: Record<ButtonVariant, { box: string; circle: string }> = {
  primary: { box: "border-[#3b6ef5] bg-[#0b1220] text-white hover:bg-[#16233b]", circle: "bg-[#3b6ef5] text-white" },
  secondary: { box: "border-[#c6d0dc] bg-white text-[#203650] hover:border-[#3b6ef5] hover:bg-[#f3f6fb]", circle: "bg-[#e3ebff] text-[#3b6ef5]" },
  danger: { box: "border-[#e5484d] bg-[#0b1220] text-white hover:bg-[#16233b]", circle: "bg-[#e5484d] text-white" },
  dangerSoft: { box: "border-[#f0b4ae] bg-white text-[#b42318] hover:border-[#e5484d] hover:bg-[#fff1ef]", circle: "bg-[#fde8e6] text-[#d92d20]" },
  ghost: { box: "border-transparent bg-transparent text-[#53657a] hover:bg-[#edf1f4]", circle: "bg-[#e6ebf1] text-[#53657a]" },
};

// Icon-only actions: dark rounded-square tiles with thin white line icons; destructive ones turn red on hover.
const dark = "bg-[#1f1f1f] text-white ring-1 ring-black/10 hover:bg-[#3a3a3a] active:bg-[#4a4a4a]";
const tile: Record<ButtonVariant, string> = { primary: dark, secondary: dark, ghost: dark, danger: "bg-[#1f1f1f] text-white ring-1 ring-black/10 hover:bg-[#b42318] active:bg-[#8f1c13]", dangerSoft: "bg-[#1f1f1f] text-white ring-1 ring-black/10 hover:bg-[#b42318] active:bg-[#8f1c13]" };

const sizes: Record<ButtonSize, { box: string; circle: string; icon: string }> = {
  sm: { box: "h-8 gap-1.5 pr-3 text-[13px]", circle: "size-6", icon: "size-3.5" },
  xs: { box: "h-7 gap-1.5 pr-2.5 text-xs", circle: "size-5", icon: "size-3" },
};

export type PillIcon = ElementType<{ className?: string; strokeWidth?: number }>;

const iconRules: [RegExp, PillIcon][] = [
  [/unassign|unlink|detach/i, Unlink],
  [/sign\s?out|log\s?out/i, LogOut],
  [/sign\s?in|log\s?in|verify/i, LogIn],
  [/password/i, KeyRound],
  [/delete|remove|revoke/i, Trash2],
  [/deactivate|disable|suspend/i, PowerOff],
  [/activate|enable|resume/i, Power],
  [/reverse|undo/i, Undo2],
  [/restore|reset/i, RotateCcw],
  [/cancel|close|dismiss/i, X],
  [/download|export|\bpdf\b|\bcsv\b|\bexcel\b/i, Download],
  [/upload|import/i, Upload],
  [/backup|database/i, Database],
  [/whatsapp|send|deliver|notify/i, Send],
  [/initiali[sz]e|connect|link|pair/i, Plug],
  [/refresh|retry|try again|reload/i, RefreshCw],
  [/print/i, Printer],
  [/generate|report/i, FileBarChart],
  [/search|find/i, Search],
  [/filter|apply/i, Filter],
  [/edit|rename|modify/i, Pencil],
  [/save|update|submit|confirm/i, Save],
  [/add|create|new|register|record|assign|invite/i, Plus],
  [/open|view|show|details?/i, Eye],
  [/ban|block/i, Ban],
];

export function inferIcon(label: string): PillIcon {
  return iconRules.find(([pattern]) => pattern.test(label))?.[1] ?? Check;
}

/** Existing call sites pass a lucide icon (or the spinner) as the first child; reuse it as the circle icon. */
function splitChildren(children: ReactNode) {
  let icon: PillIcon | undefined;
  let loading = false;
  const label: ReactNode[] = [];
  for (const child of Children.toArray(children)) {
    if (isValidElement<{ className?: string; children?: ReactNode }>(child) && typeof child.type !== "string" && child.props.children === undefined && /\bsize-\d/.test(child.props.className ?? "")) {
      if ((child.props.className ?? "").includes("animate-spin")) loading = true;
      else icon ??= child.type as PillIcon;
      continue;
    }
    label.push(child);
  }
  const text = label.map((part) => (typeof part === "string" || typeof part === "number" ? String(part) : "")).join(" ").trim();
  return { icon, loading, label, text };
}

interface PillOptions { variant?: ButtonVariant; size?: ButtonSize; icon?: PillIcon; loading?: boolean; children?: ReactNode }

function Pill({ variant = "primary", size = "sm", icon, loading: loadingProp, children }: PillOptions) {
  const parsed = splitChildren(children);
  const loading = Boolean(loadingProp) || parsed.loading;
  const Icon = icon ?? parsed.icon ?? inferIcon(parsed.text);
  const s = sizes[size];
  return (
    <>
      <span className={clsx("grid shrink-0 place-items-center rounded-full transition-colors", s.circle, shell[variant].circle)}>{loading ? <LoaderCircle className={clsx(s.icon, "animate-spin")} /> : createElement(Icon, { className: s.icon })}</span>
      <span className="whitespace-nowrap">{parsed.label}</span>
    </>
  );
}

export function buttonClass({ variant = "primary", size = "sm", iconOnly = false, className }: { variant?: ButtonVariant; size?: ButtonSize; iconOnly?: boolean; className?: string } = {}) {
  const base = "inline-flex shrink-0 items-center justify-center rounded-full border-[1.5px] font-semibold transition select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ef5]/60 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:pointer-events-none aria-disabled:opacity-55";
  if (iconOnly) return clsx(base.replace("rounded-full border-[1.5px]", "rounded-[28%] border-0"), size === "xs" ? "size-7" : "size-8", tile[variant], className);
  return clsx(base, "pl-[3px]", sizes[size].box, shell[variant].box, className);
}

/** `iconOnly` renders the dark rounded-square icon tile; the label (children or aria-label) becomes the tooltip and accessible name. */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; icon?: PillIcon; loading?: boolean; iconOnly?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant = "primary", size = "sm", icon, loading, iconOnly = false, type = "button", children, disabled, ...props }, ref) {
  if (iconOnly) {
    const parsed = splitChildren(children);
    const Icon = icon ?? parsed.icon ?? (parsed.text ? inferIcon(parsed.text) : Search);
    const name = props["aria-label"] ?? (parsed.text || undefined);
    return <button ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined} {...props} aria-label={name} title={props.title ?? name} className={buttonClass({ variant, size, iconOnly: true, className })}>{loading ? <LoaderCircle className={clsx(size === "xs" ? "size-3.5" : "size-4", "animate-spin")} /> : createElement(Icon, { className: size === "xs" ? "size-3.5" : "size-4", strokeWidth: 1.75 })}</button>;
  }
  return <button ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClass({ variant, size, className })} {...props}><Pill variant={variant} size={size} icon={icon} loading={loading}>{children}</Pill></button>;
});

type LinkButtonProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string; variant?: ButtonVariant; size?: ButtonSize; icon?: PillIcon; iconOnly?: boolean; prefetch?: boolean };

/** Anchor styled as a pill. In-app pages use client navigation; API/file URLs use a plain anchor so downloads work. */
export function LinkButton({ href, className, variant = "secondary", size = "sm", icon, iconOnly = false, children, prefetch = false, ...props }: LinkButtonProps) {
  const plain = href.startsWith("/api/") || props.download !== undefined || /^https?:/.test(href);
  if (iconOnly) {
    const parsed = splitChildren(children);
    const Icon = icon ?? parsed.icon ?? (parsed.text ? inferIcon(parsed.text) : Eye);
    const name = props["aria-label"] ?? (parsed.text || undefined);
    const tileClass = buttonClass({ variant, size, iconOnly: true, className });
    const iconNode = createElement(Icon, { className: size === "xs" ? "size-3.5" : "size-4", strokeWidth: 1.75 });
    return plain ? <a href={href} {...props} aria-label={name} title={props.title ?? name} className={tileClass}>{iconNode}</a> : <Link href={href} prefetch={prefetch} {...props} aria-label={name} title={props.title ?? name} className={tileClass}>{iconNode}</Link>;
  }
  const classes = buttonClass({ variant, size, className });
  const content = <Pill variant={variant} size={size} icon={icon}>{children}</Pill>;
  return plain ? <a href={href} className={classes} {...props}>{content}</a> : <Link href={href} className={classes} prefetch={prefetch} {...props}>{content}</Link>;
}
