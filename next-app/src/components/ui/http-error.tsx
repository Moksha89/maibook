import { LayoutDashboard } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

export function HttpError({ code, title, message, requestId }: { code: string; title: string; message: string; requestId?: string }) {
  return <main className="grid min-h-screen place-items-center bg-[#f4f6f8] p-6"><section className="w-full max-w-md rounded-lg border bg-white p-6 text-center"><div className="font-mono text-xs font-bold text-[#a97819]">{code}</div><h1 className="mt-2 text-xl font-bold text-[#10233f]">{title}</h1><p className="mt-2 text-sm text-[#647386]">{message}</p>{requestId ? <p className="mt-3 font-mono text-[11px] text-[#718096]">Request {requestId}</p> : null}<LinkButton href="/dashboard" className="mt-4" icon={LayoutDashboard}>Return to dashboard</LinkButton></section></main>;
}
