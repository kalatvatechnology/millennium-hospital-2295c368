import { siteConfig } from "@/config/site";
import { groupSchedule } from "@/lib/schedule-groups";
import { resolveEnquiryWhatsappTarget, whatsappUrl } from "@/lib/whatsapp";
import { validGoogleReviewUrl } from "@/lib/review-url";
import type { Doctor, DoctorLocation, DoctorSpecialization, Service } from "@/lib/data/models";

/** Everything the Digital Doctor Card shows. Built on demand from current doctor data — never stored. */
export type DigitalCardData = {
  name: string;
  slug: string;
  qualifications: string | null;
  designation: string | null;
  specialization: string | null;
  photoUrl: string | null;
  photoAlt: string;
  services: string[];
  hasMoreServices: boolean;
  location: { name: string; address: string | null; hours: string[] } | null;
  phone: { tel: string; display: string } | null;
  actions: {
    saveContact: string;
    book: string;
    whatsapp: string | null;
    call: string | null;
    reviews: string | null;
    directions: string | null;
    profile: string;
  };
};

type DoctorResult = {
  doctor: Doctor;
  services: Service[];
  serviceItems: { serviceId: string; id: string; title: string }[];
  specializations: DoctorSpecialization[];
  locations: DoctorLocation[];
};

const MAX_SERVICES = 5;

function addressOf(l: DoctorLocation) {
  const parts = [l.address_line, l.city].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function phoneOf(doctor: Doctor, location: DoctorLocation | undefined) {
  const own = (doctor.phone_number ?? "").replace(/[^\d]/g, "");
  if (own) {
    const code = (doctor.phone_country_code ?? "").replace(/[^\d]/g, "");
    const full = code && !own.startsWith(code) ? `+${code}${own}` : code ? `+${own}` : own;
    const display = code ? `+${code} ${own.startsWith(code) ? own.slice(code.length) : own}` : own;
    return { tel: full, display };
  }
  const fallback = location?.phone?.trim();
  if (fallback) return { tel: fallback.replace(/[^+\d]/g, ""), display: fallback };
  return null;
}

export function buildDigitalCardData(result: DoctorResult, origin: string): DigitalCardData {
  const { doctor } = result;
  const profile = `${origin}/doctors/${doctor.slug}`;
  const location = result.locations[0];
  const phone = phoneOf(doctor, location);

  // Individual services first (most specific), in the doctor's saved order; main services as fallback.
  const individual = Array.from(new Set(result.serviceItems.map((i) => i.title.trim()).filter(Boolean)));
  const pool = individual.length ? individual : result.services.map((s) => s.title);
  const services = pool.slice(0, MAX_SERVICES);

  let hours: string[] = [];
  if (location) {
    const groups = groupSchedule(location.consultation_schedule)?.filter((g) => !g.closed);
    if (groups?.length) hours = groups.slice(0, 3).map((g) => `${g.days}  ${g.value}`);
    else if (location.consultation_availability?.trim())
      hours = location.consultation_availability.split("|").map((s) => s.trim()).filter(Boolean).slice(0, 3);
  }

  const wa = resolveEnquiryWhatsappTarget("digital_card", doctor);
  const qualifications = doctor.qualifications.filter(Boolean).join(", ") || null;
  const specialization = result.specializations[0]?.title ?? doctor.specialty?.split(",")[0]?.trim() ?? null;

  return {
    name: doctor.name,
    slug: doctor.slug,
    qualifications,
    designation: doctor.designation?.trim() || null,
    specialization: specialization || null,
    photoUrl: doctor.photo_url,
    photoAlt: doctor.profile_image_alt?.trim() || `Portrait of ${doctor.name}`,
    services,
    hasMoreServices: pool.length > MAX_SERVICES,
    location: location
      ? { name: location.public_name || location.name, address: addressOf(location), hours }
      : null,
    phone,
    actions: {
      saveContact: `${origin}/api/public/doctor-vcard?slug=${encodeURIComponent(doctor.slug)}`,
      book: `${profile}#request-appointment`,
      whatsapp: wa ? whatsappUrl(wa, `Hello, I would like to book an appointment with ${doctor.name}.`) : null,
      call: phone ? `tel:${phone.tel}` : null,
      // Doctor's own review link, else the main hospital location's; hidden when neither is stored.
      reviews:
        validGoogleReviewUrl(doctor.google_review_url) ??
        validGoogleReviewUrl(
          result.locations.find((l) => l.id === siteConfig.contact.primaryLocationId)?.google_review_url,
        ),
      directions: location?.map_url?.trim() || null,
      profile,
    },
  };
}

export const hospitalName = siteConfig.name;
