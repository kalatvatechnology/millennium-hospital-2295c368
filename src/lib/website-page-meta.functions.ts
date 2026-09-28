import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

/** Public SEO metadata for a published Website Page (website_pages.meta_title / meta_description). */
export const getWebsitePageMeta = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ slug: z.string().min(1).max(100) }).parse(data))
  .handler(async ({ data }) => {
    const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
    const key =
      process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return null;
    const client = createClient(url, key, { auth: { persistSession: false } });
    const { data: row } = await client
      .from("website_pages")
      .select("meta_title, meta_description")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (!row) return null;
    return {
      title: row.meta_title?.trim() || null,
      description: row.meta_description?.trim() || null,
    };
  });
