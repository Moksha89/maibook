import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: false,
  // Lets open browser tabs notice a new release (and reload) instead of posting to server actions that no longer exist.
  ...(process.env.DEPLOYMENT_ID ? { deploymentId: process.env.DEPLOYMENT_ID } : {}),
  experimental: { authInterrupts: true, serverActions: { bodySizeLimit: "512mb" } },
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
