import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { getBranding } from "@/lib/services/branding";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };
export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");
  const brand = (await getBranding()).title;

  return (
    <main className="grid min-h-screen place-items-center bg-[#08111f] px-4 py-8">
      <section className="w-full max-w-[360px] overflow-hidden rounded-lg border border-white/10 bg-white shadow-2xl shadow-black/30">
        <div className="border-b border-[#27384d] bg-[#0d1a2c] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-md border border-[#e2b553] bg-[#c9952e] font-bold text-[#08111f]">{brand.slice(0, 1).toUpperCase()}</div>
            <div><p className="text-base font-bold text-white">{brand}</p><p className="text-[11px] text-[#aeb9c7]">Ledger and settlement operations</p></div>
          </div>
        </div>
        <div className="px-5 py-5">
          <h1 className="text-base font-bold text-[#0d1a2c]">Sign in</h1>
          <p className="mb-4 mt-0.5 text-xs text-[#647386]">Use your assigned account credentials.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
