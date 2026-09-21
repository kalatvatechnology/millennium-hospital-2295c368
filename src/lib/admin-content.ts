/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";

export type FieldType = "text" | "textarea" | "number" | "boolean" | "list";

export type Field = { name: string; label: string; type: FieldType; required?: boolean };

export type ContentType = {
  table: string;
  label: string;
  titleField: string;
  orderBy: string;
  fields: Field[];
};

export const contentTypes: ContentType[] = [
  {
    table: "departments",
    label: "Departments",
    titleField: "name",
    orderBy: "display_order",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Web address (slug)", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "display_order", label: "Display order", type: "number" },
      { name: "published", label: "Published", type: "boolean" },
    ],
  },
  {
    table: "doctors",
    label: "Doctors",
    titleField: "name",
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
      { name: "display_order", label: "Display order", type: "number" },
      { name: "published", label: "Published", type: "boolean" },
    ],
  },
  {
    table: "professional_services",
    label: "Professional services",
    titleField: "title",
    orderBy: "display_order",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Web address (slug)", type: "text", required: true },
      { name: "summary", label: "Summary", type: "textarea" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "display_order", label: "Display order", type: "number" },
      { name: "published", label: "Published", type: "boolean" },
    ],
  },
  {
    table: "hospital_services",
    label: "Hospital services",
    titleField: "title",
    orderBy: "display_order",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Web address (slug)", type: "text", required: true },
      { name: "summary", label: "Summary", type: "textarea" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "display_order", label: "Display order", type: "number" },
      { name: "published", label: "Published", type: "boolean" },
    ],
  },
  {
    table: "facilities",
    label: "Facilities",
    titleField: "name",
    orderBy: "display_order",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Web address (slug)", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "images", label: "Image URLs (comma separated)", type: "list" },
      { name: "display_order", label: "Display order", type: "number" },
      { name: "published", label: "Published", type: "boolean" },
    ],
  },
  {
    table: "media_items",
    label: "Media",
    titleField: "title",
    orderBy: "display_order",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "media_type", label: "Type (youtube, reel or podcast)", type: "text", required: true },
      { name: "url", label: "Link", type: "text", required: true },
      { name: "thumbnail_url", label: "Thumbnail URL", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "show_on_home", label: "Show on home page", type: "boolean" },
      { name: "display_order", label: "Display order", type: "number" },
      { name: "published", label: "Published", type: "boolean" },
    ],
  },
  {
    table: "faqs",
    label: "FAQs",
    titleField: "question",
    orderBy: "display_order",
    fields: [
      { name: "question", label: "Question", type: "text", required: true },
      { name: "answer", label: "Answer", type: "textarea", required: true },
      { name: "display_order", label: "Display order", type: "number" },
      { name: "published", label: "Published", type: "boolean" },
    ],
  },
  {
    table: "reviews",
    label: "Reviews",
    titleField: "author_name",
    orderBy: "display_order",
    fields: [
      { name: "author_name", label: "Author name", type: "text", required: true },
      { name: "content", label: "Review", type: "textarea", required: true },
      { name: "review_type", label: "Type (hospital or doctor)", type: "text", required: true },
      { name: "rating", label: "Rating out of 5", type: "number" },
      { name: "source", label: "Source", type: "text" },
      { name: "display_order", label: "Display order", type: "number" },
      { name: "show_publicly", label: "Show publicly", type: "boolean" },
    ],
  },
];

export async function listRecords(type: ContentType) {
  const { data, error } = await (supabase as any).from(type.table).select("*").order(type.orderBy).limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []) as Record<string, any>[];
}

export async function saveRecord(type: ContentType, id: string | null, values: Record<string, any>) {
  const query = (supabase as any).from(type.table);
  const { error } = id ? await query.update(values).eq("id", id) : await query.insert(values);
  if (error) throw new Error(error.message);
}

export async function deleteRecord(type: ContentType, id: string) {
  const { error } = await (supabase as any).from(type.table).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
