import { siteConfig } from "@/config/site";

/** Guidance shown in the Website Page SEO editor. */
export const PAGE_TITLE_RANGE = [50, 60] as const;
export const PAGE_DESCRIPTION_RANGE = [140, 160] as const;

const clean = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export function pagePublicPath(slug: unknown): string | null {
  const s = clean(slug).replace(/^\/+|\/+$/g, "");
  return s ? `/${s}` : null;
}

export function pagePublicUrl(slug: unknown): string | null {
  const path = pagePublicPath(slug);
  return path ? `${siteConfig.url}${path}` : null;
}

/** Custom canonical must be an absolute http(s) URL. */
export function canonicalUrlError(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  try {
    const url = new URL(v);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
    return null;
  } catch {
    return "Enter a full web address starting with https://";
  }
}

/** Custom canonical when set and valid, otherwise this page's own public URL. */
export function resolvePageCanonical(custom: unknown, slug: unknown): string | null {
  const v = clean(custom);
  if (v && !canonicalUrlError(v)) return v;
  return pagePublicUrl(slug);
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

/** Built only from the page's own title and the hospital name. */
export function suggestPageTitle(title: unknown): string | null {
  const t = clean(title);
  if (!t) return null;
  if (t.toLowerCase().includes(siteConfig.name.toLowerCase())) return t;
  const full = `${t} | ${siteConfig.name}`;
  return full.length <= PAGE_TITLE_RANGE[1] ? full : t;
}

/** Built only from the page's own written content (whole sentences), never invented facts. */
export function suggestPageDescription(body: unknown, title: unknown): string | null {
  const text = stripHtml(clean(body));
  if (text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
    let out = "";
    for (const sentence of sentences) {
      const next = `${out} ${sentence.trim()}`.trim();
      if (next.length > PAGE_DESCRIPTION_RANGE[1]) break;
      out = next;
    }
    if (out.length >= 50) return out;
    const cut = text.slice(0, PAGE_DESCRIPTION_RANGE[1] - 1);
    return `${cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : cut.length)}…`;
  }
  const t = clean(title);
  return t ? `${t} — ${siteConfig.name}.` : null;
}

export type PageSeoValues = {
  slug: unknown;
  status: unknown;
  meta_title: unknown;
  meta_description: unknown;
  canonical_url: unknown;
  og_title: unknown;
  og_description: unknown;
  og_media_id: unknown;
  robots_index: unknown;
};

export type PageSeoCheck = { label: string; ok: boolean; fix?: string };

/** Factual checks only — no score. Every failing check names the field that fixes it. */
export function pageSeoChecks(v: PageSeoValues): PageSeoCheck[] {
  const title = clean(v.meta_title);
  const desc = clean(v.meta_description);
  const canonical = clean(v.canonical_url);
  const published = v.status === "published";
  return [
    { label: "SEO title present", ok: Boolean(title), fix: "Add an SEO title above." },
    {
      label: "SEO title length acceptable",
      ok: Boolean(title) && title.length >= 30 && title.length <= PAGE_TITLE_RANGE[1],
      fix: `Aim for ${PAGE_TITLE_RANGE[0]}–${PAGE_TITLE_RANGE[1]} characters (currently ${title.length}).`,
    },
    { label: "Meta description present", ok: Boolean(desc), fix: "Add a meta description above." },
    {
      label: "Meta description length acceptable",
      ok: Boolean(desc) && desc.length >= 70 && desc.length <= PAGE_DESCRIPTION_RANGE[1],
      fix: `Aim for ${PAGE_DESCRIPTION_RANGE[0]}–${PAGE_DESCRIPTION_RANGE[1]} characters (currently ${desc.length}).`,
    },
    {
      label: "Canonical URL available",
      ok: Boolean(resolvePageCanonical(canonical, v.slug)),
      fix: "Set the page's web address (slug) or enter a canonical URL.",
    },
    {
      label: "Canonical URL valid",
      ok: !canonicalUrlError(canonical),
      fix: "Enter a full web address starting with https://, or use the public URL.",
    },
    {
      label: "Open Graph title available",
      ok: Boolean(clean(v.og_title) || title),
      fix: "Add an Open Graph title or an SEO title.",
    },
    {
      label: "Open Graph description available",
      ok: Boolean(clean(v.og_description) || desc),
      fix: "Add an Open Graph description or a meta description.",
    },
    { label: "Open Graph image available", ok: Boolean(clean(v.og_media_id)), fix: "Choose or upload an Open Graph image." },
    { label: "Public URL available", ok: Boolean(pagePublicPath(v.slug)), fix: "Add a web address (slug) for this page." },
    {
      label: "Search indexing configured",
      ok: published && v.robots_index !== false,
      fix: published ? "Turn on “Allow search engines to index this page”." : "Publish the page to allow indexing.",
    },
  ];
}
