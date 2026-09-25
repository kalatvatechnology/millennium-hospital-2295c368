import { enabledItems, type DepartmentPage } from "@/lib/department-page";

export type DepartmentSectionKey =
  | "identity"
  | "about"
  | "care"
  | "conditions"
  | "specialists"
  | "facilities"
  | "approach"
  | "faqs"
  | "media"
  | "seo"
  | "publishing";

export type CompletionPriority = "required" | "recommended";
export type CompletionState = "complete" | "attention" | "optional";

export type CompletionItem = {
  label: string;
  section: DepartmentSectionKey;
  priority: CompletionPriority;
  complete: boolean;
  applicable: boolean;
};

type DepartmentIdentity = {
  name: string;
  slug: string;
  short_description: string;
  description: string;
};

const validSlug = (slug: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
const hasListContent = (pageSection: DepartmentPage["about"]) =>
  Boolean(pageSection.intro.trim() || pageSection.title.trim() || enabledItems(pageSection).length);

export function getDepartmentCompletion({
  identity,
  page,
  cardImage,
  published,
}: {
  identity: DepartmentIdentity;
  page: DepartmentPage;
  cardImage: string | null;
  published: boolean;
}) {
  const links = page.links ?? { doctors: [], faqs: [], media: [] };
  const items: CompletionItem[] = [
    {
      label: "Department name missing",
      section: "identity",
      priority: "required",
      complete: Boolean(identity.name.trim()),
      applicable: true,
    },
    {
      label: "Valid web address missing",
      section: "identity",
      priority: "required",
      complete: validSlug(identity.slug),
      applicable: true,
    },
    {
      label: "Short description recommended",
      section: "identity",
      priority: "recommended",
      complete: Boolean(identity.short_description.trim()),
      applicable: true,
    },
    {
      label: "Hero content recommended",
      section: "identity",
      priority: "recommended",
      complete: Boolean(
        page.hero.headline.trim() &&
          (page.hero.image_url || cardImage) &&
          (!page.hero.image_url || page.hero.image_alt.trim()),
      ),
      applicable: page.hero.enabled,
    },
    {
      label: "About content recommended",
      section: "about",
      priority: "recommended",
      complete: Boolean(identity.description.trim() || hasListContent(page.about)),
      applicable: page.about.enabled,
    },
    {
      label: "Specialized care content recommended",
      section: "care",
      priority: "recommended",
      complete: enabledItems(page.care).length > 0,
      applicable: page.care.enabled,
    },
    {
      label: "Conditions content recommended",
      section: "conditions",
      priority: "recommended",
      complete: enabledItems(page.conditions).length > 0,
      applicable: page.conditions.enabled,
    },
    {
      label: "At least one specialist recommended",
      section: "specialists",
      priority: "recommended",
      complete: links.doctors.length > 0,
      applicable: page.specialists.enabled,
    },
    {
      label: "Facilities content recommended",
      section: "facilities",
      priority: "recommended",
      complete: Boolean(
        hasListContent(page.facilities) &&
          (!page.facilities.image_url || page.facilities.image_alt.trim()),
      ),
      applicable: page.facilities.enabled,
    },
    {
      label: "Millennium Approach content recommended",
      section: "approach",
      priority: "recommended",
      complete: enabledItems(page.approach).length > 0,
      applicable: page.approach.enabled,
    },
    {
      label: "FAQ content recommended",
      section: "faqs",
      priority: "recommended",
      complete: links.faqs.length > 0,
      applicable: page.faqs.enabled,
    },
    {
      label: "Additional media recommended",
      section: "media",
      priority: "recommended",
      complete: links.media.length > 0,
      applicable: page.media.enabled,
    },
    {
      label: "SEO description recommended",
      section: "seo",
      priority: "recommended",
      complete: Boolean(page.seo.description.trim()),
      applicable: true,
    },
  ];

  const applicable = items.filter((item) => item.applicable);
  const completed = applicable.filter((item) => item.complete).length;
  const percentage = applicable.length ? Math.round((completed / applicable.length) * 100) : 100;
  const missing = applicable.filter((item) => !item.complete);
  const sectionStates = Object.fromEntries(
    (
      [
        "identity",
        "about",
        "care",
        "conditions",
        "specialists",
        "facilities",
        "approach",
        "faqs",
        "media",
        "seo",
        "publishing",
      ] as DepartmentSectionKey[]
    ).map((section) => {
      if (section === "publishing") return [section, published ? "complete" : "optional"];
      const checks = items.filter((item) => item.section === section);
      if (!checks.some((item) => item.applicable)) return [section, "optional"];
      return [
        section,
        checks.filter((item) => item.applicable).every((item) => item.complete)
          ? "complete"
          : "attention",
      ];
    }),
  ) as Record<DepartmentSectionKey, CompletionState>;

  return { percentage, items, missing, sectionStates };
}