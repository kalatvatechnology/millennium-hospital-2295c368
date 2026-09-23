import type { DigitalCardData } from "./data";
import { hospitalName } from "./data";

const esc = (v: string) => v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

/** vCard 3.0 — the most widely compatible version (iOS, Android, Google and Apple Contacts). */
export function buildVCard(card: DigitalCardData, whatsappDigits?: string | null): string {
  const title = [card.designation, card.specialization].filter(Boolean).join(" · ");
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${esc(card.name)}`,
    `N:${esc(card.name)};;;;`,
    `ORG:${esc(hospitalName)}`,
    title ? `TITLE:${esc(title)}` : null,
    card.qualifications ? `NOTE:${esc(card.qualifications)}` : null,
    card.phone ? `TEL;TYPE=WORK,VOICE:${card.phone.tel}` : null,
    whatsappDigits && (!card.phone || card.phone.tel.replace(/\D/g, "") !== whatsappDigits)
      ? `TEL;TYPE=CELL:+${whatsappDigits}`
      : null,
    card.location
      ? `ADR;TYPE=WORK:;;${esc([card.location.name, card.location.address].filter(Boolean).join(", "))};;;;`
      : null,
    `URL:${card.actions.profile}`,
    "END:VCARD",
  ];
  return lines.filter(Boolean).join("\r\n") + "\r\n";
}

export function vcardFileName(card: DigitalCardData) {
  return `${card.slug || "doctor"}.vcf`;
}

export function whatsappDigitsFromUrl(url: string | null) {
  return url?.match(/wa\.me\/(\d+)/)?.[1] ?? null;
}

export function downloadVCard(card: DigitalCardData) {
  const blob = new Blob([buildVCard(card, whatsappDigitsFromUrl(card.actions.whatsapp))], {
    type: "text/vcard;charset=utf-8",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = vcardFileName(card);
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
