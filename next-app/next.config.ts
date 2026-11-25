import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const dev = process.env.NODE_ENV !== "production";

// Next.js inlines its bootstrap scripts and styles, so script/style need 'unsafe-inline' (no nonce pipeline);
// everything else is locked to this origin. Report previews use same-origin and blob: frames.
const contentSecurityPolicy = [
  "default-src 'self'",
  // Cloudflare (in front of maibook.co) injects its Web Analytics beacon.
  `script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' https://cloudflareinsights.com${dev ? " ws: wss:" : ""}`,
  "frame-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  ...(dev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(dev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]),
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: false,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Deliberately no `deploymentId`: Next 16.4 then fetches every shared script/font twice (once with ?dpl=, once without),
  // wasting ~5 requests and ~65 KB per cold load. Stale tabs are still handled: a changed build id forces a hard navigation,
  // and form submits to a removed Server Action reload the page (see use-modal-action.ts).
  experimental: {
    authInterrupts: true,
    // Small default for every form. Large backup archives go to /api/backups/upload, which enforces its own limit.
    serverActions: { bodySizeLimit: "4mb" },
    // Dynamic pages always refetch on navigation so newly added records show immediately.
    staleTimes: { dynamic: 0, static: 30 },
  },
  turbopack: {
    root: projectRoot,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
