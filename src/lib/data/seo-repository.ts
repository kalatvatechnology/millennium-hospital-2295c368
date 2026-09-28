import { supabase } from "@/integrations/supabase/client";
import { resolvePageCanonical } from "@/lib/website-page-seo";
import { classifyDataError } from "./errors";
import { siteConfig } from "@/config/site";
import { extractWebsiteKeywords, normalizeKeyword, stripHtml } from "@/lib/seo/keywords";
import { doctorSpecialty } from "./mappers";
import { parseDepartmentPage } from "@/lib/department-page";
import type {
  SeoDataSource,
  SeoEntity,
  SeoKeywordRecord,
  SeoKeywordUsageRecord,
  SeoScan,
  SeoTargetKeyword,
} from "@/lib/seo/types";
import type { AuditLog } from "./models";

type Row = Record<string, unknown>;
type Result<T> = { data: T | null; error: unknown };
type Query = PromiseLike<Result<Row[]>> & {
  select(columns?: string): Query;
  eq(column: string, value: unknown): Query;
  in(column: string, values: readonly unknown[]): Query;
  like(column: string, value: string): Query;
  order(column: string, options?: { ascending?: boolean }): Query;
  limit(count: number): Query;
  insert(values: Row | Row[]): Query;
  update(values: Row): Query;
  delete(): Query;
  maybeSingle(): PromiseLike<Result<Row>>;
  single(): PromiseLike<Result<Row>>;
};
type DataClient = { from(table: string): Query };

const db = supabase as unknown as DataClient;

/** Stable id for the single public /faq page entity (not a database row). */
export const FAQ_PAGE_ID = "faq-page";

function rows(result: Result<Row[]>): Row[] {
  if (result.error) throw classifyDataError(result.error);
  return result.data ?? [];
}
function one(result: Result<Row>): Row | null {
  if (result.error) throw classifyDataError(result.error);
  return result.data;
}
function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}
function num(value: unknown): number {
  return typeof value === "number" ? value : 0;
}
function field(label: string, key: string, value: unknown) {
  const content = typeof value === "string" ? value.trim() : "";
  return content ? [{ field: key, label, value: content }] : [];
}
function countLinks(value: unknown): number {
  if (typeof value !== "string") return 0;
  return (value.match(/href="\/(?!\/)/g) ?? []).length;
}

/**
 * Reads the public, published CMS content the website actually renders.
 * Staff-only and admin-only records are never scanned.
 */
export async function fetchSeoEntities(): Promise<SeoEntity[]> {
  const [pages, departments, professional, hospital, doctors, locations, posts, faqs] =
    await Promise.all([
      db
        .from("website_pages")
        .select("id, title, slug, meta_title, meta_description, canonical_url, robots_index, og_media_id, body, status"),
      db.from("departments").select("id, name, slug, description, published, page_published"),
      db.from("professional_services").select("id, title, slug, summary, description, published"),
      db.from("hospital_services").select("id, title, slug, summary, description, published"),
      db
        .from("doctors")
        .select(
          "id, name, slug, designation, qualifications, short_introduction, bio, seo_title, seo_description, canonical_url, robots_index, photo_url, profile_image_alt, hero_image_url, hero_image_alt, published, doctor_specializations(enabled,display_order,department_specializations(name))",
        ),
      db
        .from("locations")
        .select(
          "id, name, slug, address_line, city, state, postal_code, phone, email, opening_hours, map_url, published",
        ),
      db
        .from("blog_posts")
        .select(
          "id, title, slug, excerpt, body, seo_title, meta_description, canonical_url, cover_image_url, featured_image_alt, robots_index, status",
        ),
      db.from("faqs").select("id, question, answer, published, department_id"),
    ]);

  const entities: SeoEntity[] = [];

  for (const row of rows(pages)) {
    entities.push({
      type: "page",
      id: String(row["id"]),
      label: String(row["title"] ?? "Untitled page"),
      path: `/${String(row["slug"] ?? "")}`,
      published: row["status"] === "published",
      heading: text(row["title"]),
      seoTitle: text(row["meta_title"]),
      metaDescription: text(row["meta_description"]),
      // Empty canonical = automatic: the public page uses its own URL (same rule as the public head).
      canonicalUrl: resolvePageCanonical(row["canonical_url"], row["slug"]),
      indexable: row["robots_index"] !== false,
      images: [],
      internalLinks: countLinks(row["body"]),
      fields: [
        // /faq is one Website Page; its hospital-wide questions are content on it.
        ...(row["slug"] === "faq"
          ? rows(faqs)
              .filter((f) => f["published"] === true && !f["department_id"])
              .flatMap((f) => [...field("Question", "question", f["question"]), ...field("Answer", "answer", f["answer"])])
          : []),
        ...field("Page title", "title", row["title"]),
        ...field("SEO title", "meta_title", row["meta_title"]),
        ...field("Meta description", "meta_description", row["meta_description"]),
        ...field("Body content", "body", stripHtml(String(row["body"] ?? ""))),
      ],
    });
  }

  for (const row of rows(departments)) {
    // The public department page renders page_published, so its SEO fields are audited there.
    const page = parseDepartmentPage(row["page_published"]);
    const images: SeoEntity["images"] = [];
    if (text(page.hero.image_url)) images.push({ url: page.hero.image_url, alt: text(page.hero.image_alt) });
    if (text(page.facilities.image_url))
      images.push({ url: page.facilities.image_url, alt: text(page.facilities.image_alt) });
    if (text(page.seo.og_image_url))
      images.push({ url: page.seo.og_image_url, alt: text(page.seo.og_image_alt) });
    entities.push({
      type: "department",
      id: String(row["id"]),
      label: String(row["name"] ?? "Department"),
      path: `/departments/${String(row["slug"] ?? "")}`,
      published: row["published"] === true,
      heading: text(row["name"]),
      seoTitle: text(page.seo.title),
      metaDescription: text(page.seo.description),
      canonicalUrl: text(page.seo.canonical_url),
      indexable: page.seo.index,
      images,
      internalLinks: 0,
      fields: [
        ...field("Department name", "name", row["name"]),
        ...field("Description", "description", row["description"]),
        ...field("SEO title", "seo_title", page.seo.title),
        ...field("Meta description", "meta_description", page.seo.description),
      ],
    });
  }

  const serviceGroups = [
    ["professional_service", professional, "/services/professional"],
    ["hospital_service", hospital, "/services/hospital"],
  ] as const;
  for (const [type, result, base] of serviceGroups) {
    for (const row of rows(result)) {
      entities.push({
        type,
        id: String(row["id"]),
        label: String(row["title"] ?? "Service"),
        path: `${base}/${String(row["slug"] ?? "")}`,
        published: row["published"] === true,
        heading: text(row["title"]),
        seoTitle: null,
        metaDescription: text(row["summary"]),
        canonicalUrl: null,
        indexable: true,
        images: [],
        internalLinks: 0,
        fields: [
          ...field("Service name", "title", row["title"]),
          ...field("Summary", "summary", row["summary"]),
          ...field("Description", "description", row["description"]),
        ],
      });
    }
  }

  for (const row of rows(doctors)) {
    const specialty = doctorSpecialty(row);
    const qualifications = Array.isArray(row["qualifications"])
      ? (row["qualifications"] as unknown[]).filter((v): v is string => typeof v === "string")
      : [];
    const images: SeoEntity["images"] = [];
    if (text(row["photo_url"]))
      images.push({ url: String(row["photo_url"]), alt: text(row["profile_image_alt"]) });
    if (text(row["hero_image_url"]))
      images.push({ url: String(row["hero_image_url"]), alt: text(row["hero_image_alt"]) });
    entities.push({
      type: "doctor",
      id: String(row["id"]),
      label: String(row["name"] ?? "Doctor"),
      path: `/doctors/${String(row["slug"] ?? "")}`,
      published: row["published"] === true,
      heading: text(row["name"]),
      seoTitle: text(row["seo_title"]),
      metaDescription: text(row["seo_description"]),
      // Empty canonical means "automatic": the public page uses its own profile URL.
      canonicalUrl: text(row["canonical_url"]) ?? (text(row["slug"]) ? `/doctors/${String(row["slug"])}` : null),
      indexable: row["robots_index"] !== false,
      images,
      internalLinks: 0,
      fields: [
        ...field("Doctor name", "name", row["name"]),
        ...field("Specialty", "specialty", specialty),
        ...field("Designation", "designation", row["designation"]),
        ...field("Qualifications", "qualifications", qualifications.join(", ")),
        ...field("Introduction", "short_introduction", row["short_introduction"]),
        ...field("Biography", "bio", row["bio"]),
        ...field("SEO title", "seo_title", row["seo_title"]),
        ...field("Meta description", "seo_description", row["seo_description"]),
        ...field("Image alt text", "image_alt", text(row["profile_image_alt"]) ?? ""),
      ],
    });
  }

  for (const row of rows(locations)) {
    const address = [row["address_line"], row["city"], row["state"], row["postal_code"]]
      .map((part) => (typeof part === "string" ? part.trim() : ""))
      .filter(Boolean)
      .join(", ");
    entities.push({
      type: "location",
      id: String(row["id"]),
      label: String(row["name"] ?? "Location"),
      path: `/contact`,
      published: row["published"] === true,
      heading: text(row["name"]),
      seoTitle: null,
      metaDescription: address || null,
      canonicalUrl: null,
      indexable: true,
      images: [],
      internalLinks: 0,
      fields: [
        ...field("Location name", "name", row["name"]),
        ...field("Address", "address", address),
        ...field("Opening hours", "opening_hours", row["opening_hours"]),
      ],
    });
  }

  for (const row of rows(posts)) {
    entities.push({
      type: "blog_post",
      id: String(row["id"]),
      label: String(row["title"] ?? "Article"),
      path: `/blog/${String(row["slug"] ?? "")}`,
      published: row["status"] === "published",
      heading: text(row["title"]),
      seoTitle: text(row["seo_title"]) ?? text(row["title"]),
      metaDescription: text(row["meta_description"]) ?? text(row["excerpt"]),
      canonicalUrl: text(row["canonical_url"]),
      indexable: row["robots_index"] !== false,
      images: text(row["cover_image_url"])
        ? [{ url: String(row["cover_image_url"]), alt: text(row["featured_image_alt"]) }]
        : [],
      internalLinks: countLinks(row["body"]),
      fields: [
        ...field("Article title", "title", row["title"]),
        ...field("Excerpt", "excerpt", row["excerpt"]),
        ...field("Article content", "body", stripHtml(String(row["body"] ?? ""))),
        ...field("SEO title", "seo_title", row["seo_title"]),
        ...field("Meta description", "meta_description", row["meta_description"]),
      ],
    });
  }

  // /faq is ONE public page, owned by Website Pages → "faq" (above). Fallback only if that row is missing.
  if (!rows(pages).some((row) => row["slug"] === "faq")) {
    const hospitalFaqs = rows(faqs).filter((row) => row["published"] === true && !row["department_id"]);
    entities.push({
      type: "faq",
      id: FAQ_PAGE_ID,
      label: "FAQ page",
      path: "/faq",
      published: true,
      heading: "Frequently asked questions",
      seoTitle: `Frequently asked questions | ${siteConfig.name}`,
      metaDescription: "Answers to common questions about visiting The Millennium Hospital.",
      canonicalUrl: `${siteConfig.url}/faq`,
      indexable: true,
      images: [],
      internalLinks: 0,
      fields: hospitalFaqs.flatMap((row) => [
        ...field("Question", "question", row["question"]),
        ...field("Answer", "answer", row["answer"]),
      ]),
    });
  }

  return entities;
}

export type SeoScanSummary = {
  scanId: string;
  pagesScanned: number;
  keywordsDetected: number;
  sources: string[];
};

/** Explicit, staff-triggered scan. Never runs automatically on page load. */
export async function runWebsiteKeywordScan(actorId: string | null): Promise<SeoScanSummary> {
  const entities = await fetchSeoEntities();
  const scannable = entities.filter((entity) => entity.published);

  const locationTerms = scannable
    .filter((entity) => entity.type === "location")
    .flatMap((entity) => entity.fields.map((f) => f.value))
    .join(" ")
    .split(/[,\n]/)
    .map((part) => normalizeKeyword(part))
    .filter((part) => part.length > 3);

  const drafts = extractWebsiteKeywords(scannable, {
    localTerms: locationTerms,
    brandTerms: [siteConfig.name, "millennium"],
  });

  const sources = [...new Set(scannable.map((entity) => entity.type))];
  const scan = one(
    await db
      .from("seo_scans")
      .insert({
        actor_id: actorId,
        pages_scanned: scannable.length,
        keywords_detected: drafts.length,
        sources,
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single(),
  );
  const scanId = String(scan?.["id"] ?? "");

  const existing = rows(await db.from("seo_keywords").select("id"));
  if (existing.length) {
    const result = await db
      .from("seo_keywords")
      .delete()
      .in(
        "id",
        existing.map((row) => row["id"]),
      );
    if (result.error) throw classifyDataError(result.error);
  }

  const now = new Date().toISOString();
  const inserted = rows(
    await db
      .from("seo_keywords")
      .insert(
        drafts.map((draft) => ({
          keyword: draft.keyword,
          normalized: draft.normalized,
          category: draft.category,
          usage_count: draft.usageCount,
          page_count: draft.pageCount,
          word_count: draft.wordCount,
          last_scanned_at: now,
          scan_id: scanId,
        })),
      )
      .select("id, normalized"),
  );

  const idByNormalized = new Map(inserted.map((row) => [String(row["normalized"]), String(row["id"])]));
  const usageRows = drafts.flatMap((draft) => {
    const keywordId = idByNormalized.get(draft.normalized);
    if (!keywordId) return [];
    return draft.usages.map((usage) => ({
      keyword_id: keywordId,
      entity_type: usage.entityType,
      entity_id: usage.entityId === FAQ_PAGE_ID ? null : usage.entityId,
      entity_label: usage.entityLabel,
      entity_path: usage.entityPath,
      field: usage.field,
      occurrences: usage.occurrences,
      scan_id: scanId,
    }));
  });

  for (let index = 0; index < usageRows.length; index += 500) {
    const result = await db.from("seo_keyword_usage").insert(usageRows.slice(index, index + 500));
    if (result.error) throw classifyDataError(result.error);
  }

  return {
    scanId,
    pagesScanned: scannable.length,
    keywordsDetected: drafts.length,
    sources,
  };
}

function toKeyword(row: Row): SeoKeywordRecord {
  return {
    id: String(row["id"]),
    keyword: String(row["keyword"]),
    normalized: String(row["normalized"]),
    category: String(row["category"]) as SeoKeywordRecord["category"],
    usageCount: num(row["usage_count"]),
    pageCount: num(row["page_count"]),
    wordCount: num(row["word_count"]),
    lastScannedAt: String(row["last_scanned_at"]),
  };
}

export async function listWebsiteKeywords(): Promise<SeoKeywordRecord[]> {
  return rows(
    await db
      .from("seo_keywords")
      .select("*")
      .order("usage_count", { ascending: false })
      .limit(500),
  ).map(toKeyword);
}

export async function getWebsiteKeyword(id: string): Promise<SeoKeywordRecord | null> {
  const row = one(await db.from("seo_keywords").select("*").eq("id", id).maybeSingle());
  return row ? toKeyword(row) : null;
}

export async function listKeywordUsage(keywordId: string): Promise<SeoKeywordUsageRecord[]> {
  return rows(
    await db
      .from("seo_keyword_usage")
      .select("*")
      .eq("keyword_id", keywordId)
      .order("occurrences", { ascending: false }),
  ).map((row) => ({
    id: String(row["id"]),
    entityType: String(row["entity_type"]) as SeoKeywordUsageRecord["entityType"],
    entityId: text(row["entity_id"]),
    entityLabel: String(row["entity_label"]),
    entityPath: text(row["entity_path"]),
    field: String(row["field"]),
    occurrences: num(row["occurrences"]),
  }));
}

export async function listAllKeywordUsage(): Promise<
  (SeoKeywordUsageRecord & { keywordId: string })[]
> {
  return rows(await db.from("seo_keyword_usage").select("*").limit(5000)).map((row) => ({
    id: String(row["id"]),
    keywordId: String(row["keyword_id"]),
    entityType: String(row["entity_type"]) as SeoKeywordUsageRecord["entityType"],
    entityId: text(row["entity_id"]),
    entityLabel: String(row["entity_label"]),
    entityPath: text(row["entity_path"]),
    field: String(row["field"]),
    occurrences: num(row["occurrences"]),
  }));
}

export async function listSeoScans(): Promise<SeoScan[]> {
  return rows(
    await db.from("seo_scans").select("*").order("started_at", { ascending: false }).limit(50),
  ).map((row) => ({
    id: String(row["id"]),
    startedAt: String(row["started_at"]),
    completedAt: text(row["completed_at"]),
    pagesScanned: num(row["pages_scanned"]),
    keywordsDetected: num(row["keywords_detected"]),
    sources: Array.isArray(row["sources"])
      ? (row["sources"] as unknown[]).map((value) => String(value))
      : [],
  }));
}

function toTarget(row: Row): SeoTargetKeyword {
  return {
    id: String(row["id"]),
    keyword: String(row["keyword"]),
    normalized: String(row["normalized"]),
    keywordType: String(row["keyword_type"]) as SeoTargetKeyword["keywordType"],
    searchIntent: String(row["search_intent"]) as SeoTargetKeyword["searchIntent"],
    priority: row["priority"] === "secondary" ? "secondary" : "primary",
    targetUrl: text(row["target_url"]),
    targetEntityType: text(row["target_entity_type"]) as SeoTargetKeyword["targetEntityType"],
    departmentId: text(row["department_id"]),
    professionalServiceId: text(row["professional_service_id"]),
    hospitalServiceId: text(row["hospital_service_id"]),
    websitePageId: text(row["website_page_id"]),
    doctorId: text(row["doctor_id"]),
    locationId: text(row["location_id"]),
    blogPostId: text(row["blog_post_id"]),
    status: String(row["status"]) as SeoTargetKeyword["status"],
    notes: text(row["notes"]),
    updatedAt: String(row["updated_at"]),
  };
}

export async function listTargetKeywords(): Promise<SeoTargetKeyword[]> {
  return rows(
    await db.from("seo_target_keywords").select("*").order("created_at", { ascending: false }),
  ).map(toTarget);
}

export async function getTargetKeyword(id: string): Promise<SeoTargetKeyword | null> {
  const row = one(await db.from("seo_target_keywords").select("*").eq("id", id).maybeSingle());
  return row ? toTarget(row) : null;
}

export type TargetKeywordInput = Omit<SeoTargetKeyword, "id" | "normalized" | "updatedAt"> & {
  id?: string;
};

/**
 * Keeps exactly one primary target id (matching target_entity_type), as the database requires.
 * location_id stays as separate location context unless location is the primary target.
 */
export function normalizeTargetIds(input: TargetKeywordInput): TargetKeywordInput {
  const type = input.targetEntityType;
  const keep = <T,>(match: boolean, value: T | null) => (match ? value : null);
  return {
    ...input,
    departmentId: keep(type === "department", input.departmentId),
    professionalServiceId: keep(type === "professional_service", input.professionalServiceId),
    hospitalServiceId: keep(type === "hospital_service", input.hospitalServiceId),
    doctorId: keep(type === "doctor", input.doctorId),
    websitePageId: keep(type === "website_page", input.websitePageId),
    blogPostId: keep(type === "blog_post", input.blogPostId),
    // location_id: context for every type; required as the target when type = location.
    locationId: input.locationId,
    targetEntityType:
      type && (type === "location" ? input.locationId : primaryId(input, type)) ? type : null,
  };
}

function primaryId(input: TargetKeywordInput, type: SeoTargetKeyword["targetEntityType"]) {
  switch (type) {
    case "department":
      return input.departmentId;
    case "professional_service":
      return input.professionalServiceId;
    case "hospital_service":
      return input.hospitalServiceId;
    case "doctor":
      return input.doctorId;
    case "location":
      return input.locationId;
    case "website_page":
      return input.websitePageId;
    case "blog_post":
      return input.blogPostId;
    default:
      return null;
  }
}

export async function saveTargetKeyword(raw: TargetKeywordInput): Promise<string> {
  const input = normalizeTargetIds(raw);
  const values: Row = {
    keyword: input.keyword.trim(),
    normalized: normalizeKeyword(input.keyword),
    keyword_type: input.keywordType,
    search_intent: input.searchIntent,
    priority: input.priority,
    target_url: input.targetUrl,
    target_entity_type: input.targetEntityType,
    department_id: input.departmentId,
    professional_service_id: input.professionalServiceId,
    hospital_service_id: input.hospitalServiceId,
    website_page_id: input.websitePageId,
    doctor_id: input.doctorId,
    location_id: input.locationId,
    blog_post_id: input.blogPostId,
    status: input.status,
    notes: input.notes,
  };
  if (input.id) {
    const result = await db.from("seo_target_keywords").update(values).eq("id", input.id);
    if (result.error) throw classifyDataError(result.error);
    return input.id;
  }
  const row = one(await db.from("seo_target_keywords").insert(values).select("id").single());
  return String(row?.["id"] ?? "");
}

export async function deleteTargetKeyword(id: string): Promise<void> {
  const result = await db.from("seo_target_keywords").delete().eq("id", id);
  if (result.error) throw classifyDataError(result.error);
}

export async function listSeoDataSources(): Promise<SeoDataSource[]> {
  return rows(await db.from("seo_data_sources").select("*").order("label")).map((row) => ({
    key: String(row["key"]),
    label: String(row["label"]),
    status: String(row["status"]) as SeoDataSource["status"],
    lastSyncedAt: text(row["last_synced_at"]),
    notes: text(row["notes"]),
  }));
}

/** SEO history reuses the existing audit log, filtered to SEO-related records. */
export async function listSeoHistory(): Promise<AuditLog[]> {
  return rows(
    await db
      .from("audit_logs")
      .select("*")
      .like("entity_table", "seo_%")
      .order("created_at", { ascending: false })
      .limit(200),
  ).map((row) => ({
    id: String(row["id"]),
    actorEmail: text(row["actor_email"]),
    action: String(row["action"]),
    entityTable: text(row["entity_table"]),
    summary: text(row["summary"]),
    createdAt: String(row["created_at"]),
  }));
}

export type SeoRelationOption = { id: string; label: string };

export async function listSeoRelationOptions(): Promise<{
  departments: SeoRelationOption[];
  professionalServices: SeoRelationOption[];
  hospitalServices: SeoRelationOption[];
  websitePages: SeoRelationOption[];
  doctors: SeoRelationOption[];
  locations: SeoRelationOption[];
  blogPosts: SeoRelationOption[];
}> {
  const [departments, services, hospital, pages, doctors, locations, posts] = await Promise.all([
    db.from("departments").select("id, name").order("name"),
    db.from("professional_services").select("id, title").order("title"),
    db.from("hospital_services").select("id, title").order("title"),
    db.from("website_pages").select("id, title").order("title"),
    db.from("doctors").select("id, name").order("name"),
    db.from("locations").select("id, name").order("name"),
    db.from("blog_posts").select("id, title").order("title"),
  ]);
  const map = (result: Result<Row[]>, key: string) =>
    rows(result).map((row) => ({ id: String(row["id"]), label: String(row[key] ?? "Untitled") }));
  return {
    departments: map(departments, "name"),
    professionalServices: map(services, "title"),
    hospitalServices: map(hospital, "title"),
    websitePages: map(pages, "title"),
    doctors: map(doctors, "name"),
    locations: map(locations, "name"),
    blogPosts: map(posts, "title"),
  };
}

export async function listSeoLocations(): Promise<
  { id: string; name: string; address: string | null; phone: string | null; mapUrl: string | null; published: boolean }[]
> {
  return rows(
    await db
      .from("locations")
      .select("id, name, address_line, city, state, postal_code, phone, map_url, published")
      .order("display_order"),
  ).map((row) => ({
    id: String(row["id"]),
    name: String(row["name"] ?? "Location"),
    address:
      [row["address_line"], row["city"], row["state"], row["postal_code"]]
        .map((part) => (typeof part === "string" ? part.trim() : ""))
        .filter(Boolean)
        .join(", ") || null,
    phone: text(row["phone"]),
    mapUrl: text(row["map_url"]),
    published: row["published"] === true,
  }));
}

/**
 * Supporting data for SEO Coverage: location naming terms, real doctor ↔ location links
 * and the scanned keyword usage index. Pure evaluation lives in src/lib/seo/coverage.ts.
 */
export async function fetchCoverageContext(): Promise<{
  locations: { id: string; name: string; terms: string[] }[];
  doctorLocations: { doctorId: string; locationId: string }[];
  usage: { normalized: string; entityType: string; entityId: string | null; entityLabel: string; occurrences: number }[];
}> {
  const [locations, links, usage] = await Promise.all([
    db.from("locations").select("id, name, slug, city"),
    db.from("doctor_locations").select("doctor_id, location_id, enabled"),
    db
      .from("seo_keyword_usage")
      .select("entity_type, entity_id, entity_label, occurrences, seo_keywords(normalized)"),
  ]);
  return {
    locations: rows(locations).map((row) => ({
      id: String(row["id"]),
      name: String(row["name"] ?? "Location"),
      terms: locationTerms(row),
    })),
    doctorLocations: rows(links)
      .filter((row) => row["enabled"] !== false)
      .map((row) => ({ doctorId: String(row["doctor_id"]), locationId: String(row["location_id"]) })),
    usage: rows(usage).flatMap((row) => {
      const keyword = row["seo_keywords"] as Row | null;
      const normalized = keyword ? text(keyword["normalized"]) : null;
      return normalized
        ? [
            {
              normalized,
              entityType: String(row["entity_type"]),
              entityId: text(row["entity_id"]),
              entityLabel: String(row["entity_label"] ?? ""),
              occurrences: num(row["occurrences"]),
            },
          ]
        : [];
    }),
  };
}

const GENERIC_LOCATION_WORDS = new Set(["main", "branch", "hospital", "centre", "center", "clinic"]);

/** Real naming terms for a location: its name, city and the place words of its slug. */
function locationTerms(row: Row): string[] {
  const terms = new Set<string>();
  const name = normalizeKeyword(String(row["name"] ?? ""));
  if (name) terms.add(name);
  const city = normalizeKeyword(String(row["city"] ?? ""));
  if (city) terms.add(city);
  for (const part of String(row["slug"] ?? "").split("-")) {
    const word = normalizeKeyword(part);
    if (word.length > 2 && !GENERIC_LOCATION_WORDS.has(word)) terms.add(word);
  }
  return [...terms];
}
