import type { ContentStatus } from "./backend";
import type {
  Department,
  Doctor,
  Facility,
  Faq,
  MediaItem,
  MediaPlatform,
  Review,
  Service,
} from "./models";

type Row = Record<string, unknown>;

const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value : null;
const number = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
const list = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
const object = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
};
const booleanObject = (value: unknown): Record<string, boolean> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, boolean] => typeof entry[1] === "boolean",
    ),
  );
};
const status = (row: Row): ContentStatus => {
  if (row["status"] === "published" || row["status"] === "archived") return row["status"];
  return row["published"] === true ? "published" : "draft";
};
const required = (value: unknown, fallback: string): string => text(value) ?? fallback;

export function mapDepartment(row: Row): Department {
  return {
    id: required(row["id"], ""),
    name: required(row["name"], "Unnamed department"),
    slug: required(row["slug"], ""),
    description: text(row["description"]),
    display_order: number(row["display_order"]),
    status: status(row),
  };
}

function mapDepartmentSummary(value: unknown): Doctor["department"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Row;
  const id = text(row["id"]);
  const name = text(row["name"]);
  const slug = text(row["slug"]);
  return id && name && slug ? { id, name, slug } : null;
}

export function mapDoctor(row: Row, department?: unknown): Doctor {
  const relationshipValues = Array.isArray(row["doctor_departments"])
    ? row["doctor_departments"]
        .map((item) =>
          item && typeof item === "object" && !Array.isArray(item)
            ? mapDepartmentSummary((item as Row)["departments"])
            : null,
        )
        .filter((item): item is NonNullable<Doctor["department"]> => Boolean(item))
    : [];
  const fallbackDepartment = mapDepartmentSummary(department ?? row["department"]);
  const departments = relationshipValues.length
    ? relationshipValues
    : fallbackDepartment
      ? [fallbackDepartment]
      : [];
  return {
    id: required(row["id"], ""),
    name: required(row["full_name"] ?? row["name"], "Unnamed doctor"),
    slug: required(row["slug"], ""),
    professional_registration_no: text(row["professional_registration_no"]),
    photo_url: text(row["photo_url"] ?? row["image_url"]),
    qualifications: list(row["qualifications"]),
    designation: text(row["designation"]),
    specialty: text(row["specialization"] ?? row["specialty"]),
    experience_years: number(row["experience_years"]),
    bio: text(row["bio"]),
    short_introduction: text(row["short_introduction"]),
    hero_image_url: text(row["hero_image_url"]),
    hero_image_alt: text(row["hero_image_alt"]),
    hero_image_position:
      row["hero_image_position"] === "left" || row["hero_image_position"] === "right"
        ? row["hero_image_position"]
        : "center",
    hero_background_image_url: text(row["hero_background_image_url"]),
    hero_background_image_alt: text(row["hero_background_image_alt"]),
    hero_background_position:
      row["hero_background_position"] === "left" || row["hero_background_position"] === "right"
        ? row["hero_background_position"]
        : "center",
    profile_image_alt: text(row["profile_image_alt"]),
    quote: text(row["quote"]),
    quote_attribution: text(row["quote_attribution"]),
    phone_number: text(row["phone_number"]),
    phone_country_code: text(row["phone_country_code"]),
    seo_title: text(row["seo_title"]),
    seo_description: text(row["seo_description"]),
    canonical_url: text(row["canonical_url"]),
    og_image_url: text(row["og_image_url"]),
    section_visibility: booleanObject(row["section_visibility"]),
    expertise: list(row["expertise"]),
    languages: list(row["languages"]),
    location: text(row["location"] ?? row["location_info"]),
    whatsapp_number: text(row["whatsapp"] ?? row["whatsapp_number"]),
    whatsapp_country_code: text(row["whatsapp_country_code"]),
    consultation_info: text(row["consultation_info"]),
    location_info: text(row["location_info"]),
    social_links: object(row["social_links"]),
    display_order: number(row["display_order"]),
    status: status(row),
    department: departments[0] ?? null,
    departments,
  };
}

export function mapService(row: Row): Service {
  return {
    id: required(row["id"], ""),
    title: required(row["title"] ?? row["name"], "Unnamed service"),
    slug: required(row["slug"], ""),
    summary: text(row["summary"]),
    description: text(row["description"]),
    display_order: number(row["display_order"]),
    status: status(row),
  };
}

export function mapFacility(row: Row): Facility {
  const singleImage = text(row["image_url"]);
  return {
    id: required(row["id"], ""),
    name: required(row["name"], "Unnamed facility"),
    slug: required(row["slug"], ""),
    description: text(row["description"]),
    images: list(row["images"]).concat(singleImage ? [singleImage] : []),
    display_order: number(row["display_order"]),
    status: status(row),
  };
}

export function mapMedia(row: Row): MediaItem {
  const rawPlatform = row["platform"] ?? row["media_type"];
  const mediaType: MediaPlatform =
    rawPlatform === "reel" || rawPlatform === "podcast" || rawPlatform === "article"
      ? rawPlatform
      : "youtube";
  return {
    id: required(row["id"], ""),
    title: required(row["title"], "Untitled media"),
    description: text(row["description"]),
    url: required(row["url"], "#"),
    thumbnail_url: text(row["thumbnail_url"]),
    media_type: mediaType,
    show_on_home: row["show_on_homepage"] === true || row["show_on_home"] === true,
    display_order: number(row["display_order"]),
    status: status(row),
  };
}

export function mapFaq(row: Row): Faq {
  return {
    id: required(row["id"], ""),
    question: required(row["question"], "Question unavailable"),
    answer: required(row["answer"], "Answer unavailable"),
    category: text(row["category"]),
    display_order: number(row["display_order"]),
    status: status(row),
  };
}

export function mapReview(row: Row): Review {
  const doctor = row["doctor"];
  const doctorRow =
    doctor && typeof doctor === "object" && !Array.isArray(doctor) ? (doctor as Row) : null;
  const doctorName = doctorRow ? text(doctorRow["full_name"] ?? doctorRow["name"]) : null;
  const doctorSlug = doctorRow ? text(doctorRow["slug"]) : null;
  return {
    id: required(row["id"], ""),
    author_name: required(row["author_name"] ?? row["patient_name"], "Anonymous"),
    content: required(row["content"] ?? row["review"], ""),
    rating: number(row["rating"]),
    source: text(row["source"]),
    reviewed_at: text(row["reviewed_at"] ?? row["created_at"]),
    display_order: number(row["display_order"]),
    status: status(row),
    is_featured: row["is_featured"] === true || row["show_publicly"] === true,
    doctor: doctorName && doctorSlug ? { name: doctorName, slug: doctorSlug } : null,
  };
}
