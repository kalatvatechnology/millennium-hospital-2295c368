export const ROLES = [
  "founder",
  "co_founder",
  "brand_super_admin",
  "super_admin",
  "admin",
  "editor",
  "writer",
  "front_desk",
  "doctor",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  founder: "Founder",
  co_founder: "Co-founder",
  brand_super_admin: "Brand super admin",
  super_admin: "Super admin",
  admin: "Admin",
  editor: "Editor",
  writer: "Writer",
  front_desk: "Front desk",
  doctor: "Doctor",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  founder: "Production role governed by the hospital role hierarchy.",
  co_founder: "Production role governed by the hospital role hierarchy.",
  brand_super_admin: "Production role governed by the hospital role hierarchy.",
  super_admin: "Full control, including staff accounts and roles.",
  admin: "Receives only the responsibilities delegated by a super admin.",
  editor: "Creates, edits and publishes website content.",
  writer: "Creates and edits content, but cannot publish it.",
  front_desk: "Handles appointment enquiries.",
  doctor: "Own dashboard, profile change requests and clinical review.",
};

export type Permission =
  | "content.read"
  | "content.write"
  | "content.publish"
  | "locations.manage"
  | "enquiries.manage"
  | "users.manage"
  | "audit.read"
  | "blog.review"
  | "profile.request"
  | "seo.read"
  | "seo.manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  founder: [
    "content.read",
    "content.write",
    "content.publish",
    "enquiries.manage",
    "users.manage",
    "audit.read",
    "seo.read",
    "seo.manage",
  ],
  co_founder: [
    "content.read",
    "content.write",
    "content.publish",
    "enquiries.manage",
    "users.manage",
    "audit.read",
    "seo.read",
    "seo.manage",
  ],
  brand_super_admin: [
    "content.read",
    "content.write",
    "content.publish",
    "enquiries.manage",
    "users.manage",
    "audit.read",
    "seo.read",
    "seo.manage",
  ],
  super_admin: [
    "content.read",
    "content.write",
    "content.publish",
    "locations.manage",
    "enquiries.manage",
    "users.manage",
    "audit.read",
    "blog.review",
    "profile.request",
    "seo.read",
    "seo.manage",
  ],
  admin: [
    "content.read",
    "content.write",
    "content.publish",
    "locations.manage",
    "enquiries.manage",
    "audit.read",
    "blog.review",
    "seo.read",
    "seo.manage",
  ],
  editor: ["content.read", "content.write", "content.publish", "seo.read", "seo.manage"],
  writer: ["content.read", "content.write", "seo.read"],
  front_desk: ["content.read", "enquiries.manage"],
  doctor: ["blog.review", "profile.request", "seo.read"],
};


export function permissionsForRoles(roles: Role[]): Set<Permission> {
  const result = new Set<Permission>();
  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role] ?? []) result.add(permission);
  }
  return result;
}

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
