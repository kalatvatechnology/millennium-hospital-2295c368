/**
 * Department CMS page content. Stored as JSON on the department row:
 * `page_draft` (editable, private) and `page_published` (copied on Publish).
 * The public page renders `page_published`; staff preview renders `page_draft`.
 */
export type PageItem = { id: string; title: string; text: string; enabled: boolean };

export type ListSection = {
  enabled: boolean;
  label: string;
  title: string;
  intro: string;
  items: PageItem[];
};

export type DepartmentPage = {
  hero: {
    enabled: boolean;
    headline: string;
    intro: string;
    image_url: string;
    image_alt: string;
    show_book: boolean;
    show_contact: boolean;
    show_specialists: boolean;
  };
  about: ListSection;
  care: ListSection;
  conditions: ListSection;
  specialists: { enabled: boolean };
  facilities: ListSection & { image_url: string; image_alt: string };
  approach: ListSection;
  faqs: { enabled: boolean };
  media: { enabled: boolean };
  seo: {
    title: string;
    description: string;
    canonical_url: string;
    og_image_url: string;
    index: boolean;
  };
  /**
   * Ordered IDs of existing doctors / FAQs / media shown on this page. Staged with the
   * draft and copied on Publish, so relationship edits never change the live page early.
   * `null` means the page predates staged links and falls back to the relationship tables.
   */
  links: DepartmentLinks | null;
};

export type DepartmentLinks = { doctors: string[]; faqs: string[]; media: string[] };

const str = (v: unknown) => (typeof v === "string" ? v : "");
const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

export const newItemId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

function items(v: unknown): PageItem[] {
  if (!Array.isArray(v)) return [];
  return v.map((raw) => {
    const r = obj(raw);
    return {
      id: str(r["id"]) || newItemId(),
      title: str(r["title"]),
      text: str(r["text"]),
      enabled: bool(r["enabled"], true),
    };
  });
}

function list(v: unknown, defaults: { label: string; title: string }): ListSection {
  const r = obj(v);
  return {
    enabled: bool(r["enabled"], true),
    label: "label" in r ? str(r["label"]) : defaults.label,
    title: "title" in r ? str(r["title"]) : defaults.title,
    intro: str(r["intro"]),
    items: items(r["items"]),
  };
}

export function parseDepartmentPage(value: unknown): DepartmentPage {
  const r = obj(value);
  const hero = obj(r["hero"]);
  const fac = obj(r["facilities"]);
  const seo = obj(r["seo"]);
  return {
    hero: {
      enabled: bool(hero["enabled"], true),
      headline: str(hero["headline"]),
      intro: str(hero["intro"]),
      image_url: str(hero["image_url"]),
      image_alt: str(hero["image_alt"]),
      show_book: bool(hero["show_book"], true),
      show_contact: bool(hero["show_contact"], false),
      show_specialists: bool(hero["show_specialists"], true),
    },
    about: list(r["about"], { label: "About the department", title: "" }),
    care: list(r["care"], { label: "Specialized care", title: "" }),
    conditions: list(r["conditions"], { label: "Conditions", title: "Conditions we treat" }),
    specialists: { enabled: bool(obj(r["specialists"])["enabled"], true) },
    facilities: {
      ...list(r["facilities"], { label: "Facilities", title: "Advanced facilities & technology" }),
      image_url: str(fac["image_url"]),
      image_alt: str(fac["image_alt"]),
    },
    approach: list(r["approach"], { label: "The Millennium approach", title: "" }),
    faqs: { enabled: bool(obj(r["faqs"])["enabled"], true) },
    media: { enabled: bool(obj(r["media"])["enabled"], true) },
    seo: {
      title: str(seo["title"]),
      description: str(seo["description"]),
      canonical_url: str(seo["canonical_url"]),
      og_image_url: str(seo["og_image_url"]),
      index: bool(seo["index"], true),
    },
    links: parseLinks(r["links"]),
  };
}

function ids(v: unknown): string[] {
  return Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string"))] : [];
}

function parseLinks(v: unknown): DepartmentLinks | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const r = v as Record<string, unknown>;
  return { doctors: ids(r["doctors"]), faqs: ids(r["faqs"]), media: ids(r["media"]) };
}

/** True when the department has CMS content saved (draft or published object is non-empty). */
export function hasPageContent(value: unknown): boolean {
  return Object.keys(obj(value)).length > 0;
}

export const enabledItems = (s: ListSection) => s.items.filter((i) => i.enabled && i.title.trim());

/** Managed image paths referenced by a page, used for safe storage cleanup. */
export function pageImageUrls(page: DepartmentPage): string[] {
  return [page.hero.image_url, page.facilities.image_url, page.seo.og_image_url].filter(Boolean);
}
