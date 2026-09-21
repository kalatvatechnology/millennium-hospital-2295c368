import type { ContentStatus } from "./backend";
import type { Role } from "../permissions";

export type Department = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number | null;
  status: ContentStatus;
};

export type Doctor = {
  id: string;
  name: string;
  slug: string;
  photo_url: string | null;
  qualifications: string[];
  designation: string | null;
  specialty: string | null;
  experience_years: number | null;
  bio: string | null;
  expertise: string[];
  languages: string[];
  location: string | null;
  whatsapp_number: string | null;
  consultation_info: string | null;
  location_info: string | null;
  social_links: Record<string, string>;
  display_order: number | null;
  status: ContentStatus;
  department: Pick<Department, "id" | "name" | "slug"> | null;
};

export type Service = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  display_order: number | null;
  status: ContentStatus;
};

export type Facility = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  images: string[];
  display_order: number | null;
  status: ContentStatus;
};

export type MediaPlatform = "reel" | "youtube" | "podcast" | "article";
export type MediaItem = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnail_url: string | null;
  media_type: MediaPlatform;
  show_on_home: boolean;
  display_order: number | null;
  status: ContentStatus;
};

export type Faq = { id: string; question: string; answer: string; category: string | null; display_order: number | null; status: ContentStatus };
export type FaqCategory = { id: string; name: string; slug: string };

export type Review = {
  id: string;
  author_name: string;
  content: string;
  rating: number | null;
  source: string | null;
  reviewed_at: string | null;
  display_order: number | null;
  status: ContentStatus;
  is_featured: boolean;
  doctor?: { name: string; slug: string } | null;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  category?: { name: string; slug: string } | null;
  author?: { name: string; slug: string } | null;
  reviewer?: { name: string; slug: string } | null;
};

export type EnquiryOption = { id: string; name: string; slug?: string; whatsapp_number?: string | null };

export type StaffProfile = {
  id: string;
  fullName: string | null;
  email: string | null;
  doctorId: string | null;
  active: boolean;
  roles: Role[];
};

export type StaffDoctorOption = { id: string; name: string };

export type StaffEnquiry = {
  id: string;
  createdAt: string;
  patientName: string;
  contactNumber: string;
  registeredContactNumber: string | null;
  familyMemberName: string | null;
  preferredAt: string | null;
  status: string;
  message: string | null;
  doctor: { name: string; whatsappNumber: string | null } | null;
  department: { name: string } | null;
  service: { title: string } | null;
};

export type AuditLog = {
  id: string;
  actorEmail: string | null;
  action: string;
  entityTable: string | null;
  summary: string | null;
  createdAt: string;
};

export type DashboardCount = { label: string; count: number };
