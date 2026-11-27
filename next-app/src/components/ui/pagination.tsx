import { ChevronLeft, ChevronRight } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

function hrefFor(pathname: string, params: Record<string, string | undefined>, page: number, param: string) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== param) search.set(key, value);
  }
  if (page > 1) search.set(param, String(page));
  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/** Compact pager: previous, Page X of Y and a row count, then next. Hidden when everything fits on one page. */
export function Pagination({
  pathname,
  params = {},
  page,
  pages,
  total,
  param = "page",
}: {
  pathname: string;
  params?: Record<string, string | undefined>;
  page: number;
  pages: number;
  total: number;
  param?: string;
}) {
  if (total <= 0 || pages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-1.5 border-t px-3 py-2 text-[11px] text-[#647386]">
      <span className="mr-auto font-medium">{total.toLocaleString()} {total === 1 ? "row" : "rows"} · Page {page} of {pages}</span>
      <LinkButton href={hrefFor(pathname, params, Math.max(1, page - 1), param)} variant="ghost" iconOnly icon={ChevronLeft} aria-label="Previous page" title="Previous page" className={`!size-7 [&_svg]:!size-3.5 ${page <= 1 ? "pointer-events-none opacity-35" : ""}`} />
      <LinkButton href={hrefFor(pathname, params, Math.min(pages, page + 1), param)} variant="ghost" iconOnly icon={ChevronRight} aria-label="Next page" title="Next page" className={`!size-7 [&_svg]:!size-3.5 ${page >= pages ? "pointer-events-none opacity-35" : ""}`} />
    </div>
  );
}
