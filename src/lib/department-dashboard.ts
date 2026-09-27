/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDepartmentCompletion } from "@/lib/department-completion";
import { enabledItems, hasPageContent, parseDepartmentPage, type DepartmentPage, type ListSection } from "@/lib/department-page";
import { share, weightedCompletion, type ReadinessState, type ScoredSection } from "@/lib/profile-scoring";

/** Adjust section weights here; the list UI reads only the computed result. */
export const DEPARTMENT_WEIGHTS = {
  identity: 10,
  hero: 10,
  about: 10,
  care: 10,
  conditions: 8,
  specialists: 10,
  facilities: 8,
  approach: 6,
  faqs: 6,
  media: 4,
  seo: 10,
  card: 8,
} as const;

type Key = keyof typeof DEPARTMENT_WEIGHTS;

const LABELS: Record<Key, string> = {
  identity: "Identity",
  hero: "Hero",
  about: "About",
  care: "Specialized Care",
  conditions: "Conditions",
  specialists: "Specialists",
  facilities: "Facilities & Technology",
  approach: "Millennium Approach",
  faqs: "FAQs",
  media: "Media",
  seo: "SEO",
  card: "Department Card / OG Image",
};

const listScore = (s: ListSection) => share(s.title.trim() || s.intro.trim(), enabledItems(s).length > 0);

export type DepartmentInsight = ReturnType<typeof getDepartmentInsight>;

type DepartmentIdentity = { name: string; slug: string; short_description: string; description: string };

/**
 * The single Department completion score. Used by the Departments list and the
 * Department editor so both always show the same percentage for the same content.
 * Specialists/FAQs/Media count the selections saved on the page itself.
 */
export function scoreDepartment({
  identity,
  page,
  cardImage,
}: {
  identity: DepartmentIdentity;
  page: DepartmentPage;
  cardImage: string | null;
}) {
  const links = page.links;
  const doctors = links?.doctors.length ?? 0;
  const faqs = links?.faqs.length ?? 0;
  const media = links?.media.length ?? 0;
  const sections: ScoredSection<Key>[] = (
    [
      ["identity", true, share(identity.name.trim(), identity.slug.trim(), identity.short_description.trim())],
      ["hero", page.hero.enabled, share(page.hero.headline.trim(), page.hero.intro.trim(), page.hero.image_url && page.hero.image_alt.trim())],
      ["about", page.about.enabled, identity.description.trim() ? 1 : listScore(page.about)],
      ["care", page.care.enabled, listScore(page.care)],
      ["conditions", page.conditions.enabled, listScore(page.conditions)],
      ["specialists", page.specialists.enabled, doctors > 0 ? 1 : 0],
      ["facilities", page.facilities.enabled, share(page.facilities.title.trim() || page.facilities.intro.trim(), enabledItems(page.facilities).length > 0, page.facilities.image_url)],
      ["approach", page.approach.enabled, listScore(page.approach)],
      ["faqs", page.faqs.enabled, faqs > 0 ? 1 : 0],
      ["media", page.media.enabled, media > 0 ? 1 : 0],
      ["seo", true, share(page.seo.title.trim(), page.seo.description.trim())],
      ["card", true, cardImage ? 1 : 0],
    ] as [Key, boolean, number][]
  ).map(([key, applicable, score]) => ({ key, label: LABELS[key], weight: DEPARTMENT_WEIGHTS[key], applicable, score }));
  return { sections, percentage: weightedCompletion(sections) };
}

/** Card / OG image rule shared by list and editor. */
export const departmentCardImage = (page: DepartmentPage, row: Record<string, any> | null | undefined): string | null =>
  page.seo.og_image_url || row?.["card_image_url"] || null;

export function getDepartmentInsight(
  row: Record<string, any>,
  counts: { doctors: number; services: number },
) {
  // Content score uses the saved working version: the saved draft when one exists, otherwise what is live.
  const page = parseDepartmentPage(
    hasPageContent(row["page_draft"]) ? row["page_draft"] : row["page_published"],
  );
  const identity = {
    name: String(row["name"] ?? ""),
    slug: String(row["slug"] ?? ""),
    short_description: String(row["short_description"] ?? ""),
    description: String(row["description"] ?? ""),
  };
  const published = Boolean(row["published"]);
  const cardImage = departmentCardImage(page, row);
  const { sections, percentage } = scoreDepartment({ identity, page, cardImage });

  // Blocking issues = the existing CMS validation rules (the same ones Save/Publish enforce).
  const blocking = getDepartmentCompletion({ identity, page, cardImage, published })
    .missing.filter((item) => item.priority === "required")
    .map((item) => item.label);

  const seoIssues = [
    !page.seo.title.trim() && "SEO title missing",
    !page.seo.description.trim() && "SEO description missing",
  ].filter(Boolean) as string[];
  const seoReady = seoIssues.length === 0 && Boolean(cardImage);

  const attention = [
    ...blocking,
    !cardImage && "Card / OG image missing",
    page.hero.enabled && !page.hero.image_url && "Hero image missing",
    ...seoIssues,
  ].filter(Boolean) as string[];

  const readiness: ReadinessState = blocking.length
    ? "not_ready"
    : attention.length
      ? "attention"
      : "ready";

  const updatedAt = [row["updated_at"], row["page_draft_saved_at"]]
    .filter(Boolean)
    .sort()
    .at(-1) as string | undefined;

  return {
    percentage,
    sections,
    readiness,
    attention,
    seoReady,
    cardImage,
    // Counts = saved doctor_departments / professional_service_departments rows only.
    doctors: counts.doctors,
    services: counts.services,
    published,
    updatedAt: updatedAt ?? null,
  };
}
