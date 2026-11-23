import type { InputHTMLAttributes } from "react";
import { clsx } from "clsx";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx("h-9 w-full rounded-md border bg-white px-2.5 text-sm text-[#152235] shadow-[0_1px_1px_rgba(8,17,31,0.03)] placeholder:text-[#8a98a8] disabled:bg-[#f2f4f6]", className)} {...props} />;
}
