/** Stored keys are stable (database check constraint); only names and artwork changed. */
export const DIGITAL_CARD_THEMES = [
  { key: "millennium_signature", name: "Millennium Signature", description: "Official Millennium identity with elegant medical curves." },
  { key: "clinical_elegance", name: "Radiant Care", description: "Warm organic forms with a welcoming premium feel." },
  { key: "modern_executive", name: "Executive Focus", description: "Bold architectural design for a sophisticated professional identity." },
  { key: "premium_medical", name: "Oral Health Plus", description: "Fresh healthcare artwork inspired by clean smiles and wellness." },
  { key: "minimal_luxe", name: "Minimal Luxe", description: "Editorial minimalism with premium photography and typography." },
] as const;

export type DigitalCardTheme = (typeof DIGITAL_CARD_THEMES)[number]["key"];
export const DEFAULT_DIGITAL_CARD_THEME: DigitalCardTheme = "millennium_signature";

export function toTheme(value: unknown): DigitalCardTheme {
  return DIGITAL_CARD_THEMES.some((t) => t.key === value)
    ? (value as DigitalCardTheme)
    : DEFAULT_DIGITAL_CARD_THEME;
}

/** Brand values (primary #2E3D76, accent #CD273B) mirrored for the PDF, which cannot read CSS tokens. */
export const BRAND = {
  navy: [46, 61, 118] as const,
  navyDeep: [27, 36, 74] as const,
  red: [205, 39, 59] as const,
  white: [255, 255, 255] as const,
  ink: [28, 32, 48] as const,
  muted: [98, 106, 128] as const,
  soft: [240, 242, 249] as const,
  line: [222, 226, 238] as const,
};
type RGB = readonly [number, number, number];

export type PdfTheme = {
  header: "band" | "none" | "block" | "full" | "photo";
  pageBg: RGB;
  headerBg: RGB;
  onHeader: RGB;
  text: RGB;
  muted: RGB;
  accent: RGB;
  chipBg: RGB;
  chipText: RGB;
  photo: "circle" | "rounded" | "square" | "large";
  primaryBtn: RGB;
  secondaryBtn: RGB;
  secondaryText: RGB;
  secondaryOutline: boolean;
  logoOnDark: boolean;
};

export const PDF_THEMES: Record<DigitalCardTheme, PdfTheme> = {
  millennium_signature: {
    header: "band", pageBg: BRAND.white, headerBg: BRAND.navy, onHeader: BRAND.white,
    text: BRAND.ink, muted: BRAND.muted, accent: BRAND.red, chipBg: BRAND.soft, chipText: BRAND.navy,
    photo: "circle", primaryBtn: BRAND.navy, secondaryBtn: BRAND.soft, secondaryText: BRAND.navy,
    secondaryOutline: false, logoOnDark: false,
  },
  clinical_elegance: {
    header: "none", pageBg: BRAND.white, headerBg: BRAND.white, onHeader: BRAND.navy,
    text: BRAND.ink, muted: BRAND.muted, accent: BRAND.red, chipBg: BRAND.white, chipText: BRAND.navy,
    photo: "rounded", primaryBtn: BRAND.navy, secondaryBtn: BRAND.white, secondaryText: BRAND.navy,
    secondaryOutline: true, logoOnDark: false,
  },
  modern_executive: {
    header: "block", pageBg: BRAND.soft, headerBg: BRAND.navy, onHeader: BRAND.white,
    text: BRAND.ink, muted: BRAND.muted, accent: BRAND.red, chipBg: BRAND.white, chipText: BRAND.navy,
    photo: "square", primaryBtn: BRAND.red, secondaryBtn: BRAND.white, secondaryText: BRAND.navy,
    secondaryOutline: false, logoOnDark: false,
  },
  premium_medical: {
    header: "full", pageBg: BRAND.navyDeep, headerBg: BRAND.navyDeep, onHeader: BRAND.white,
    text: BRAND.white, muted: [196, 202, 224], accent: BRAND.red, chipBg: [52, 64, 110], chipText: BRAND.white,
    photo: "circle", primaryBtn: BRAND.red, secondaryBtn: [52, 64, 110], secondaryText: BRAND.white,
    secondaryOutline: false, logoOnDark: true,
  },
  minimal_luxe: {
    header: "photo", pageBg: BRAND.white, headerBg: BRAND.soft, onHeader: BRAND.navy,
    text: BRAND.ink, muted: BRAND.muted, accent: BRAND.red, chipBg: BRAND.white, chipText: BRAND.ink,
    photo: "large", primaryBtn: BRAND.ink, secondaryBtn: BRAND.white, secondaryText: BRAND.ink,
    secondaryOutline: true, logoOnDark: false,
  },
};
