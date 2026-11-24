import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: false,
  // Deliberately no `deploymentId`: Next 16.4 then fetches every shared script/font twice (once with ?dpl=, once without),
  // wasting ~5 requests and ~65 KB per cold load. Stale tabs are still handled: a changed build id forces a hard navigation,
  // and form submits to a removed Server Action reload the page (see use-modal-action.ts).
  experimental: {
    authInterrupts: true,
    serverActions: { bodySizeLimit: "512mb" },
    // Keep visited/prefetched pages in the browser's router cache briefly so sidebar navigation is instant. Mutations clear it.
    staleTimes: { dynamic: 30, static: 60 },
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
