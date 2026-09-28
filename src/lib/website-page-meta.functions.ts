import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export type WebsitePageMeta = {
  title: string | null;
  description: string | null;
  canonical: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  /** Site-relative or absolute URL of the linked Media & Content image. */
  ogImage: string | null;
  index: boolean;
};

const clean = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Public SEO metadata for a published Website Page — the single metadata source for /{slug}. */
export const getWebsitePageMeta = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ slug: z.string().min(1).max(100) }).parse(data))
  .handler(async ({ data }): Promise<WebsitePageMeta | null> => {
    const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
    const key =
      process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return null;
    const client = createClient(url, key, { auth: { persistSession: false } });
    const { data: row } = await client
      .from("website_pages")
      .select(
        "meta_title, meta_description, canonical_url, og_title, og_description, robots_index, media_items:og_media_id(url, thumbnail_url, published)",
      )
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (!row) return null;
    const media = (row as { media_items?: { url?: string; thumbnail_url?: string | null } | null }).media_items;
    return {
      title: clean(row.meta_title),
      description: clean(row.meta_description),
      canonical: clean(row.canonical_url),
      ogTitle: clean(row.og_title),
      ogDescription: clean(row.og_description),
      ogImage: media ? clean(media.thumbnail_url) ?? clean(media.url) : null,
      index: row.robots_index !== false,
    };
  });
