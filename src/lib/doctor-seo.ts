import { siteConfig } from "@/config/site";

/** Real doctor-profile values the SEO helpers may use. Nothing here is ever invented. */
export type DoctorSeoSource = {
  name?: string | null;
  slug?: string | null;
  designation?: string | null;
  specialty?: string | null;
  departmentName?: string | null;
  qualifications?: string[] | null;
  experienceYears?: number | null;
  shortIntroduction?: string | null;
  location?: string | null;
  photoUrl?: string | null;
  socialLinks?: Record<string, string> | null;
  areasOfCare?: string[] | null;
  departmentNames?: string[] | null;
  specializations?: string[] | null;
  bio?: string | null;
};

export const SEO_TITLE_RANGE = [50, 60] as const;
export const SEO_DESCRIPTION_RANGE = [140, 160] as const;

const clean = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/** Site-relative profile path from the saved slug. */
export function doctorProfilePath(slug?: string | null) {
  const value = clean(slug);
  return value ? `/doctors/${value}` : null;
}

/** Full profile URL on the configured public site domain (siteConfig.url). */
export function doctorProfileUrl(slug?: string | null) {
  const path = doctorProfilePath(slug);
  return path ? `${siteConfig.url}${path}` : null;
}

function focus(doctor: DoctorSeoSource) {
  return clean(doctor.specialty) || clean(doctor.departmentName);
}

/** e.g. "Dr. Name | Orthopaedics Consultant in Navi Mumbai" — only from stored fields. */
export function suggestDoctorSeoTitle(doctor: DoctorSeoSource) {
  const name = clean(doctor.name);
  if (!name) return "";
  const role = [focus(doctor), clean(doctor.designation)].filter(Boolean).join(" ");
  const place = clean(doctor.location);
  const tail = role ? `${role}${place ? ` in ${place}` : ` at ${siteConfig.name}`}` : siteConfig.name;
  return `${name} | ${tail}`;
}

export function suggestDoctorSeoDescription(doctor: DoctorSeoSource) {
  const name = clean(doctor.name);
  if (!name) return "";
  const role = clean(doctor.designation);
  const area = focus(doctor);
  const place = clean(doctor.location);
  const parts: string[] = [];
  let first = `Learn about ${name}`;
  if (role || area) first += `, ${role || "specialist"}${area ? ` in ${area}` : ""}`;
  first += ` at ${siteConfig.name}${place ? ` in ${place}` : ""}.`;
  parts.push(first);
  if (doctor.experienceYears && doctor.experienceYears > 0)
    parts.push(`${doctor.experienceYears}+ years of experience.`);
  const care = (doctor.areasOfCare ?? []).map(clean).filter(Boolean).slice(0, 3);
  if (care.length) parts.push(`Areas of care include ${care.join(", ")}.`);
  parts.push("Book an appointment or send an enquiry.");
  return parts.join(" ");
}

/**
 * Central department → Schema.org mapping. Only clear, valid matches are listed;
 * anything else falls back to the generic "Physician" medical-person type.
 * `specialty` is a schema.org MedicalSpecialty enumeration value.
 */
const SCHEMA_TYPE_RULES: { match: RegExp; type: string; specialty?: string }[] = [
  { match: /\bdent(al|ist|istry)\b|orthodont|implantolog/i, type: "Dentist", specialty: "Dentistry" },
];

export type DoctorSchemaType = { type: string; specialty: string | null; basis: string | null };

/** Detects the schema type from department names only (never the doctor's name). */
export function detectDoctorSchemaType(doctor: DoctorSeoSource): DoctorSchemaType {
  const departments = [doctor.departmentName, ...(doctor.departmentNames ?? [])].map(clean).filter(Boolean);
  for (const dept of departments) {
    const rule = SCHEMA_TYPE_RULES.find((r) => r.match.test(dept));
    if (rule) return { type: rule.type, specialty: rule.specialty ?? null, basis: dept };
  }
  return { type: "Physician", specialty: null, basis: null };
}

/** Makes site-relative image paths absolute on the public domain so crawlers can fetch them. */
export function absolutePublicUrl(value?: string | null) {
  const v = clean(value);
  if (!v) return null;
  if (/^https?:\/\//.test(v)) return v;
  if (v.startsWith("/")) return `${siteConfig.url}${v}`;
  return null;
}

/** Schema.org JSON-LD generated only from real saved profile fields; empty values are omitted. */
export function doctorStructuredData(doctor: DoctorSeoSource) {
  const url = doctorProfileUrl(doctor.slug);
  const detected = detectDoctorSchemaType(doctor);
  const sameAs = Object.values(doctor.socialLinks ?? {}).map(clean).filter((v) => /^https?:\/\//.test(v));
  const quals = (doctor.qualifications ?? []).map(clean).filter(Boolean);
  const knowsAbout = [...new Set((doctor.specializations ?? []).map(clean).filter(Boolean))];
  const departments = [...new Set([doctor.departmentName, ...(doctor.departmentNames ?? [])].map(clean).filter(Boolean))];
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": detected.type,
    name: clean(doctor.name) || undefined,
    url: url ?? undefined,
    image: absolutePublicUrl(doctor.photoUrl) ?? undefined,
    jobTitle: clean(doctor.designation) || undefined,
    medicalSpecialty: detected.specialty ?? undefined,
    knowsAbout: knowsAbout.length ? knowsAbout : undefined,
    description: clean(doctor.shortIntroduction) || clean(doctor.bio) || undefined,
    hasCredential: quals.length
      ? quals.map((name) => ({ "@type": "EducationalOccupationalCredential", name }))
      : undefined,
    address: clean(doctor.location) ? { "@type": "PostalAddress", addressLocality: clean(doctor.location) } : undefined,
    parentOrganization: {
      "@type": "Hospital",
      name: siteConfig.name,
      url: siteConfig.url,
      department: departments.length
        ? departments.map((name) => ({ "@type": "MedicalOrganization", name }))
        : undefined,
    },
    sameAs: sameAs.length ? sameAs : undefined,
  };
  return JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
}
