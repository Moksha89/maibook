"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) { useEffect(() => { console.error(error); }, [error]); return <main className="grid min-h-[60vh] place-items-center p-6"><section className="w-full max-w-md rounded-lg border bg-white p-6 text-center"><div className="font-mono text-xs font-bold text-[#b42318]">500</div><h1 className="mt-2 text-xl font-bold text-[#10233f]">Something went wrong</h1><p className="mt-2 text-sm text-[#647386]">The request was recorded. Retry, or use the request reference shown by your browser.</p>{error.digest ? <p className="mt-2 font-mono text-[11px] text-[#647386]">Reference: {error.digest}</p> : null}<Button onClick={reset} className="mt-4">Try again</Button></section></main>; }
