import { siteConfig } from "@/config/site";
import type { WebsitePageMeta } from "@/lib/website-page-meta.functions";
import { resolvePageCanonical } from "@/lib/website-page-seo";

export function createPageMeta(title: string, description: string) {
  const fullTitle = `${title} | ${siteConfig.name}`;
  return [
    { title: fullTitle },
    { name: "description", content: description },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ];
}

const absolute = (v: string | null) =>
  !v ? null : /^https?:\/\//.test(v) ? v : v.startsWith("/") ? `${siteConfig.url}${v}` : null;

/**
 * Head for a Website Page route (/{slug}) from its website_pages SEO fields,
 * with the route's own copy as fallback when the row is missing.
 */
export function websitePageHead(
  slug: string,
  meta: WebsitePageMeta | null | undefined,
  fallback: { title: string; description: string },
) {
  const title = meta?.title ?? `${fallback.title} | ${siteConfig.name}`;
  const description = meta?.description ?? fallback.description;
  const ogTitle = meta?.ogTitle ?? title;
  const ogDescription = meta?.ogDescription ?? description;
  const canonical = resolvePageCanonical(meta?.canonical, slug)!;
  const image = absolute(meta?.ogImage ?? null);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: ogTitle },
      { property: "og:description", content: ogDescription },
      { property: "og:type", content: "website" },
      { property: "og:url", content: canonical },
      { name: "twitter:card", content: "summary_large_image" },
      ...(image
        ? [
            { property: "og:image", content: image },
            { name: "twitter:image", content: image },
          ]
        : []),
      ...(meta && !meta.index ? [{ name: "robots", content: "noindex" }] : []),
    ],
    links: [{ rel: "canonical", href: canonical }],
  };
}
