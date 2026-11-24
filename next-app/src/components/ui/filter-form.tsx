"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import type { FormHTMLAttributes } from "react";

import { startProgress } from "@/components/ui/nav-progress";

/** A GET-style filter form that updates the URL in place with the router (no full page load). */
export function FilterForm({ children, ...props }: Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "method" | "onSubmit">) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  return (
    <form
      {...props}
      onSubmit={(event) => {
        event.preventDefault();
        const params = new URLSearchParams();
        for (const [key, value] of new FormData(event.currentTarget)) if (typeof value === "string" && value !== "") params.append(key, value);
        const query = params.toString();
        startProgress();
        startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname));
      }}
    >
      {children}
    </form>
  );
}
