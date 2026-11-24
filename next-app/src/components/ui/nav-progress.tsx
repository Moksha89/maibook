"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const START_EVENT = "maibook:nav-start";

/** Starts the slim top progress bar (used by client-side filter forms; link clicks are detected automatically). */
export function startProgress() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(START_EVENT));
}

/** Slim top progress bar for client-side route transitions. It never reloads the page. */
export function NavigationProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const bar = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const width = useRef(0);

  useEffect(() => {
    const element = bar.current;
    if (!element) return;
    const paint = (value: number, visible: boolean) => { width.current = value; element.style.width = `${value}%`; element.style.opacity = visible ? "1" : "0"; };
    const start = () => {
      window.clearInterval(timer.current);
      paint(8, true);
      timer.current = window.setInterval(() => paint(Math.min(88, width.current + (88 - width.current) * 0.12 + 0.5), true), 160);
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname.startsWith("/api/")) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      start();
    };
    document.addEventListener("click", onClick);
    window.addEventListener(START_EVENT, start);
    return () => { document.removeEventListener("click", onClick); window.removeEventListener(START_EVENT, start); window.clearInterval(timer.current); };
  }, []);

  useEffect(() => {
    const element = bar.current;
    if (!element) return;
    window.clearInterval(timer.current);
    if (width.current === 0) return;
    width.current = 100; element.style.width = "100%";
    const done = window.setTimeout(() => { element.style.opacity = "0"; window.setTimeout(() => { width.current = 0; element.style.width = "0%"; }, 250); }, 200);
    return () => window.clearTimeout(done);
  }, [pathname, search]);

  return <div aria-hidden="true" data-testid="nav-progress" className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"><div ref={bar} className="h-full w-0 bg-gradient-to-r from-[#3b6ef5] via-[#6a5cf5] to-[#3b6ef5] opacity-0 shadow-[0_0_8px_rgba(59,110,245,0.7)] transition-[width,opacity] duration-200 ease-out" /></div>;
}
