import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Nothing here depends on the request — emit it once, at build time. */
export const dynamic = "force-static";


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
