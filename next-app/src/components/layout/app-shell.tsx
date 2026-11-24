"use client";

import { clsx } from "clsx";
import { Building2, ChartNoAxesCombined, Database, FileClock, FileText, Gauge, IdCard, KeyRound, Layers3, Menu, MessageSquareText, Settings, ShieldCheck, SplitSquareHorizontal, UserRoundCog, Users, WalletCards, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { logoutAction } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";

const navigation: { href: string; label: string; icon: LucideIcon; permission: string }[] = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge, permission: "dashboard.read" },
  { href: "/companies", label: "Companies", icon: Building2, permission: "companies.read" },
  { href: "/agents", label: "Agents", icon: Users, permission: "agents.read" },
  { href: "/ledger", label: "Ledger", icon: WalletCards, permission: "ledger.read" },
  { href: "/identifiers", label: "IDs", icon: IdCard, permission: "identifiers.read" },
  { href: "/settlements", label: "Settlements", icon: ChartNoAxesCombined, permission: "settlements.read" },
  { href: "/reports", label: "Reports", icon: FileText, permission: "reports.read" },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageSquareText, permission: "whatsapp.read" },
  { href: "/users", label: "Users & access", icon: ShieldCheck, permission: "users.read" },
  { href: "/owners", label: "Owners & partners", icon: UserRoundCog, permission: "owners.read" },
  { href: "/upline-groups", label: "Upline groups", icon: Layers3, permission: "uplines.read" },
  { href: "/manual-distribution", label: "Manual distribution", icon: SplitSquareHorizontal, permission: "uplines.distribute" },
  { href: "/audit", label: "Audit logs", icon: FileClock, permission: "audit.read" },
  { href: "/settings", label: "Settings", icon: Settings, permission: "settings.read" },
  { href: "/database", label: "Database", icon: Database, permission: "database.read" },
  { href: "/api-access", label: "API access", icon: KeyRound, permission: "api_tokens.read" },
];

function NavigationLinks({ permissions, onNavigate }: { permissions: string[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return navigation.filter((item) => permissions.includes(item.permission)).map((item) => {
    const Icon = item.icon;
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    return <Link key={item.href} href={item.href} onClick={onNavigate} className={clsx("flex h-8 items-center gap-2 rounded-md px-2.5 text-[13px] font-medium transition", active ? "bg-[#c9952e] text-[#08111f]" : "text-[#c5ced9] hover:bg-white/7 hover:text-white")}><Icon className="size-4 shrink-0" /><span>{item.label}</span></Link>;
  });
}

export function AppShell({ children, displayName, roleName, isSuperAdmin, permissions, brand = "Maibook" }: { children: React.ReactNode; displayName: string; roleName: string; isSuperAdmin: boolean; permissions: string[]; brand?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    if (!mobileOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [mobileOpen]);
  const logout = <form action={logoutAction}><Button type="submit" variant="ghost" className="text-[#c5ced9] hover:bg-white/10 hover:text-white">Sign out</Button></form>;
  return <div className="min-h-screen bg-[#f4f6f8]">
    {isSuperAdmin ? <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 border-r border-white/10 bg-[#0d1a2c] lg:flex lg:flex-col" data-print-hidden><div className="flex h-12 items-center gap-2 border-b border-white/10 px-3.5"><div className="grid size-7 place-items-center rounded bg-[#c9952e] text-xs font-bold text-[#08111f]">{brand.slice(0, 1).toUpperCase()}</div><span className="font-bold text-white">{brand}</span></div><nav className="flex-1 space-y-1 overflow-y-auto p-2"><NavigationLinks permissions={permissions} /></nav><div className="border-t border-white/10 p-2.5"><Link href="/profile" className="block truncate text-xs font-semibold text-white hover:underline" title="My profile">{displayName}</Link><p className="text-[11px] text-[#96a5b6]">{roleName}</p>{logout}</div></aside> : null}
    <header className={clsx("fixed inset-x-0 top-0 z-20 flex h-12 items-center border-b border-white/10 bg-[#0d1a2c] px-3 text-white", isSuperAdmin && "lg:left-56")} data-print-hidden><button type="button" onClick={() => setMobileOpen(true)} className="mr-2 grid size-8 place-items-center rounded hover:bg-white/10 lg:hidden" aria-label="Open navigation"><Menu className="size-5" /></button>{!isSuperAdmin ? <><Link href="/dashboard" className="mr-5 flex items-center gap-2 font-bold"><span className="grid size-7 place-items-center rounded bg-[#c9952e] text-xs text-[#08111f]">{brand.slice(0, 1).toUpperCase()}</span>{brand}</Link><nav className="hidden items-center gap-1 overflow-x-auto lg:flex"><NavigationLinks permissions={permissions} /></nav></> : <span className="text-sm font-semibold">Operations</span>}<div className="ml-auto flex items-center gap-2"><Link href="/profile" className="hidden text-xs text-[#c5ced9] underline-offset-2 hover:text-white hover:underline sm:inline" title="My profile">{displayName}</Link>{logout}</div></header>
    {mobileOpen ? <div className="fixed inset-0 z-50 lg:hidden" data-print-hidden><button type="button" className="absolute inset-0 bg-black/55" onClick={() => setMobileOpen(false)} aria-label="Close navigation" /><aside className="relative flex h-full w-64 max-w-[82vw] flex-col bg-[#0d1a2c] shadow-xl"><div className="flex h-12 items-center justify-between border-b border-white/10 px-3.5"><span className="font-bold text-white">{brand}</span><button type="button" className="grid size-8 place-items-center rounded text-white hover:bg-white/10" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X className="size-5" /></button></div><nav className="flex-1 space-y-1 overflow-y-auto p-2"><NavigationLinks permissions={permissions} onNavigate={() => setMobileOpen(false)} /></nav></aside></div> : null}
    <main className={clsx("min-h-screen pt-12", isSuperAdmin && "lg:pl-56")}><div className="mx-auto max-w-[1600px] p-2.5 sm:p-3 lg:p-4">{children}</div></main>
  </div>;
}
