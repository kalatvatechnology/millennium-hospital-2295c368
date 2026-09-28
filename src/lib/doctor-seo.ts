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

/** schema.org Physician built only from real profile fields; empty values are omitted. */
export function doctorStructuredData(doctor: DoctorSeoSource) {
  const url = doctorProfileUrl(doctor.slug);
  const sameAs = Object.values(doctor.socialLinks ?? {}).map(clean).filter((v) => /^https?:\/\//.test(v));
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: clean(doctor.name) || undefined,
    url: url ?? undefined,
    image: clean(doctor.photoUrl) || undefined,
    jobTitle: clean(doctor.designation) || undefined,
    medicalSpecialty: focus(doctor) || undefined,
    description: clean(doctor.shortIntroduction) || undefined,
    hasCredential: (doctor.qualifications ?? []).map(clean).filter(Boolean).length
      ? (doctor.qualifications ?? []).map(clean).filter(Boolean).map((name) => ({
          "@type": "EducationalOccupationalCredential",
          name,
        }))
      : undefined,
    worksFor: { "@type": "Hospital", name: siteConfig.name, url: siteConfig.url },
    sameAs: sameAs.length ? sameAs : undefined,
  };
  return JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
}
