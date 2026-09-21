import { supabase } from "@/integrations/supabase/client";
import { classifyDataError } from "./errors";
import { siteConfig } from "@/config/site";
import { extractWebsiteKeywords, normalizeKeyword, stripHtml } from "@/lib/seo/keywords";
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
        .select("id, title, slug, meta_title, meta_description, body, status"),
      db.from("departments").select("id, name, slug, description, published"),
      db.from("professional_services").select("id, title, slug, summary, description, published"),
      db.from("hospital_services").select("id, title, slug, summary, description, published"),
      db
        .from("doctors")
        .select(
          "id, name, slug, specialty, designation, qualifications, short_introduction, bio, seo_title, seo_description, canonical_url, photo_url, profile_image_alt, hero_image_url, hero_image_alt, published",
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
      db.from("faqs").select("id, question, answer, published"),
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
      canonicalUrl: null,
      indexable: true,
      images: [],
      internalLinks: countLinks(row["body"]),
      fields: [
        ...field("Page title", "title", row["title"]),
        ...field("SEO title", "meta_title", row["meta_title"]),
        ...field("Meta description", "meta_description", row["meta_description"]),
        ...field("Body content", "body", stripHtml(String(row["body"] ?? ""))),
      ],
    });
  }

  for (const row of rows(departments)) {
    entities.push({
      type: "department",
      id: String(row["id"]),
      label: String(row["name"] ?? "Department"),
      path: `/departments/${String(row["slug"] ?? "")}`,
      published: row["published"] === true,
      heading: text(row["name"]),
      seoTitle: null,
      metaDescription: text(row["description"]),
      canonicalUrl: null,
      indexable: true,
      images: [],
      internalLinks: 0,
      fields: [
        ...field("Department name", "name", row["name"]),
        ...field("Description", "description", row["description"]),
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
      canonicalUrl: text(row["canonical_url"]),
      indexable: true,
      images,
      internalLinks: 0,
      fields: [
        ...field("Doctor name", "name", row["name"]),
        ...field("Specialty", "specialty", row["specialty"]),
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

  for (const row of rows(faqs)) {
    entities.push({
      type: "faq",
      id: String(row["id"]),
      label: String(row["question"] ?? "FAQ"),
      path: "/faq",
      published: row["published"] === true,
      heading: text(row["question"]),
      seoTitle: null,
      metaDescription: null,
      canonicalUrl: null,
      indexable: true,
      images: [],
      internalLinks: 0,
      fields: [
        ...field("Question", "question", row["question"]),
        ...field("Answer", "answer", row["answer"]),
      ],
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
      entity_id: usage.entityId,
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

export async function saveTargetKeyword(input: TargetKeywordInput): Promise<string> {
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
  doctors: SeoRelationOption[];
  locations: SeoRelationOption[];
  blogPosts: SeoRelationOption[];
}> {
  const [departments, services, doctors, locations, posts] = await Promise.all([
    db.from("departments").select("id, name").order("name"),
    db.from("professional_services").select("id, title").order("title"),
    db.from("doctors").select("id, name").order("name"),
    db.from("locations").select("id, name").order("name"),
    db.from("blog_posts").select("id, title").order("title"),
  ]);
  const map = (result: Result<Row[]>, key: string) =>
    rows(result).map((row) => ({ id: String(row["id"]), label: String(row[key] ?? "Untitled") }));
  return {
    departments: map(departments, "name"),
    professionalServices: map(services, "title"),
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
