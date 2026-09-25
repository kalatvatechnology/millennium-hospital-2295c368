/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import { logAction } from "@/lib/audit";
import { backendFeatures, usesProductionContract } from "@/lib/data/backend";
import { classifyDataError } from "@/lib/data/errors";

export type FieldType = "text" | "textarea" | "number" | "boolean" | "list" | "select" | "image";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  publishControl?: boolean;
  help?: string;
  placeholder?: string;
  /** Maximum characters; shows a live counter and blocks save when exceeded. */
  maxLength?: number;
  /** Storage folder for image fields (inside the managed image bucket). */
  imageFolder?: string;
  /** Returns an error message when the value is invalid. */
  validate?: (value: string) => string | null;
};

export { mapEmbedUrlError, isGoogleMapsEmbedUrl } from "@/lib/map-embed";
import { mapEmbedUrlError } from "@/lib/map-embed";
import { googleReviewUrlError } from "@/lib/review-url";

export type ContentType = {
  key: string;
  table: string;
  label: string;
  singular: string;
  description: string;
  titleField: string;
  orderBy: string;
  subtitleField?: string;
  fields: Field[];
  available?: boolean;
};

const orderField: Field = { name: "display_order", label: "Display order", type: "number" };
const publishedField: Field = usesProductionContract
  ? {
      name: "status",
      label: "Status",
      type: "select",
      publishControl: true,
      options: [
        { value: "draft", label: "Draft" },
        { value: "published", label: "Published" },
        { value: "archived", label: "Archived" },
      ],
    }
  : { name: "published", label: "Published", type: "boolean", publishControl: true };

export const contentTypes: ContentType[] = [
  {
    key: "departments",
    table: "departments",
    label: "Departments",
    singular: "department",
    description: "Clinical departments shown across the website.",
    titleField: "name",
    subtitleField: "slug",
    orderBy: "display_order",
    fields: [
      { name: "name", label: "Department name", type: "text", required: true },
      { name: "slug", label: "Web address (slug)", type: "text", required: true },
      {
        name: "short_description",
        label: "Short description",
        type: "textarea",
        maxLength: 180,
        help: "Shown on the public Department Card. Maximum 180 characters.",
      },
      {
        name: "card_image_url",
        label: "Department card image",
        type: "image",
        imageFolder: "departments",
        help: "Recommended 1200 × 800 px (3:2 landscape). JPG, PNG or WebP.",
      },
      {
        name: "card_image_alt",
        label: "Image alt text",
        type: "text",
        maxLength: 160,
        placeholder: "Orthopaedics Department at The Millennium Hospital",
        help: "Describe the department image for accessibility and SEO.",
      },
      {
        name: "description",
        label: "Full description (future department page)",
        type: "textarea",
      },
      { ...orderField, help: "Lower number = earlier position." },
      publishedField,
    ],
  },
  {
    key: "doctors",
    table: "doctors",
    label: "Doctors",
    singular: "doctor",
    description: "Authoritative doctor profiles. Doctors cannot edit these directly.",
    titleField: usesProductionContract ? "full_name" : "name",
    subtitleField: usesProductionContract ? "specialization" : "specialty",
    orderBy: "display_order",
    fields: [
      {
        name: usesProductionContract ? "full_name" : "name",
        label: "Full name",
        type: "text",
        required: true,
      },
      { name: "slug", label: "Web address (slug)", type: "text", required: true },
      { name: "department_id", label: "Department", type: "select", options: [] },
      { name: "photo_url", label: "Photo URL", type: "text" },
      { name: "qualifications", label: "Qualifications (comma separated)", type: "list" },
      { name: "designation", label: "Designation", type: "text" },
      {
        name: usesProductionContract ? "specialization" : "specialty",
        label: "Specialty",
        type: "text",
      },
      { name: "experience_years", label: "Years of experience", type: "number" },
      { name: "bio", label: "Biography", type: "textarea" },
      { name: "short_introduction", label: "Short introduction", type: "textarea" },
      { name: "hero_image_url", label: "Hero image URL", type: "text" },
      { name: "hero_image_alt", label: "Hero image alternative text", type: "text" },
      { name: "profile_image_alt", label: "Profile image alternative text", type: "text" },
      { name: "quote", label: "Doctor quote", type: "textarea" },
      { name: "quote_attribution", label: "Quote attribution", type: "text" },
      { name: "phone_number", label: "Phone number", type: "text" },
      { name: "expertise", label: "Areas of expertise (comma separated)", type: "list" },
      { name: "languages", label: "Languages (comma separated)", type: "list" },
      { name: "location", label: "Location", type: "text" },
      {
        name: usesProductionContract ? "whatsapp" : "whatsapp_number",
        label: "WhatsApp number",
        type: "text",
      },
      ...(usesProductionContract
        ? [
            {
              name: "consultation_info",
              label: "Consultation information",
              type: "textarea" as const,
            },
            { name: "location_info", label: "Location information", type: "textarea" as const },
            {
              name: "social_links",
              label: "Professional social links (JSON)",
              type: "textarea" as const,
            },
          ]
        : [
            {
              name: "verification_status",
              label: "Verification",
              type: "select",
              options: [
                { value: "unverified", label: "Unverified" },
                { value: "pending", label: "Pending verification" },
                { value: "verified", label: "Verified" },
              ],
            } as Field,
          ]),
      ...(!usesProductionContract
        ? [
            { name: "seo_title", label: "SEO title", type: "text" as const },
            { name: "seo_description", label: "SEO description", type: "textarea" as const },
            { name: "canonical_url", label: "Canonical URL", type: "text" as const },
            { name: "og_image_url", label: "Open Graph image URL", type: "text" as const },
          ]
        : []),
      orderField,
      publishedField,
    ],
  },
  {
    key: "professional-services",
    table: usesProductionContract ? "services" : "professional_services",
    label: "Professional services",
    singular: "professional service",
    description: "Specialist professional services, kept separate from hospital services.",
    titleField: "title",
    subtitleField: "slug",
    orderBy: "display_order",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Web address (slug)", type: "text", required: true },
      { name: "summary", label: "Summary", type: "textarea" },
      { name: "description", label: "Description", type: "textarea" },
      orderField,
      publishedField,
    ],
  },
  {
    key: "hospital-services",
    table: "hospital_services",
    available: !usesProductionContract,
    label: "Hospital services",
    singular: "hospital service",
    description: "Clinical, diagnostic and support services offered by the hospital.",
    titleField: "title",
    subtitleField: "slug",
    orderBy: "display_order",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Web address (slug)", type: "text", required: true },
      { name: "summary", label: "Summary", type: "textarea" },
      { name: "description", label: "Description", type: "textarea" },
      orderField,
      publishedField,
    ],
  },
  {
    key: "facilities",
    table: "facilities",
    label: "Facilities",
    singular: "facility",
    description: "Wards, theatres, diagnostics and other hospital facilities.",
    titleField: "name",
    subtitleField: "slug",
    orderBy: "display_order",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Web address (slug)", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "images", label: "Image URLs (comma separated)", type: "list" },
      orderField,
      publishedField,
    ],
  },
  {
    key: "locations",
    table: "locations",
    label: "Locations",
    singular: "location",
    description: "Hospital sites, addresses and contact details.",
    titleField: "name",
    subtitleField: "city",
    orderBy: "display_order",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Web address (slug)", type: "text", required: true },
      { name: "address_line", label: "Address", type: "textarea" },
      { name: "city", label: "City", type: "text" },
      { name: "state", label: "State", type: "text" },
      { name: "postal_code", label: "Postal code", type: "text" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "email", label: "Email", type: "text" },
      {
        name: "map_url",
        label: "Map URL (Get Directions)",
        type: "text",
        placeholder: "https://www.google.com/maps/...",
        help: "Used for the Get Directions / Google Maps link.",
      },
      {
        name: "map_embed_url",
        label: "Map Embed URL (interactive map)",
        type: "text",
        placeholder: "https://www.google.com/maps/embed?pb=...",
        help: "Paste the Google Maps embed URL used to display the interactive map on the website. Paste the URL only, not the iframe code.",
        validate: mapEmbedUrlError,
      },
      {
        name: "google_review_url",
        label: "Google Reviews URL",
        type: "text",
        placeholder: "https://g.page/r/.../review",
        help: "Paste the Google review link for this location. This will be used by Digital Doctor Cards when the doctor does not have their own Google Reviews URL.",
        validate: googleReviewUrlError,
      },
      { name: "opening_hours", label: "Opening hours", type: "textarea" },
      orderField,
      publishedField,
    ],
  },
  {
    key: "media",
    table: usesProductionContract ? "media_content" : "media_items",
    label: "Media & content",
    singular: "media item",
    description: "Videos, reels and podcasts. Video files stay on their original platform.",
    titleField: "title",
    subtitleField: usesProductionContract ? "platform" : "media_type",
    orderBy: "display_order",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      {
        name: usesProductionContract ? "platform" : "media_type",
        label: "Type",
        type: "select",
        required: true,
        options: [
          { value: "youtube", label: "YouTube video" },
          { value: "reel", label: "Reel" },
          { value: "podcast", label: "Podcast" },
          { value: "article", label: "Article" },
        ],
      },
      { name: "url", label: "Link", type: "text", required: true },
      { name: "thumbnail_url", label: "Thumbnail URL", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      {
        name: usesProductionContract ? "show_on_homepage" : "show_on_home",
        label: "Show on home page",
        type: "boolean",
      },
      orderField,
      publishedField,
    ],
  },
  {
    key: "faq-categories",
    table: "faq_categories",
    available: backendFeatures.faqCategories,
    label: "FAQ categories",
    singular: "FAQ category",
    description: "Groups used to organise frequently asked questions.",
    titleField: "name",
    subtitleField: "slug",
    orderBy: "display_order",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Web address (slug)", type: "text", required: true },
      orderField,
      publishedField,
    ],
  },
  {
    key: "faqs",
    table: "faqs",
    label: "FAQs",
    singular: "FAQ",
    description: "Questions and answers shown to patients and families.",
    titleField: "question",
    orderBy: "display_order",
    fields: [
      { name: "question", label: "Question", type: "text", required: true },
      { name: "answer", label: "Answer", type: "textarea", required: true },
      ...(usesProductionContract
        ? [{ name: "category", label: "Category", type: "text" as const }]
        : []),
      orderField,
      publishedField,
    ],
  },
  {
    key: "reviews",
    table: "reviews",
    label: "Reviews",
    singular: "review",
    description: "Only add reviews the hospital has actually received.",
    titleField: "author_name",
    subtitleField: "source",
    orderBy: "display_order",
    fields: [
      { name: "author_name", label: "Author name", type: "text", required: true },
      { name: "content", label: "Review", type: "textarea", required: true },
      {
        name: "review_type",
        label: "Type",
        type: "select",
        required: true,
        options: [
          { value: "hospital", label: "Hospital" },
          { value: "doctor", label: "Doctor" },
        ],
      },
      { name: "rating", label: "Rating out of 5", type: "number" },
      { name: "source", label: "Source", type: "text" },
      orderField,
      ...(usesProductionContract
        ? [{ name: "is_featured", label: "Featured", type: "boolean" as const }, publishedField]
        : [
            {
              name: "show_publicly",
              label: "Show publicly",
              type: "boolean" as const,
              publishControl: true,
            },
          ]),
    ],
  },
  {
    key: "pages",
    table: "website_pages",
    available: backendFeatures.websitePages,
    label: "Website pages",
    singular: "page",
    description: "Standalone pages controlled by the hospital.",
    titleField: "title",
    subtitleField: "slug",
    orderBy: "display_order",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Web address (slug)", type: "text", required: true },
      { name: "body", label: "Page content", type: "textarea" },
      { name: "meta_title", label: "Search engine title", type: "text" },
      { name: "meta_description", label: "Search engine description", type: "textarea" },
      {
        name: "status",
        label: "Status",
        type: "select",
        publishControl: true,
        options: [
          { value: "draft", label: "Draft" },
          { value: "in_review", label: "In review" },
          { value: "ready_to_publish", label: "Ready to publish" },
          { value: "published", label: "Published" },
        ],
      },
      orderField,
    ],
  },
  {
    key: "navigation",
    table: "navigation_items",
    available: backendFeatures.navigation,
    label: "Navigation",
    singular: "navigation link",
    description: "Links shown in the website menus.",
    titleField: "label",
    subtitleField: "href",
    orderBy: "display_order",
    fields: [
      { name: "label", label: "Label", type: "text", required: true },
      { name: "href", label: "Link address", type: "text", required: true },
      {
        name: "menu",
        label: "Menu",
        type: "select",
        required: true,
        options: [
          { value: "primary", label: "Main menu" },
          { value: "footer", label: "Footer" },
        ],
      },
      orderField,
      publishedField,
    ],
  },
];

export function contentTypeByKey(key: string) {
  return contentTypes.find((type) => type.key === key);
}

export function emptyContentValues(type: ContentType) {
  const values: Record<string, any> = {};
  for (const field of type.fields) {
    values[field.name] = field.type === "boolean" ? false : field.type === "select" ? (field.options?.[0]?.value ?? "") : "";
  }
  return values;
}

export function contentFormValues(type: ContentType, row: Record<string, any>) {
  const values: Record<string, any> = {};
  for (const field of type.fields) {
    const raw = row[field.name];
    values[field.name] = field.type === "list" ? (Array.isArray(raw) ? raw.join(", ") : "") : field.type === "boolean" ? Boolean(raw) : (raw ?? "");
  }
  return values;
}

export function contentPayload(type: ContentType, values: Record<string, any>, canPublish: boolean) {
  const payload: Record<string, any> = {};
  for (const field of type.fields) {
    if (field.publishControl && !canPublish) continue;
    const raw = values[field.name];
    if (field.type === "list") payload[field.name] = String(raw).split(",").map((item) => item.trim()).filter(Boolean);
    else if (field.type === "boolean") payload[field.name] = Boolean(raw);
    else if (field.type === "number") { if (raw !== "" && raw !== null) payload[field.name] = Number(raw); }
    else payload[field.name] = raw === "" ? null : field.validate && typeof raw === "string" ? raw.trim() || null : raw;
  }
  return payload;
}

export async function listRecords(type: ContentType) {
  if (type.available === false) return [];
  const { data, error } = await (supabase as any)
    .from(type.table)
    .select(
      type.key === "doctors"
        ? "*, doctor_specializations(enabled,display_order,department_specializations(name))"
        : "*",
    )
    .order(type.orderBy)
    .limit(1000);
  if (error) throw classifyDataError(error);
  return (data ?? []) as Record<string, any>[];
}

export async function getRecord(type: ContentType, id: string) {
  if (type.available === false) throw classifyDataError(new Error("table does not exist"));
  const { data, error } = await (supabase as any)
    .from(type.table)
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw classifyDataError(error);
  return data as Record<string, any>;
}

export async function saveRecord(
  type: ContentType,
  id: string | null,
  values: Record<string, any>,
) {
  if (type.available === false) throw classifyDataError(new Error("table does not exist"));
  if ("google_review_url" in values)
    values = { ...values, google_review_url: String(values["google_review_url"] ?? "").trim() || null };
  const query = (supabase as any).from(type.table);
  const { data, error } = id ? await query.update(values).eq("id", id).select().single() : await query.insert(values).select().single();
  if (error) throw classifyDataError(error);
  await logAction({
    action: id ? "update" : "create",
    entityTable: type.table,
    entityId: id || data?.id,
    summary: `${id ? "Updated" : "Created"} ${type.singular}: ${values[type.titleField] ?? ""}`,
  });
}

export async function deleteRecord(type: ContentType, id: string, title?: string) {
  if (type.available === false) throw classifyDataError(new Error("table does not exist"));
  const { error } = await (supabase as any).from(type.table).delete().eq("id", id);
  if (error) throw classifyDataError(error);
  await logAction({
    action: "delete",
    entityTable: type.table,
    entityId: id,
    summary: `Deleted ${type.singular}: ${title ?? id}`,
  });
}
