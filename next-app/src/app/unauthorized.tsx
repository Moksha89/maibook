"use client";

import { useEffect } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shown when a request has no valid session (expired, signed out, revoked). Sends the user to the login page. */
const goLogin = () => { window.location.href = "/login"; };

export default function Unauthorized() {
  useEffect(() => {
    const timer = setTimeout(() => goLogin(), 1200);
    return () => clearTimeout(timer);
  }, []);
  return (
    <main className="grid min-h-[60vh] place-items-center bg-[#f4f6f8] p-6">
      <section className="w-full max-w-md rounded-lg border bg-white p-6 text-center">
        <div className="font-mono text-xs font-bold text-[#a97819]">401</div>
        <h1 className="mt-2 text-xl font-bold text-[#10233f]">Please sign in again</h1>
        <p className="mt-2 text-sm text-[#647386]">Your session has ended, so we are taking you back to the login page.</p>
        <Button className="mt-4" icon={LogIn} onClick={() => goLogin()}>Sign in</Button>
      </section>
    </main>
  );
}
