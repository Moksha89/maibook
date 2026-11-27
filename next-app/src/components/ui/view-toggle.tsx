"use client";

import { LayoutGrid, List } from "lucide-react";
import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LinkButton } from "@/components/ui/button";

const toggleClass = (active: boolean) => `!size-7 !ring-0 [&_svg]:!size-3.5 ${active ? "!bg-[#2196f3] !text-white" : ""}`;

/** Grid/list switch that stores the last choice in a cookie and the URL. */
function ViewToggleInner({ section, view }: { section: string; view: "grid" | "list" }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const href = (next: "grid" | "list") => {
    const params = new URLSearchParams(search.toString());
    params.set("view", next);
    params.delete("page");
    return `${pathname}?${params.toString()}`;
  };
  const choose = (next: "grid" | "list") => {
    document.cookie = `maibook-view-${section}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.replace(href(next));
  };
  return (
    <div className="flex items-center gap-1" role="group" aria-label="View">
      <LinkButton href={href("grid")} iconOnly icon={LayoutGrid} aria-label="Grid view" title="Grid view" className={toggleClass(view === "grid")} onClick={(event) => { event.preventDefault(); choose("grid"); }} />
      <LinkButton href={href("list")} iconOnly icon={List} aria-label="List view" title="List view" className={toggleClass(view === "list")} onClick={(event) => { event.preventDefault(); choose("list"); }} />
    </div>
  );
}

export function ViewToggle({ section, view }: { section: string; view: "grid" | "list" }) {
  return <Suspense fallback={<div className="h-7 w-[60px]" />}><ViewToggleInner section={section} view={view} /></Suspense>;
}
