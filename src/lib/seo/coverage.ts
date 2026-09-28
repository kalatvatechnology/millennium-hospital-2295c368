/**
 * SEO Coverage — pure, deterministic evaluation of how well each intentional target keyword
 * is covered on its INTENDED target page. No database access: callers pass real CMS data
 * (fetchSeoEntities + fetchCoverageContext) so this can run in the browser or on a server.
 *
 * Coverage is never stored and never manually edited. It is kept separate from the keyword
 * workflow status (planned / active / paused / achieved) and from Google Search Console data.
 */
import { normalizeKeyword, stripHtml } from "./keywords";
import type { SeoEntity, SeoEntityType, SeoTargetKeyword, SeoTargetType } from "./types";
import { SEO_TARGET_TYPE_LABELS } from "./types";

export const COVERAGE_STATUSES = [
  "covered",
  "partially_covered",
  "review_needed",
  "not_covered",
  "needs_setup",
] as const;
export type CoverageStatus = (typeof COVERAGE_STATUSES)[number];

export const COVERAGE_STATUS_LABELS: Record<CoverageStatus, string> = {
  needs_setup: "Needs Setup",
  not_covered: "Not Covered",
  partially_covered: "Partially Covered",
  covered: "Covered",
  review_needed: "Review Needed",
};

export type EvidenceKey =
  | "target_set"
  | "target_resolved"
  | "published"
  | "indexable"
  | "title_match"
  | "meta_description_match"
  | "heading_match"
  | "body_match"
  | "location_match"
  | "entity_match"
  | "targeting_conflict";

export type EvidenceResult = "pass" | "fail" | "warn" | "not_applicable";

export type CoverageEvidence = {
  key: EvidenceKey;
  label: string;
  result: EvidenceResult;
  detail: string;
  /** Existing SEO audit issue key, so the UI can reuse seoFixTarget for a "Fix issue" link. */
  fixIssueKey?: string;
};

export type CoverageConflict = {
  kind: "duplicate_target" | "stronger_page" | "location_mismatch" | "url_mismatch";
  detail: string;
  pages: { type: SeoEntityType; id: string; label: string; path: string | null }[];
};

export type CoverageLocation = { id: string; name: string; terms: string[] };

export type CoverageContext = {
  entities: SeoEntity[];
  targets: SeoTargetKeyword[];
  locations: CoverageLocation[];
  doctorLocations: { doctorId: string; locationId: string }[];
  /** Scanned website-keyword usage — supporting evidence only, never proof of coverage. */
  usage?: { normalized: string; entityType: string; entityId: string | null; entityLabel: string; occurrences: number }[];
  /** Public site origin, used to recognise absolute URLs that point at this website. */
  siteOrigin?: string;
};

export type CoverageResult = {
  targetId: string;
  keyword: string;
  status: CoverageStatus;
  /** Keyword workflow status is paused → evaluated but excluded from active gap counts. */
  paused: boolean;
  primaryType: SeoTargetType | null;
  primaryId: string | null;
  primaryLabel: string | null;
  /** The resolved CMS record the keyword is evaluated against. */
  entity: SeoEntity | null;
  resolvedUrl: string | null;
  location: CoverageLocation | null;
  locationSource: "linked_context" | "keyword" | null;
  corePhrase: string;
  evidence: CoverageEvidence[];
  conflicts: CoverageConflict[];
  recommendations: string[];
};

/* ------------------------------------------------------------------ helpers */

const ENTITY_TYPE_FOR_TARGET: Record<SeoTargetType, SeoEntityType> = {
  department: "department",
  professional_service: "professional_service",
  hospital_service: "hospital_service",
  doctor: "doctor",
  location: "location",
  website_page: "page",
  blog_post: "blog_post",
};

const SEO_TITLE_FIELDS = new Set(["meta_title", "seo_title"]);
const META_FIELDS = new Set(["meta_description", "seo_description"]);
/** Name/heading-type fields: matched by heading_match, not counted as body content. */
const HEADING_FIELDS = new Set(["title", "name"]);
const NON_BODY_FIELDS = new Set([...SEO_TITLE_FIELDS, ...META_FIELDS, ...HEADING_FIELDS, "image_alt"]);
/** Entity types that genuinely have an editable SEO title field. */
const HAS_SEO_TITLE = new Set<SeoEntityType>(["page", "department", "doctor", "blog_post"]);
const HAS_META = new Set<SeoEntityType>([
  "page",
  "department",
  "doctor",
  "blog_post",
  "professional_service",
  "hospital_service",
]);
const CONNECTORS = new Set(["in", "at", "near", "around", "of", "for"]);

function norm(value: string | null | undefined): string {
  return normalizeKeyword(stripHtml(value ?? ""));
}

/** Whole-word occurrences of a normalised phrase in a normalised haystack. */
export function countPhrase(haystack: string, phrase: string): number {
  if (!phrase || !haystack) return 0;
  const padded = ` ${haystack} `;
  const needle = ` ${phrase} `;
  let count = 0;
  let index = padded.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = padded.indexOf(needle, index + needle.length - 1);
  }
  return count;
}

function containsPhrase(value: string | null | undefined, phrases: string[]): boolean {
  const haystack = norm(value);
  return phrases.some((phrase) => countPhrase(haystack, phrase) > 0);
}

/** Known locations whose naming terms appear in the keyword. */
export function locationsInKeyword(keyword: string, locations: CoverageLocation[]): CoverageLocation[] {
  const normalized = normalizeKeyword(keyword);
  return locations.filter((location) =>
    location.terms.some((term) => term && countPhrase(normalized, term) > 0),
  );
}

/**
 * Core phrase = keyword without the location terms (and a dangling connector word).
 * "dental implants in ulwe" + Ulwe → "dental implants". Unknown place names are kept,
 * so "dental implants in vashi" and "… in sanpada" remain different targets.
 */
export function corePhrase(keyword: string, location: CoverageLocation | null): string {
  let phrase = normalizeKeyword(keyword);
  if (!location) return phrase;
  const terms = [...location.terms].sort((a, b) => b.length - a.length);
  let removed = false;
  for (const term of terms) {
    if (!term) continue;
    const next = ` ${phrase} `.replace(` ${term} `, " ").trim();
    if (next !== phrase) {
      phrase = next.replace(/\s+/g, " ");
      removed = true;
    }
  }
  if (removed) {
    const words = phrase.split(" ").filter(Boolean);
    while (words.length > 1 && CONNECTORS.has(words[words.length - 1] ?? "")) words.pop();
    while (words.length > 1 && CONNECTORS.has(words[0] ?? "")) words.shift();
    phrase = words.join(" ");
  }
  return phrase || normalizeKeyword(keyword);
}

function primaryIdOf(target: SeoTargetKeyword): string | null {
  switch (target.targetEntityType) {
    case "department":
      return target.departmentId;
    case "professional_service":
      return target.professionalServiceId;
    case "hospital_service":
      return target.hospitalServiceId;
    case "doctor":
      return target.doctorId;
    case "location":
      return target.locationId;
    case "website_page":
      return target.websitePageId;
    case "blog_post":
      return target.blogPostId;
    default:
      return null;
  }
}

export type ResolvedTarget = {
  type: SeoTargetType | null;
  id: string | null;
  entity: SeoEntity | null;
};

/** Resolves the one primary target of a keyword against the live CMS entity list. */
export function resolveTarget(target: SeoTargetKeyword, entities: SeoEntity[]): ResolvedTarget {
  const type = target.targetEntityType;
  const id = primaryIdOf(target);
  if (!type || !id) return { type, id, entity: null };
  const entityType = ENTITY_TYPE_FOR_TARGET[type];
  const entity = entities.find((row) => row.type === entityType && row.id === id) ?? null;
  return { type, id, entity };
}

type UrlCheck =
  | { kind: "none" }
  | { kind: "external"; url: string }
  | { kind: "internal"; path: string };

function classifyUrl(raw: string | null, siteOrigin?: string): UrlCheck {
  const value = raw?.trim();
  if (!value) return { kind: "none" };
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (siteOrigin && url.origin === new URL(siteOrigin).origin)
        return { kind: "internal", path: cleanPath(url.pathname) };
      return { kind: "external", url: value };
    } catch {
      return { kind: "external", url: value };
    }
  }
  return { kind: "internal", path: cleanPath(value.startsWith("/") ? value : `/${value}`) };
}

function cleanPath(path: string): string {
  const withoutQuery = path.split(/[?#]/)[0] ?? "/";
  return withoutQuery.length > 1 ? withoutQuery.replace(/\/+$/, "") : withoutQuery;
}

function bodyText(entity: SeoEntity): string {
  return entity.fields
    .filter((field) => !NON_BODY_FIELDS.has(field.field))
    .map((field) => norm(field.value))
    .join(" | ");
}

function allText(entity: SeoEntity): string {
  return entity.fields.map((field) => norm(field.value)).join(" | ");
}

function affected(entity: SeoEntity) {
  return { type: entity.type, id: entity.id, label: entity.label, path: entity.path };
}

/* --------------------------------------------------------------- evaluation */

/** Evaluates one target keyword. Deterministic: same inputs → same result. */
export function evaluateCoverage(target: SeoTargetKeyword, context: CoverageContext): CoverageResult {
  const evidence: CoverageEvidence[] = [];
  const conflicts: CoverageConflict[] = [];
  const add = (item: CoverageEvidence) => evidence.push(item);
  const resolved = resolveTarget(target, context.entities);

  // Location context: the linked location_id (unless it IS the primary target), otherwise
  // a known location named in the keyword (text only — never claimed as a database link).
  const mentioned = locationsInKeyword(target.keyword, context.locations);
  let location: CoverageLocation | null = null;
  let locationSource: CoverageResult["locationSource"] = null;
  if (target.locationId) {
    location = context.locations.find((row) => row.id === target.locationId) ?? null;
    if (location && target.targetEntityType !== "location") locationSource = "linked_context";
  } else if (mentioned.length) {
    location = mentioned[0] ?? null;
    locationSource = "keyword";
  }
  const isLocationTarget = target.targetEntityType === "location";
  const core = corePhrase(target.keyword, location);
  const full = normalizeKeyword(target.keyword);
  const phrases = [...new Set([full, core])].filter(Boolean);

  const base = {
    targetId: target.id,
    keyword: target.keyword,
    paused: target.status === "paused",
    primaryType: resolved.type,
    primaryId: resolved.id,
    primaryLabel: resolved.entity?.label ?? null,
    entity: resolved.entity,
    location,
    locationSource,
    corePhrase: core,
  };

  // 1. target_set
  if (!resolved.type || !resolved.id) {
    add({
      key: "target_set",
      label: "Primary target chosen",
      result: "fail",
      detail: "No primary target is selected for this keyword.",
    });
    return finish({ ...base, resolvedUrl: null }, evidence, conflicts);
  }
  add({
    key: "target_set",
    label: "Primary target chosen",
    result: "pass",
    detail: `${SEO_TARGET_TYPE_LABELS[resolved.type]} selected.`,
  });

  // 2. target_resolved
  const entity = resolved.entity;
  if (!entity || !entity.path) {
    add({
      key: "target_resolved",
      label: "Target page exists",
      result: "fail",
      detail: entity
        ? "The selected record has no public address."
        : "The selected record no longer exists or is not visible.",
    });
    return finish({ ...base, resolvedUrl: null }, evidence, conflicts);
  }
  add({
    key: "target_resolved",
    label: "Target page exists",
    result: "pass",
    detail: `${entity.label} — ${entity.path}`,
  });

  // entity_match (target_url override)
  const url = classifyUrl(target.targetUrl, context.siteOrigin);
  let resolvedUrl = entity.path;
  let external = false;
  if (url.kind === "none") {
    add({
      key: "entity_match",
      label: "Target address matches the target",
      result: "pass",
      detail: "The address comes from the selected target.",
    });
  } else if (url.kind === "external") {
    external = true;
    resolvedUrl = url.url;
    add({
      key: "entity_match",
      label: "Target address matches the target",
      result: "warn",
      detail: "The target address points to another website, so its content cannot be checked here.",
    });
    conflicts.push({
      kind: "url_mismatch",
      detail: "Target address is external and does not match the selected target.",
      pages: [affected(entity)],
    });
  } else if (url.path === cleanPath(entity.path)) {
    add({
      key: "entity_match",
      label: "Target address matches the target",
      result: "pass",
      detail: "The target address matches the selected target's page.",
    });
  } else {
    resolvedUrl = url.path;
    const known = context.entities.find((row) => row.path && cleanPath(row.path) === url.path);
    add({
      key: "entity_match",
      label: "Target address matches the target",
      result: "warn",
      detail: known
        ? `The target address ${url.path} belongs to "${known.label}", not the selected target (${entity.path}).`
        : `The target address ${url.path} is not a known public page and does not match ${entity.path}.`,
    });
    conflicts.push({
      kind: "url_mismatch",
      detail: `Target address ${url.path} does not match ${entity.path}.`,
      pages: known ? [affected(entity), affected(known)] : [affected(entity)],
    });
  }

  // 3. published
  add({
    key: "published",
    label: "Published",
    result: entity.published ? "pass" : "fail",
    detail: entity.published ? "The target page is live." : "The target page is not published.",
  });

  // 4. indexable
  const hasIndexSetting = entity.type === "page" || entity.type === "doctor" || entity.type === "blog_post" || entity.type === "department";
  add({
    key: "indexable",
    label: "Visible to search engines",
    result: !hasIndexSetting ? "not_applicable" : entity.indexable ? "pass" : "fail",
    detail: !hasIndexSetting
      ? "This page type has no search visibility setting."
      : entity.indexable
        ? "Search engines may index this page."
        : "The page is set to hide from search engines.",
    fixIssueKey: "indexable",
  });

  // Content checks (not possible when the address is external).
  const na = (key: EvidenceKey, label: string, detail: string, fixIssueKey?: string) =>
    add({ key, label, result: "not_applicable", detail, fixIssueKey });
  if (external) {
    const reason = "Cannot be checked: the target address is external.";
    na("title_match", "Keyword in SEO title", reason);
    na("meta_description_match", "Keyword in meta description", reason);
    na("heading_match", "Keyword in main heading", reason);
    na("body_match", "Keyword in page content", reason);
    na("location_match", "Location aligned", reason);
  } else {
    // title_match
    if (!HAS_SEO_TITLE.has(entity.type)) {
      na("title_match", "Keyword in SEO title", "This page type has no SEO title field.");
    } else {
      const ok = containsPhrase(entity.seoTitle, phrases);
      add({
        key: "title_match",
        label: "Keyword in SEO title",
        result: ok ? "pass" : "fail",
        detail: ok
          ? "The SEO title contains the target phrase."
          : entity.seoTitle
            ? "The SEO title does not contain the target phrase."
            : "No SEO title is set.",
        fixIssueKey: "title-missing",
      });
    }
    // meta_description_match (supporting — not required for Covered)
    if (!HAS_META.has(entity.type)) {
      na("meta_description_match", "Keyword in meta description", "This page type has no meta description field.");
    } else {
      const ok = containsPhrase(entity.metaDescription, phrases);
      add({
        key: "meta_description_match",
        label: "Keyword in meta description",
        result: ok ? "pass" : "fail",
        detail: ok
          ? "The meta description contains the target phrase."
          : entity.metaDescription
            ? "The meta description does not contain the target phrase."
            : "No meta description is set.",
        fixIssueKey: "description-missing",
      });
    }
    // heading_match
    const headingOk = containsPhrase(entity.heading, phrases);
    add({
      key: "heading_match",
      label: "Keyword in main heading",
      result: headingOk ? "pass" : "fail",
      detail: headingOk
        ? `The heading "${entity.heading}" contains the target phrase.`
        : "The main heading does not contain the target phrase.",
      fixIssueKey: "heading",
    });
    // body_match
    const body = bodyText(entity);
    const occurrences = phrases.reduce((max, phrase) => Math.max(max, countPhrase(body, phrase)), 0);
    add({
      key: "body_match",
      label: "Keyword in page content",
      result: occurrences > 0 ? "pass" : "fail",
      detail:
        occurrences > 0
          ? `Found ${occurrences} time${occurrences === 1 ? "" : "s"} in the page content.`
          : "The page content does not contain the target phrase.",
      fixIssueKey: "content",
    });

    // location_match
    if (isLocationTarget) {
      const other = mentioned.find((row) => row.id !== target.locationId);
      add({
        key: "location_match",
        label: "Location aligned",
        result: other ? "fail" : "pass",
        detail: other
          ? `The keyword names ${other.name}, but the target is a different location.`
          : "The primary target is the location itself.",
      });
    } else if (!location) {
      na("location_match", "Location aligned", "No location context — generic keyword.");
    } else {
      const otherNamed = target.locationId
        ? mentioned.find((row) => row.id !== target.locationId)
        : undefined;
      const linked =
        entity.type === "doctor" &&
        context.doctorLocations.some((row) => row.doctorId === entity.id && row.locationId === location.id);
      const inText = location.terms.some((term) => countPhrase(allText(entity), term) > 0 || containsPhrase(entity.heading, [term]));
      if (otherNamed) {
        add({
          key: "location_match",
          label: "Location aligned",
          result: "fail",
          detail: `The keyword names ${otherNamed.name}, but the location context is ${location.name}.`,
        });
        conflicts.push({ kind: "location_mismatch", detail: "Keyword location differs from the location context.", pages: [affected(entity)] });
      } else if (linked) {
        add({
          key: "location_match",
          label: "Location aligned",
          result: "pass",
          detail: `The doctor is linked to ${location.name} in the doctor's locations.`,
        });
      } else if (inText) {
        add({
          key: "location_match",
          label: "Location aligned",
          result: "pass",
          detail: `${location.name} is mentioned in the page content (text evidence, not a database link).`,
        });
      } else {
        add({
          key: "location_match",
          label: "Location aligned",
          result: "fail",
          detail:
            entity.type === "doctor"
              ? `The doctor is not linked to ${location.name} and the page does not mention it.`
              : `The page does not mention ${location.name}.`,
        });
        if (entity.type === "doctor")
          conflicts.push({ kind: "location_mismatch", detail: `Doctor is not linked to ${location.name}.`, pages: [affected(entity)] });
      }
    }
  }

  // targeting_conflict
  conflicts.push(...detectConflicts(target, entity, phrases, core, location, context));
  const blocking = conflicts.filter((c) => c.kind === "duplicate_target" || c.kind === "stronger_page");
  add({
    key: "targeting_conflict",
    label: "No targeting conflict",
    result: blocking.length ? "warn" : "pass",
    detail: blocking.length ? blocking.map((c) => c.detail).join(" ") : "No competing target found.",
  });

  return finish({ ...base, resolvedUrl }, evidence, conflicts);
}

/** Deterministic conflict checks — no AI, every result lists the competing pages. */
export function detectConflicts(
  target: SeoTargetKeyword,
  entity: SeoEntity,
  phrases: string[],
  core: string,
  location: CoverageLocation | null,
  context: CoverageContext,
): CoverageConflict[] {
  const out: CoverageConflict[] = [];

  // Another target keyword with the same core phrase, location and intent pointing elsewhere.
  const rivals = context.targets.filter((other) => {
    if (other.id === target.id || other.searchIntent !== target.searchIntent) return false;
    const otherLocation = other.locationId
      ? context.locations.find((row) => row.id === other.locationId) ?? null
      : locationsInKeyword(other.keyword, context.locations)[0] ?? null;
    if ((otherLocation?.id ?? null) !== (location?.id ?? null)) return false;
    if (corePhrase(other.keyword, otherLocation) !== core) return false;
    const resolved = resolveTarget(other, context.entities).entity;
    return Boolean(resolved && !(resolved.type === entity.type && resolved.id === entity.id));
  });
  if (rivals.length) {
    out.push({
      kind: "duplicate_target",
      detail: `Another target keyword with the same phrase and intent points to a different page.`,
      pages: rivals.flatMap((other) => {
        const resolved = resolveTarget(other, context.entities).entity;
        return resolved ? [affected(resolved)] : [];
      }),
    });
  }

  // A different published page features the phrase in its title/heading while the target does not.
  const featured = (row: SeoEntity) =>
    containsPhrase(row.heading, phrases) || containsPhrase(row.seoTitle, phrases);
  if (!featured(entity)) {
    const stronger = context.entities.filter(
      (row) =>
        row.published &&
        row.type !== "location" &&
        !(row.type === entity.type && row.id === entity.id) &&
        featured(row),
    );
    if (stronger.length) {
      const scanned = (context.usage ?? []).filter((row) => phrases.includes(row.normalized));
      out.push({
        kind: "stronger_page",
        detail: `${stronger.map((row) => `"${row.label}"`).join(", ")} feature${stronger.length === 1 ? "s" : ""} this phrase in the title or heading, but the target page does not.${
          scanned.length ? ` The website keyword scan also found it on ${scanned.length} record(s).` : ""
        }`,
        pages: stronger.map(affected),
      });
    }
  }
  return out;
}

function passed(evidence: CoverageEvidence[], key: EvidenceKey): boolean {
  return evidence.find((row) => row.key === key)?.result === "pass";
}
function result(evidence: CoverageEvidence[], key: EvidenceKey): EvidenceResult | null {
  return evidence.find((row) => row.key === key)?.result ?? null;
}

/** Coverage status rules, applied in a fixed order. */
export function deriveStatus(evidence: CoverageEvidence[]): CoverageStatus {
  if (result(evidence, "target_set") !== "pass" || result(evidence, "target_resolved") !== "pass")
    return "needs_setup";
  if (result(evidence, "published") !== "pass") return "not_covered";
  const external = result(evidence, "body_match") === "not_applicable";
  if (!external) {
    const represented =
      passed(evidence, "body_match") || passed(evidence, "title_match") || passed(evidence, "heading_match");
    if (!represented) return "not_covered";
  }
  if (
    result(evidence, "targeting_conflict") === "warn" ||
    result(evidence, "indexable") === "fail" ||
    result(evidence, "entity_match") === "warn" ||
    result(evidence, "location_match") === "fail"
  )
    return "review_needed";
  const locationOk = ["pass", "not_applicable"].includes(result(evidence, "location_match") ?? "not_applicable");
  if (
    passed(evidence, "body_match") &&
    (passed(evidence, "title_match") || passed(evidence, "heading_match")) &&
    locationOk
  )
    return "covered";
  return "partially_covered";
}

const RECOMMENDATIONS: Partial<Record<EvidenceKey, string>> = {
  target_set: "Choose the primary target page this keyword should lead people to.",
  target_resolved: "The selected target no longer exists — choose another primary target.",
  published: "Publish the target page, or choose a published target.",
  indexable: "Allow search engines to index the target page, or choose another target.",
  title_match: "Review the SEO title for natural inclusion of the target phrase.",
  meta_description_match: "Consider mentioning the target phrase naturally in the meta description.",
  heading_match: "Review the main heading for natural inclusion of the target phrase.",
  body_match: "Add the target phrase naturally to the page content.",
  location_match: "Align the location: mention it on the page, link the doctor to it, or correct the location context.",
  entity_match: "Clear the target address override, or make it match the selected target.",
  targeting_conflict: "Decide which page should own this phrase and adjust the competing page or target.",
};

function finish(
  base: Omit<CoverageResult, "status" | "evidence" | "conflicts" | "recommendations">,
  evidence: CoverageEvidence[],
  conflicts: CoverageConflict[],
): CoverageResult {
  const status = deriveStatus(evidence);
  const recommendations = evidence
    .filter((row) => row.result === "fail" || row.result === "warn")
    // Title OR heading satisfies coverage — only suggest both when neither passes.
    .filter((row) =>
      row.key === "title_match" || row.key === "heading_match"
        ? !(passed(evidence, "title_match") || passed(evidence, "heading_match")) || row.key === "title_match"
        : true,
    )
    .flatMap((row) => (RECOMMENDATIONS[row.key] ? [RECOMMENDATIONS[row.key] as string] : []));
  return { ...base, status, evidence, conflicts, recommendations: [...new Set(recommendations)] };
}

export function evaluateAllCoverage(context: CoverageContext): CoverageResult[] {
  return context.targets.map((target) => evaluateCoverage(target, context));
}

/* -------------------------------------------------------------- aggregation */

export type StatusCounts = Record<CoverageStatus, number> & { total: number };

export function emptyCounts(): StatusCounts {
  return { total: 0, covered: 0, partially_covered: 0, review_needed: 0, not_covered: 0, needs_setup: 0 };
}

/** A gap = not Covered and the keyword is not paused. */
export function isGap(row: CoverageResult): boolean {
  return row.status !== "covered" && !row.paused;
}

export function countStatuses(results: CoverageResult[]): StatusCounts {
  const counts = emptyCounts();
  for (const row of results) {
    counts.total += 1;
    counts[row.status] += 1;
  }
  return counts;
}

export type CoverageGroup = {
  key: string;
  label: string;
  path: string | null;
  counts: StatusCounts;
  gaps: number;
  results: CoverageResult[];
};

export type CoverageDimension = SeoTargetType | "page" | "location_context";

/**
 * Groups results by one dimension:
 * - a primary target type (department, doctor, …): keywords targeting each record of that type
 * - "page": by resolved target page
 * - "location_context": by location context (linked or named in the keyword)
 */
export function groupCoverage(results: CoverageResult[], dimension: CoverageDimension): CoverageGroup[] {
  const groups = new Map<string, CoverageGroup>();
  for (const row of results) {
    let key: string | null = null;
    let label = "";
    let path: string | null = null;
    if (dimension === "page") {
      if (!row.entity) continue;
      key = `${row.entity.type}:${row.entity.id}`;
      label = row.entity.label;
      path = row.resolvedUrl;
    } else if (dimension === "location_context") {
      if (!row.location) continue;
      key = row.location.id;
      label = row.location.name;
    } else {
      if (row.primaryType !== dimension || !row.primaryId) continue;
      key = row.primaryId;
      label = row.primaryLabel ?? "Unavailable record";
      path = row.entity?.path ?? null;
    }
    const group = groups.get(key) ?? { key, label, path, counts: emptyCounts(), gaps: 0, results: [] };
    group.counts.total += 1;
    group.counts[row.status] += 1;
    if (isGap(row)) group.gaps += 1;
    group.results.push(row);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => b.gaps - a.gaps || a.label.localeCompare(b.label));
}

/** Status counts per primary target type — for dashboard breakdowns. */
export function countsByTargetType(results: CoverageResult[]): Record<SeoTargetType, StatusCounts & { gaps: number }> {
  const out = {} as Record<SeoTargetType, StatusCounts & { gaps: number }>;
  for (const type of Object.keys(SEO_TARGET_TYPE_LABELS) as SeoTargetType[])
    out[type] = { ...emptyCounts(), gaps: 0 };
  for (const row of results) {
    if (!row.primaryType) continue;
    const bucket = out[row.primaryType];
    bucket.total += 1;
    bucket[row.status] += 1;
    if (isGap(row)) bucket.gaps += 1;
  }
  return out;
}
