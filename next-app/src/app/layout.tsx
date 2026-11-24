import type { Metadata } from "next";
import { Suspense } from "react";
import { IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import { EnterNavigation } from "@/components/ui/enter-navigation";
import { Toaster } from "@/components/ui/toast";
import { NavigationProgress } from "@/components/ui/nav-progress";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  // Mono is only used for figures inside tables; do not make every first paint wait for three extra font files.
  preload: false,
});

export const metadata: Metadata = {
  title: { default: "Maibook", template: "%s | Maibook" },
  description: "Company ledger, settlement, reporting, and operations platform",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full"><Suspense fallback={null}><NavigationProgress /></Suspense><EnterNavigation />{children}<Toaster /></body>
    </html>
  );
}
