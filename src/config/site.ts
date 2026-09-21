export const siteConfig = {
  name: "The Millennium Hospital",
  shortName: "TMH",
  tagline: "Thoughtful care, built around people.",
  description: "The official website of The Millennium Hospital.",
  contact: {
    phone: null as string | null,
    email: null as string | null,
    whatsapp: null as string | null,
    address: null as string | null,
    mapUrl: null as string | null,
    openingHours: null as string | null,
  },
  social: {
    facebook: null as string | null,
    instagram: null as string | null,
    linkedin: null as string | null,
  },
} as const;

export const primaryNavigation = [
  { label: "About", to: "/about" },
  { label: "Doctors", to: "/doctors" },
  { label: "Services", to: "/services" },
  { label: "Facilities", to: "/facilities" },
  { label: "Resources", to: "/blog" },
] as const;
