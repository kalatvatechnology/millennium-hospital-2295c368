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
  admin: "Manages content, enquiries and activity records.",
  editor: "Creates, edits and publishes website content.",
  writer: "Creates and edits content, but cannot publish it.",
  front_desk: "Handles appointment enquiries.",
  doctor: "Own dashboard, profile change requests and clinical review.",
};

export type Permission =
  | "content.read"
  | "content.write"
  | "content.publish"
  | "enquiries.manage"
  | "users.manage"
  | "audit.read"
  | "blog.review"
  | "profile.request";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  founder: [
    "content.read",
    "content.write",
    "content.publish",
    "enquiries.manage",
    "users.manage",
    "audit.read",
  ],
  co_founder: [
    "content.read",
    "content.write",
    "content.publish",
    "enquiries.manage",
    "users.manage",
    "audit.read",
  ],
  brand_super_admin: [
    "content.read",
    "content.write",
    "content.publish",
    "enquiries.manage",
    "users.manage",
    "audit.read",
  ],
  super_admin: [
    "content.read",
    "content.write",
    "content.publish",
    "enquiries.manage",
    "users.manage",
    "audit.read",
    "blog.review",
    "profile.request",
  ],
  admin: [
    "content.read",
    "content.write",
    "content.publish",
    "enquiries.manage",
    "audit.read",
    "blog.review",
  ],
  editor: ["content.read", "content.write", "content.publish"],
  writer: ["content.read", "content.write"],
  front_desk: ["content.read", "enquiries.manage"],
  doctor: ["blog.review", "profile.request"],
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
