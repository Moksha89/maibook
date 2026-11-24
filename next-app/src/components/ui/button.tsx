import { forwardRef, type ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

type Variant = "primary" | "secondary" | "danger" | "ghost";

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>(function Button({ className, variant = "primary", type = "button", ...props }, ref) {
  return (
    <button ref={ref} type={type} className={clsx("inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-3 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-55", variant === "primary" && "border-[#a97819] bg-[#c9952e] text-[#08111f] hover:bg-[#dda940]", variant === "secondary" && "border-[#cbd4dd] bg-white text-[#203650] hover:bg-[#f4f6f8]", variant === "danger" && "border-[#d92d20] bg-[#b42318] text-white hover:bg-[#8f1c13]", variant === "ghost" && "border-transparent bg-transparent text-[#53657a] hover:bg-[#edf1f4]", className)} {...props} />
  );
});
