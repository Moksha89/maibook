"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { Download, LoaderCircle, MessageCircle, Printer, X } from "lucide-react";

import { Button, LinkButton } from "@/components/ui/button";
import { FormModal } from "@/components/ui/form-modal";
import { ModalCloseContext } from "@/components/ui/modal-context";

type Kind = "pdf" | "image" | "text" | "html";

function ViewerBody({ reportId, format, canSend }: { reportId: string; format: string; canSend: boolean }) {
  const close = useContext(ModalCloseContext);
  const [state, setState] = useState<{ kind: Kind; url?: string; text?: string } | { error: string } | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const base = `/api/reports/${reportId}/download`;

  useEffect(() => {
    let revoke: string | null = null;
    let cancelled = false;
    (async () => {
      try {
        // Inline PDFs only where the browser has a PDF viewer; phones get an image rendering of the same report.
        const pdfOk = typeof navigator !== "undefined" && (navigator as Navigator & { pdfViewerEnabled?: boolean }).pdfViewerEnabled === true;
        const wantImage = format === "PNG" || (format === "PDF" && !pdfOk);
        const url = wantImage ? `${base}?inline=1&as=png` : `${base}?inline=1`;
        const response = await fetch(url, { credentials: "same-origin" });
        if (!response.ok) throw new Error(response.status === 404 ? "This report is no longer available." : "The report could not be loaded.");
        if (format === "CSV" || format === "TEXT") { const text = await response.text(); if (!cancelled) setState({ kind: "text", text }); return; }
        const blob = await response.blob();
        revoke = URL.createObjectURL(blob);
        if (!cancelled) setState({ kind: wantImage ? "image" : format === "PRINT" ? "html" : "pdf", url: revoke });
      } catch (error) { if (!cancelled) setState({ error: error instanceof Error ? error.message : "The report could not be loaded." }); }
    })();
    return () => { cancelled = true; if (revoke) URL.revokeObjectURL(revoke); };
  }, [base, format]);

  const print = () => {
    if (state && "kind" in state && state.kind === "image" && state.url) {
      const w = window.open("", "_blank"); if (!w) return;
      w.document.write(`<img src="${state.url}" style="max-width:100%" onload="print()">`); w.document.close(); return;
    }
    try { frame.current?.contentWindow?.focus(); frame.current?.contentWindow?.print(); } catch { window.open(`${base}?inline=1`, "_blank"); }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <LinkButton href={`${base}`} prefetch={false} download icon={Download}>Download</LinkButton>
        <Button type="button" variant="secondary" icon={Printer} onClick={print}>Print</Button>
        {canSend ? <LinkButton href="/whatsapp" variant="secondary" icon={MessageCircle}>Send via WhatsApp</LinkButton> : null}
        <Button type="button" variant="secondary" icon={X} onClick={() => close?.()}>Close</Button>
      </div>
      <div className="min-h-[60dvh] overflow-auto rounded-2xl border bg-[#f4f6f8]">
        {!state ? <div className="grid h-[60dvh] place-items-center text-[#647386]" role="status" aria-label="Loading report"><LoaderCircle className="size-6 animate-spin" /></div> : null}
        {state && "error" in state ? <p role="alert" className="grid h-[40dvh] place-items-center px-4 text-center text-sm text-[#b42318]">{state.error}</p> : null}
        {state && "kind" in state && (state.kind === "pdf" || state.kind === "html") ? <iframe ref={frame} src={state.url} title="Report" className="h-[72dvh] w-full bg-white" /> : null}
        {state && "kind" in state && state.kind === "image" ? <div className="p-2"><img src={state.url} alt="Report preview" className="mx-auto h-auto max-w-none bg-white sm:max-w-full" /></div> : null}
        {state && "kind" in state && state.kind === "text" ? <pre className="max-h-[72dvh] overflow-auto whitespace-pre p-3 font-mono text-xs">{state.text}</pre> : null}
      </div>
    </div>
  );
}

export function ReportViewer({ reportId, format, canSend }: { reportId: string; format: string; canSend: boolean }) {
  return <FormModal trigger="View" title="Report preview" size="xl"><ViewerBody reportId={reportId} format={format} canSend={canSend} /></FormModal>;
}
