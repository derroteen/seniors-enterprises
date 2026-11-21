import type { MetadataRoute } from "next";

import { dataRepository } from "@/lib/data";
import { getSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const [categories, products] = await Promise.all([
    dataRepository.getCategories(),
    dataRepository.getProducts({ pageSize: 100 }, "newest", 1),
  ]);
  const staticRoutes = [
    "",
    "/shop",
    "/privacy",
    "/terms",
    "/returns",
    "/delivery",
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: new URL(route, siteUrl).toString(),
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.6,
    })),
    ...categories.map((category) => ({
      url: new URL(`/shop/${category.slug}`, siteUrl).toString(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.products.map((product) => ({
      url: new URL(`/product/${product.slug}`, siteUrl).toString(),
      lastModified: product.updated_at || product.created_at,
      changeFrequency: "weekly" as const,
      priority: product.is_featured ? 0.8 : 0.6,
    })),
  ];
}
