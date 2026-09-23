import { siteConfig } from "@/config/site";

/**
 * Enquiry sources that originate from a single doctor's own surface.
 * Everything else is a hospital-website enquiry and routes to the hospital number.
 */
const DOCTOR_ORIGIN_SOURCES = new Set(["doctor_profile", "digital_card"]);

export function isDoctorOriginSource(source: string | null | undefined): boolean {
  return !!source && DOCTOR_ORIGIN_SOURCES.has(source);
}

/** Combine a stored country code and number into WhatsApp digits, without duplicating the code. */
export function whatsappDigits(
  number: string | null | undefined,
  countryCode?: string | null,
): string | null {
  const digits = (number ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const code = (countryCode ?? "").replace(/\D/g, "");
  if (!code) return digits;
  if (digits.startsWith(code) && digits.length > code.length) return digits;
  return `${code}${digits}`;
}

/** Canonical hospital WhatsApp digits, or null when no verified number is configured. */
export function hospitalWhatsappDigits(): string | null {
  return whatsappDigits(siteConfig.contact.whatsapp);
}

/**
 * Resolve the WhatsApp target for an enquiry based on where it started.
 * Doctor-origin enquiries use the doctor's number and fall back to the hospital number.
 * Hospital-website enquiries always use the hospital number, even when a doctor is selected.
 */
export function resolveEnquiryWhatsappTarget(
  source: string | null | undefined,
  doctor: { whatsapp_number?: string | null; whatsapp_country_code?: string | null } | null,
): string | null {
  if (isDoctorOriginSource(source) && doctor) {
    const doctorTarget = whatsappDigits(doctor.whatsapp_number, doctor.whatsapp_country_code);
    if (doctorTarget) return doctorTarget;
  }
  return hospitalWhatsappDigits();
}

export function whatsappUrl(digits: string, text: string): string {
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
