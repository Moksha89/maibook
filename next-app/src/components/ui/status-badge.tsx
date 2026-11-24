import { clsx } from "clsx";

export function StatusBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" }) {
  return <span className={clsx("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold", tone === "neutral" && "border-[#d5dce3] bg-[#f4f6f8] text-[#53657a]", tone === "success" && "border-[#a7d8c1] bg-[#ecf8f2] text-[#16794b]", tone === "warning" && "border-[#ecd49f] bg-[#fff8e7] text-[#8a6012]", tone === "danger" && "border-[#efb6b0] bg-[#fff1ef] text-[#b42318]")}>{children}</span>;
}
