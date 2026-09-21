import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Real product photography is served from the store's CDN once available.
    // Add the hostname here when the asset source is decided.
    remotePatterns: [],
  },
};

export default nextConfig;
