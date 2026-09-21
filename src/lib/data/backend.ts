export type BackendTarget = "local" | "production";

const requestedTarget = import.meta.env["VITE_MILLENNIUM_BACKEND_TARGET"];

/**
 * Production is deliberately opt-in. This preparation must not connect to the
 * audited production project or replace the current preview environment.
 */
export const backendTarget: BackendTarget =
  requestedTarget === "production" ? "production" : "local";
export const usesProductionContract = backendTarget === "production";

export const productionTables = {
  doctors: "doctors",
  departments: "departments",
  services: "services",
  facilities: "facilities",
  faqs: "faqs",
  reviews: "reviews",
  media: "media_content",
  enquiries: "appointment_enquiries",
  userRoles: "user_roles",
  auditLogs: "audit_logs",
  doctorDepartments: "doctor_departments",
  doctorServices: "doctor_services",
  departmentServices: "department_services",
} as const;

export const productionStorageBuckets = {
  doctors: "doctor-images",
  departments: "department-images",
  services: "service-images",
  facilities: "facility-images",
  media: "media-thumbnails",
  site: "site-assets",
} as const;

export const backendFeatures = {
  blog: !usesProductionContract,
  clinicalReview: !usesProductionContract,
  faqCategories: !usesProductionContract,
  profiles: !usesProductionContract,
  enquiryForwardings: !usesProductionContract,
  notifications: !usesProductionContract,
  websitePages: !usesProductionContract,
  navigation: !usesProductionContract,
  profileRequests: !usesProductionContract,
  userManagement: true,
} as const;

export const productionPermissionFunctions = {
  canAdmin: "can_admin",
  isStaff: "is_staff",
  canEditContent: "can_edit_content",
  hasRole: "has_role",
  hasAnyRole: "has_any_role",
  roleRank: "role_rank",
  actorMaxRank: "actor_max_rank",
} as const;

export const CONTENT_STATUSES = ["draft", "published", "archived"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const ENQUIRY_STATUSES = [
  "new",
  "in_progress",
  "forwarded_whatsapp",
  "contacted",
  "closed",
  "spam",
] as const;
export type ProductionEnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export function isPublished(row: Record<string, unknown>): boolean {
  return usesProductionContract ? row["status"] === "published" : row["published"] === true;
}
