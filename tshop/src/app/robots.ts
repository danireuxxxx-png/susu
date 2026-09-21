import type { MetadataRoute } from "next";
import { SITE_URL } from "./layout";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Cart state is per-visitor and has nothing to index.
      disallow: ["/checkout", "/conta"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
