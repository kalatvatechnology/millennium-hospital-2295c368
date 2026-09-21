export const SEO_ENTITY_TYPES = [
  "page",
  "department",
  "professional_service",
  "hospital_service",
  "doctor",
  "location",
  "blog_post",
  "faq",
] as const;

export type SeoEntityType = (typeof SEO_ENTITY_TYPES)[number];

export const SEO_ENTITY_LABELS: Record<SeoEntityType, string> = {
  page: "Website page",
  department: "Department",
  professional_service: "Professional service",
  hospital_service: "Hospital service",
  doctor: "Doctor",
  location: "Location",
  blog_post: "Blog article",
  faq: "FAQ",
};

export const SEO_KEYWORD_CATEGORIES = [
  "general",
  "local",
  "service",
  "doctor",
  "department",
  "location",
  "blog",
  "brand",
] as const;
export type SeoKeywordCategory = (typeof SEO_KEYWORD_CATEGORIES)[number];

export const SEO_SEARCH_INTENTS = [
  "informational",
  "commercial",
  "local",
  "navigational",
  "transactional",
] as const;
export type SeoSearchIntent = (typeof SEO_SEARCH_INTENTS)[number];

export const SEO_TARGET_STATUSES = ["planned", "active", "paused", "achieved"] as const;
export type SeoTargetStatus = (typeof SEO_TARGET_STATUSES)[number];

/** One piece of scannable public content, with the fields the scanner reads. */
export type SeoContentField = {
  field: string;
  label: string;
  value: string;
};

export type SeoContentImage = {
  url: string;
  alt: string | null;
};

export type SeoEntity = {
  type: SeoEntityType;
  id: string;
  label: string;
  path: string | null;
  published: boolean;
  heading: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  indexable: boolean;
  images: SeoContentImage[];
  internalLinks: number;
  fields: SeoContentField[];
};

export type SeoKeywordUsageDraft = {
  entityType: SeoEntityType;
  entityId: string;
  entityLabel: string;
  entityPath: string | null;
  field: string;
  occurrences: number;
};

export type SeoKeywordDraft = {
  keyword: string;
  normalized: string;
  category: SeoKeywordCategory;
  wordCount: number;
  usageCount: number;
  pageCount: number;
  usages: SeoKeywordUsageDraft[];
};

export type SeoKeywordRecord = {
  id: string;
  keyword: string;
  normalized: string;
  category: SeoKeywordCategory;
  usageCount: number;
  pageCount: number;
  wordCount: number;
  lastScannedAt: string;
};

export type SeoKeywordUsageRecord = {
  id: string;
  entityType: SeoEntityType;
  entityId: string | null;
  entityLabel: string;
  entityPath: string | null;
  field: string;
  occurrences: number;
};

export type SeoTargetKeyword = {
  id: string;
  keyword: string;
  normalized: string;
  keywordType: SeoKeywordCategory;
  searchIntent: SeoSearchIntent;
  priority: "primary" | "secondary";
  targetUrl: string | null;
  targetEntityType: SeoEntityType | null;
  departmentId: string | null;
  professionalServiceId: string | null;
  doctorId: string | null;
  locationId: string | null;
  blogPostId: string | null;
  status: SeoTargetStatus;
  notes: string | null;
  updatedAt: string;
};

export type SeoScan = {
  id: string;
  startedAt: string;
  completedAt: string | null;
  pagesScanned: number;
  keywordsDetected: number;
  sources: string[];
};

export type SeoDataSource = {
  key: string;
  label: string;
  status: "not_connected" | "connected" | "error";
  lastSyncedAt: string | null;
  notes: string | null;
};
