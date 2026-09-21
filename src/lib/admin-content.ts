/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import { logAction } from "@/lib/audit";

export type FieldType = "text" | "textarea" | "number" | "boolean" | "list" | "select";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  publishControl?: boolean;
};

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
};

const orderField: Field = { name: "display_order", label: "Display order", type: "number" };
const publishedField: Field = { name: "published", label: "Published", type: "boolean", publishControl: true };

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
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Web address (slug)", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      orderField,
      publishedField,
    ],
  },
  {
    key: "doctors",
    table: "doctors",
    label: "Doctors",
    singular: "doctor",
    description: "Authoritative doctor profiles. Doctors cannot edit these directly.",
    titleField: "name",
    subtitleField: "specialty",
    orderBy: "display_order",
    fields: [
      { name: "name", label: "Full name", type: "text", required: true },
      { name: "slug", label: "Web address (slug)", type: "text", required: true },
      { name: "photo_url", label: "Photo URL", type: "text" },
      { name: "qualifications", label: "Qualifications (comma separated)", type: "list" },
      { name: "designation", label: "Designation", type: "text" },
      { name: "specialty", label: "Specialty", type: "text" },
      { name: "experience_years", label: "Years of experience", type: "number" },
      { name: "bio", label: "Biography", type: "textarea" },
      { name: "expertise", label: "Areas of expertise (comma separated)", type: "list" },
      { name: "languages", label: "Languages (comma separated)", type: "list" },
      { name: "location", label: "Location", type: "text" },
      { name: "whatsapp_number", label: "WhatsApp number", type: "text" },
      {
        name: "verification_status",
        label: "Verification",
        type: "select",
        options: [
          { value: "unverified", label: "Unverified" },
          { value: "pending", label: "Pending verification" },
          { value: "verified", label: "Verified" },
        ],
      },
      orderField,
      publishedField,
    ],
  },
  {
    key: "professional-services",
    table: "professional_services",
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
      { name: "map_url", label: "Map link", type: "text" },
      { name: "opening_hours", label: "Opening hours", type: "textarea" },
      orderField,
      publishedField,
    ],
  },
  {
    key: "media",
    table: "media_items",
    label: "Media & content",
    singular: "media item",
    description: "Videos, reels and podcasts. Video files stay on their original platform.",
    titleField: "title",
    subtitleField: "media_type",
    orderBy: "display_order",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      {
        name: "media_type",
        label: "Type",
        type: "select",
        required: true,
        options: [
          { value: "youtube", label: "YouTube video" },
          { value: "reel", label: "Reel" },
          { value: "podcast", label: "Podcast" },
        ],
      },
      { name: "url", label: "Link", type: "text", required: true },
      { name: "thumbnail_url", label: "Thumbnail URL", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "show_on_home", label: "Show on home page", type: "boolean" },
      orderField,
      publishedField,
    ],
  },
  {
    key: "faq-categories",
    table: "faq_categories",
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
      { name: "show_publicly", label: "Show publicly", type: "boolean", publishControl: true },
    ],
  },
  {
    key: "pages",
    table: "website_pages",
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

export async function listRecords(type: ContentType) {
  const { data, error } = await (supabase as any).from(type.table).select("*").order(type.orderBy).limit(1000);
  if (error) throw new Error(error.message);
  return (data ?? []) as Record<string, any>[];
}

export async function saveRecord(type: ContentType, id: string | null, values: Record<string, any>) {
  const query = (supabase as any).from(type.table);
  const { error } = id ? await query.update(values).eq("id", id) : await query.insert(values);
  if (error) throw new Error(error.message);
  await logAction({
    action: id ? "update" : "create",
    entityTable: type.table,
    entityId: id,
    summary: `${id ? "Updated" : "Created"} ${type.singular}: ${values[type.titleField] ?? ""}`,
  });
}

export async function deleteRecord(type: ContentType, id: string, title?: string) {
  const { error } = await (supabase as any).from(type.table).delete().eq("id", id);
  if (error) throw new Error(error.message);
  await logAction({ action: "delete", entityTable: type.table, entityId: id, summary: `Deleted ${type.singular}: ${title ?? id}` });
}
