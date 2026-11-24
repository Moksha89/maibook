"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";

const TOAST_EVENT = "maibook:toast";
interface ToastItem { id: number; message: string; tone: "success" | "error" }

/** Shows a short confirmation toast from anywhere on the client. */
export function toast(message: string, tone: "success" | "error" = "success") {
  if (typeof window !== "undefined" && message) window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, tone } }));
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    let counter = 0;
    const onToast = (event: Event) => {
      const { message, tone } = (event as CustomEvent<{ message: string; tone: "success" | "error" }>).detail;
      const id = ++counter + Date.now();
      setItems((current) => [...current.slice(-3), { id, message, tone }]);
      window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 4500);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-[min(92vw,22rem)] flex-col gap-2" role="region" aria-label="Notifications">
      {items.map((item) => (
        <div key={item.id} role="status" className="pointer-events-auto flex items-start gap-2 rounded-2xl border bg-white px-3 py-2.5 text-xs shadow-[0_10px_30px_rgba(8,17,31,0.18)]">
          {item.tone === "success" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#16794b]" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-[#b42318]" />}
          <p className="flex-1 font-semibold text-[#0d1a2c]">{item.message}</p>
          <button type="button" aria-label="Dismiss notification" className="text-[#8a98a8] hover:text-[#0d1a2c]" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}><X className="size-3.5" /></button>
        </div>
      ))}
    </div>
  );
}
