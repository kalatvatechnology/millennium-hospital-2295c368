import { countKeywordOccurrences, normalizeKeyword } from "./keywords";
import type { SeoEntity, SeoKeywordRecord, SeoTargetKeyword } from "./types";

export type CheckStatus = "pass" | "attention" | "problem";

export type SeoIssue = {
  key: string;
  label: string;
  status: CheckStatus;
  detail: string;
  entities: { label: string; path: string | null }[];
};

const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESCRIPTION_MIN = 70;
const DESCRIPTION_MAX = 160;

function collect(entities: SeoEntity[], predicate: (entity: SeoEntity) => boolean) {
  return entities
    .filter(predicate)
    .map((entity) => ({ label: entity.label, path: entity.path }));
}

function duplicates(entities: SeoEntity[], pick: (entity: SeoEntity) => string | null) {
  const seen = new Map<string, SeoEntity[]>();
  for (const entity of entities) {
    const value = pick(entity)?.trim().toLowerCase();
    if (!value) continue;
    const bucket = seen.get(value) ?? [];
    bucket.push(entity);
    seen.set(value, bucket);
  }
  return [...seen.values()]
    .filter((bucket) => bucket.length > 1)
    .flat()
    .map((entity) => ({ label: entity.label, path: entity.path }));
}

function issue(
  key: string,
  label: string,
  detail: string,
  affected: { label: string; path: string | null }[],
  problemWhenAny = false,
): SeoIssue {
  return {
    key,
    label,
    status: affected.length === 0 ? "pass" : problemWhenAny ? "problem" : "attention",
    detail,
    entities: affected,
  };
}

/** On-page checks computed from real CMS values only. */
export function onPageIssues(entities: SeoEntity[]): SeoIssue[] {
  const published = entities.filter((entity) => entity.published);
  return [
    issue(
      "title-missing",
      "SEO title present",
      "Pages without an SEO title fall back to generic text in Google.",
      collect(published, (entity) => !entity.seoTitle?.trim()),
      true,
    ),
    issue(
      "title-length",
      "SEO title length",
      `Aim for roughly ${TITLE_MIN}–${TITLE_MAX} characters.`,
      collect(published, (entity) => {
        const value = entity.seoTitle?.trim();
        return Boolean(value && (value.length < TITLE_MIN || value.length > TITLE_MAX));
      }),
    ),
    issue(
      "title-duplicate",
      "SEO titles are unique",
      "Two pages share the same SEO title.",
      duplicates(published, (entity) => entity.seoTitle),
    ),
    issue(
      "description-missing",
      "Meta description present",
      "Without a meta description Google writes its own summary.",
      collect(published, (entity) => !entity.metaDescription?.trim()),
      true,
    ),
    issue(
      "description-length",
      "Meta description length",
      `Aim for roughly ${DESCRIPTION_MIN}–${DESCRIPTION_MAX} characters.`,
      collect(published, (entity) => {
        const value = entity.metaDescription?.trim();
        return Boolean(
          value && (value.length < DESCRIPTION_MIN || value.length > DESCRIPTION_MAX),
        );
      }),
    ),
    issue(
      "description-duplicate",
      "Meta descriptions are unique",
      "Two pages share the same meta description.",
      duplicates(published, (entity) => entity.metaDescription),
    ),
    issue(
      "canonical",
      "Canonical URL set",
      "A canonical URL tells Google which address is the main one.",
      collect(published, (entity) => !entity.canonicalUrl?.trim()),
    ),
    issue(
      "heading",
      "Main heading present",
      "Each page needs a clear main heading.",
      collect(published, (entity) => !entity.heading?.trim()),
      true,
    ),
    issue(
      "image-alt",
      "Images have alt text",
      "Alt text describes the image for search engines and screen readers.",
      collect(published, (entity) => entity.images.some((image) => !image.alt?.trim())),
    ),
    issue(
      "content",
      "Page has written content",
      "Pages with no written content give Google nothing to rank.",
      collect(
        published,
        (entity) => entity.fields.reduce((sum, field) => sum + field.value.length, 0) < 200,
      ),
    ),
    issue(
      "internal-links",
      "Internal links available",
      "Linking between pages helps visitors and search engines.",
      collect(published, (entity) => entity.type === "blog_post" && entity.internalLinks === 0),
    ),
    issue(
      "indexable",
      "Page allowed in search results",
      "These pages are set to no-index.",
      collect(published, (entity) => !entity.indexable),
    ),
  ];
}

export type KeywordGap = {
  keyword: string;
  reason: string;
  detail: string;
};

export function keywordGaps(
  targets: SeoTargetKeyword[],
  entities: SeoEntity[],
  websiteKeywords: SeoKeywordRecord[],
): KeywordGap[] {
  const found = new Set(websiteKeywords.map((row) => row.normalized));
  const gaps: KeywordGap[] = [];
  for (const target of targets) {
    const hasPage = Boolean(
      target.targetUrl ||
        target.departmentId ||
        target.professionalServiceId ||
        target.doctorId ||
        target.locationId ||
        target.blogPostId,
    );
    const occurrences = countKeywordOccurrences(entities, target.keyword);
    if (occurrences === 0) {
      gaps.push({
        keyword: target.keyword,
        reason: "Not found in website content",
        detail: hasPage
          ? "This target keyword has a target page but does not appear in the page content."
          : "This target keyword has no target page and does not appear anywhere on the website.",
      });
      continue;
    }
    if (!hasPage) {
      gaps.push({
        keyword: target.keyword,
        reason: "No target page",
        detail: "The keyword appears on the website but no page is assigned to it.",
      });
      continue;
    }
    if (!found.has(normalizeKeyword(target.keyword))) {
      gaps.push({
        keyword: target.keyword,
        reason: "Only light usage",
        detail: `Found ${occurrences} time(s) in scanned content, but not often enough to appear in the website keyword list.`,
      });
    }
  }
  return gaps;
}

export type Cannibalization = {
  keyword: string;
  pages: { label: string; path: string | null }[];
};

/** Flags potential overlap only — never claims Google competition. */
export function potentialOverlap(
  keywords: SeoKeywordRecord[],
  usageByKeyword: Map<string, { entityLabel: string; entityPath: string | null }[]>,
): Cannibalization[] {
  const results: Cannibalization[] = [];
  for (const keyword of keywords) {
    if (keyword.wordCount < 2) continue;
    const usages = usageByKeyword.get(keyword.id) ?? [];
    const unique = new Map<string, { label: string; path: string | null }>();
    for (const usage of usages)
      unique.set(usage.entityLabel, { label: usage.entityLabel, path: usage.entityPath });
    if (unique.size >= 3) results.push({ keyword: keyword.keyword, pages: [...unique.values()] });
  }
  return results.slice(0, 25);
}

export type NapCheck = {
  label: string;
  status: CheckStatus;
  detail: string;
};

export function napChecks(
  locations: { name: string; address: string | null; phone: string | null }[],
): NapCheck[] {
  const withAddress = locations.filter((location) => location.address?.trim());
  const withPhone = locations.filter((location) => location.phone?.trim());
  const phones = new Set(withPhone.map((location) => location.phone?.replace(/\D/g, "")));
  return [
    {
      label: "Every location has an address",
      status: withAddress.length === locations.length ? "pass" : "problem",
      detail: `${withAddress.length} of ${locations.length} location records have an address.`,
    },
    {
      label: "Every location has a phone number",
      status: withPhone.length === locations.length ? "pass" : "problem",
      detail: `${withPhone.length} of ${locations.length} location records have a phone number.`,
    },
    {
      label: "Phone numbers are consistent",
      status: phones.size <= 1 ? "pass" : "attention",
      detail:
        phones.size <= 1
          ? "All location records use the same phone number."
          : `${phones.size} different phone numbers are in use. Confirm this is intended.`,
    },
  ];
}

export function overallStatus(statuses: CheckStatus[]): CheckStatus {
  if (statuses.includes("problem")) return "problem";
  if (statuses.includes("attention")) return "attention";
  return "pass";
}
