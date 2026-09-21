import type { MetadataRoute } from "next";
import { products } from "@/lib/products";
import { SITE_URL } from "@/lib/site";

/** Nothing here depends on the request — emit it once, at build time. */
export const dynamic = "force-static";


export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    { path: "", priority: 1 },
    { path: "/smartphones", priority: 0.9 },
    { path: "/acessorios", priority: 0.7 },
    { path: "/ofertas", priority: 0.8 },
    { path: "/sobre", priority: 0.5 },
  ].map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority,
  }));

  const productRoutes = products.map((product) => ({
    url: `${SITE_URL}/produto/${product.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...productRoutes];
}
