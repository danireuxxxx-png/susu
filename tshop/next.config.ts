import type { NextConfig } from "next";

/**
 * `STATIC_EXPORT=1 npm run build` emits a fully static `out/` directory,
 * used to publish a shareable preview. It is opt-in so the default build
 * stays a normal Next.js server build for real deployment — where image
 * optimisation and server rendering are worth having.
 */
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? {
        output: "export" as const,
        // Emits `smartphones/index.html`, so every route resolves as a
        // directory on a plain static host.
        trailingSlash: true,
        // Serves build assets from `assets/_next/...` instead of `_next/...`.
        // The preview host reserves top-level paths beginning with `_`; a
        // post-build step moves the directory to match this prefix.
        assetPrefix: "/assets",
      }
    : {}),
  images: {
    formats: ["image/avif", "image/webp"],
    // The optimiser needs a server; a static export serves files as-is.
    unoptimized: isStaticExport,
    // Real product photography is served from the store's CDN once
    // available. Add the hostname here when the asset source is decided.
    remotePatterns: [],
  },
};

export default nextConfig;
