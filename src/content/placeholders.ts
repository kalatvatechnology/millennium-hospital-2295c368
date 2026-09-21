export type Doctor = {
  slug: string;
  photo: string | null;
  name: string;
  qualifications: string[];
  designation: string | null;
  specialty: string | null;
  department: string | null;
  experience: string | null;
  bio: string | null;
  expertise: string[];
  languages: string[];
  socialLinks: { label: string; url: string }[];
  serviceSlugs: string[];
  reviewIds: string[];
  media: { title: string; url: string }[];
};

export type Service = {
  slug: string;
  title: string;
  type: "professional" | "hospital";
  summary: string | null;
  description: string | null;
};

export type Facility = { slug: string; title: string; description: string | null; image: string | null };
export type Review = { id: string; quote: string; author: string | null; publishedAt: string | null };
export type Article = { slug: string; title: string; summary: string | null; body: string | null; publishedAt: string | null };
export type Faq = { id: string; question: string; answer: string };

export const doctors: Doctor[] = [];
export const services: Service[] = [];
export const facilities: Facility[] = [];
export const reviews: Review[] = [];
export const articles: Article[] = [];
export const faqs: Faq[] = [];

export const contentStatus = { doctors, services, facilities, reviews, articles, faqs };
