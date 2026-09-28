import { linkOptions } from "@tanstack/react-router";
import type { Permission } from "@/lib/permissions";
import type { SeoEntityType } from "./types";

/** Field keys the CMS editors can scroll to and highlight (see FieldFocus). */
export type SeoFixField =
  | "seo_title"
  | "meta_description"
  | "canonical_url"
  | "indexable"
  | "image_alt"
  | "heading"
  | "content";

/** Visible field labels used by the existing editors, per field key. */
export const SEO_FIX_FIELD_LABELS: Record<SeoFixField, string[]> = {
  seo_title: ["SEO title", "Search engine title"],
  // Services use Summary and locations use Address as their search description.
  meta_description: [
    "Meta description",
    "SEO description",
    "Search engine description",
    "Summary",
    "Address",
  ],
  canonical_url: ["Canonical URL"],
  indexable: ["Allow search engines to index this page", "Search engines may index"],
  image_alt: [
    "Hero image alt text",
    "Alternative text",
    "Profile image alt",
    "Alt text",
    "Feature image alt text",
  ],
  heading: ["Department name", "Doctor name", "Title", "Name"],
  content: ["Page content", "Description", "Biography", "Summary"],
};

/** Which editor section and field each audit check points to. */
const ISSUE_FIELD: Record<string, SeoFixField> = {
  "title-missing": "seo_title",
  "title-length": "seo_title",
  "title-duplicate": "seo_title",
  "description-missing": "meta_description",
  "description-length": "meta_description",
  "description-duplicate": "meta_description",
  canonical: "canonical_url",
  indexable: "indexable",
  heading: "heading",
  "image-alt": "image_alt",
  content: "content",
  "internal-links": "content",
};

/** Checks where opening the public page helps the administrator verify the fix. */
const VIEW_PAGE_ISSUES = new Set(["heading", "image-alt", "content", "internal-links"]);

export type SeoFixTarget = {
  /** Built with linkOptions(), so every destination is checked against the real route tree. */
  link: { to: string; params?: Record<string, string>; search?: Record<string, string> };
  /** Compact breadcrumb, e.g. ["Departments", "Orthopedics", "SEO"]. */
  context: string[];
  permission: Permission;
  /** Set when the audit reads published content, so edits only count after publishing. */
  publishNote?: string;
};

/** Issue that exists but has no field in any CMS editor (e.g. set in site code). */
export type SeoManualIssue = { manual: true; reason: string };

const NO_FIELD: Partial<Record<SeoEntityType, SeoFixField[]>> = {
  professional_service: ["seo_title", "canonical_url", "indexable"],
  hospital_service: ["seo_title", "canonical_url", "indexable"],
  location: ["seo_title", "canonical_url", "indexable"],
};

function sectionFor(type: SeoEntityType, field: SeoFixField): { key: string; label: string } {
  if (type === "department") {
    if (field === "image_alt" || field === "heading") return { key: "identity", label: "Identity & Hero" };
    if (field === "content") return { key: "about", label: "About Department" };
    return { key: "seo", label: "SEO" };
  }
  if (type === "doctor") {
    if (field === "image_alt" || field === "heading" || field === "content")
      return { key: "profile", label: "Profile" };
    return { key: "seo", label: "SEO" };
  }
  if (type === "blog_post") {
    if (field === "image_alt") return { key: "media", label: "Media" };
    if (field === "heading" || field === "content") return { key: "writing", label: "Writing" };
    return { key: "seo", label: "SEO" };
  }
  return { key: "", label: "" };
}

/**
 * Builds the direct CMS destination for one affected record of one audit check.
 * Returns null when there is no editable source for the issue (nothing to fix in the CMS).
 */
export function seoFixTarget(
  issueKey: string,
  entity: { type: SeoEntityType; id: string; label: string },
): SeoFixTarget | SeoManualIssue | null {
  const field = ISSUE_FIELD[issueKey];
  if (!field) return null;
  if (NO_FIELD[entity.type]?.includes(field))
    return { manual: true, reason: "Managed automatically by the website." };
  if (entity.type === "faq" && field !== "content")
    return { manual: true, reason: "Managed automatically by the website." };
  const section = sectionFor(entity.type, field);
  switch (entity.type) {
    case "department":
      return {
        link: linkOptions({
          to: "/_admin/departments/$departmentId/$section",
          params: { departmentId: entity.id, section: section.key },
          search: { field },
        }),
        context: ["Departments", entity.label, section.label],
        permission: "content.write",
        publishNote: "Saved as a draft → publish the department → the audit updates.",
      };
    case "doctor":
      return {
        link: linkOptions({
          to: "/_admin/doctors/$doctorId/$section",
          params: { doctorId: entity.id, section: section.key },
          search: { field },
        }),
        context: ["Doctors", entity.label, section.label],
        permission: "content.write",
      };
    case "blog_post":
      return {
        link: linkOptions({
          to: "/_admin/blog/$postId/$section",
          params: { postId: entity.id, section: section.key },
          search: { field },
        }),
        context: ["Blog", entity.label, section.label],
        permission: "content.write",
      };
    case "professional_service":
    case "hospital_service":
    case "location":
    case "page": {
      const contentType = {
        professional_service: "professional-services",
        hospital_service: "hospital-services",
        location: "locations",
        page: "pages",
      }[entity.type];
      const listLabel = {
        professional_service: "Professional services",
        hospital_service: "Hospital services",
        location: "Locations",
        page: "Website content",
      }[entity.type];
      return {
        link: linkOptions({
          to: "/_admin/content/$contentType/$recordId",
          params: { contentType, recordId: entity.id },
          search: { field },
        }),
        context:
          entity.type === "page" && field !== "content" && field !== "heading"
            ? [listLabel, entity.label, "SEO"]
            : [listLabel, entity.label],
        permission: entity.type === "location" ? "locations.manage" : "content.write",
      };
    }
    case "faq":
      // /faq's content is the hospital-wide FAQ list (title/description handled above as code-managed).
      return {
        link: linkOptions({ to: "/_admin/faqs" }),
        context: ["FAQs", "Hospital-wide FAQs"],
        permission: "content.write",
      };
  }
}

export function showViewPage(issueKey: string): boolean {
  return VIEW_PAGE_ISSUES.has(issueKey);
}
