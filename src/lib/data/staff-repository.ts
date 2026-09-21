import { supabase } from "@/integrations/supabase/client";
import { backendFeatures, productionPermissionFunctions, usesProductionContract } from "./backend";
import { classifyDataError, DataAccessError } from "./errors";
import type {
  AuditLog,
  DashboardCount,
  StaffDoctorOption,
  StaffEnquiry,
  StaffProfile,
} from "./models";
import { isRole, permissionsForRoles, type Permission, type Role } from "../permissions";

type Row = Record<string, unknown>;
type Result<T> = { data: T | null; error: unknown; count?: number | null };
type Query = PromiseLike<Result<Row[]>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): Query;
  eq(column: string, value: unknown): Query;
  in(column: string, values: readonly unknown[]): Query;
  order(column: string, options?: { ascending?: boolean }): Query;
  limit(count: number): Query;
  insert(values: Row | Row[]): Query;
  update(values: Row): Query;
  delete(): Query;
  maybeSingle(): PromiseLike<Result<Row>>;
};
type DataClient = {
  from(table: string): Query;
  rpc(name: string, args?: Record<string, unknown>): PromiseLike<Result<unknown>>;
};

const db = supabase as unknown as DataClient;

function getRows(result: Result<Row[]>): Row[] {
  if (result.error) throw classifyDataError(result.error);
  return result.data ?? [];
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function nested(value: unknown): Row | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Row) : null;
}

async function permissionRpc(name: string, args?: Record<string, unknown>): Promise<boolean> {
  const result = await db.rpc(name, args);
  if (result.error) throw classifyDataError(result.error);
  return result.data === true;
}

export type StaffAccess = {
  roles: Role[];
  permissions: Set<Permission>;
  isStaff: boolean;
  doctorRole: boolean;
};

export async function getStaffAccess(userId: string): Promise<StaffAccess> {
  const roleResult = await db.from("user_roles").select("role").eq("user_id", userId);
  const roles = getRows(roleResult)
    .map((row) => row["role"])
    .filter((value): value is Role => typeof value === "string" && isRole(value));

  if (!usesProductionContract) {
    return {
      roles,
      permissions: permissionsForRoles(roles),
      isStaff: roles.length > 0,
      doctorRole: roles.includes("doctor"),
    };
  }

  const [isStaff, canAdmin, canEditContent, doctorRole] = await Promise.all([
    permissionRpc(productionPermissionFunctions.isStaff),
    permissionRpc(productionPermissionFunctions.canAdmin),
    permissionRpc(productionPermissionFunctions.canEditContent),
    permissionRpc(productionPermissionFunctions.hasRole, { _user_id: userId, _role: "doctor" }),
  ]);

  const permissions = new Set<Permission>();
  if (isStaff) permissions.add("content.read");
  if (canEditContent) permissions.add("content.write");
  if (canAdmin) {
    permissions.add("content.publish");
    permissions.add("enquiries.manage");
    permissions.add("users.manage");
    permissions.add("audit.read");
  }
  if (doctorRole) {
    permissions.add("blog.review");
    permissions.add("profile.request");
  }
  return { roles, permissions, isStaff, doctorRole };
}

export async function getStaffProfile(userId: string): Promise<Omit<StaffProfile, "roles"> | null> {
  if (!backendFeatures.profiles) return null;
  const result = await db
    .from("profiles")
    .select("id, full_name, email, doctor_id, active")
    .eq("id", userId)
    .maybeSingle();
  if (result.error) throw classifyDataError(result.error);
  const row = result.data;
  if (!row) return null;
  return {
    id: String(row["id"]),
    fullName: text(row["full_name"]),
    email: text(row["email"]),
    doctorId: text(row["doctor_id"]),
    active: row["active"] !== false,
  };
}

export async function listStaffUsers(): Promise<StaffProfile[]> {
  const roleRows = getRows(await db.from("user_roles").select("user_id, role"));
  const rolesByUser = new Map<string, Role[]>();
  for (const row of roleRows) {
    const userId = text(row["user_id"]);
    const role = row["role"];
    if (!userId || typeof role !== "string" || !isRole(role)) continue;
    rolesByUser.set(userId, [...(rolesByUser.get(userId) ?? []), role]);
  }

  if (usesProductionContract) {
    return [...rolesByUser].map(([id, roles]) => ({
      id,
      fullName: null,
      email: null,
      doctorId: null,
      active: true,
      roles,
    }));
  }

  const profiles = getRows(
    await db.from("profiles").select("id, full_name, email, doctor_id, active").order("created_at"),
  );
  return profiles.map((row) => {
    const id = String(row["id"]);
    return {
      id,
      fullName: text(row["full_name"]),
      email: text(row["email"]),
      doctorId: text(row["doctor_id"]),
      active: row["active"] !== false,
      roles: rolesByUser.get(id) ?? [],
    };
  });
}

export async function listStaffDoctorOptions(): Promise<StaffDoctorOption[]> {
  const nameField = usesProductionContract ? "full_name" : "name";
  return getRows(await db.from("doctors").select(`id,${nameField}`).order(nameField)).map(
    (row) => ({
      id: String(row["id"]),
      name: String(row[nameField] ?? "Unnamed doctor"),
    }),
  );
}

export async function updateStaffUser(user: StaffProfile): Promise<void> {
  const existing = getRows(await db.from("user_roles").select("role").eq("user_id", user.id))
    .map((row) => row["role"])
    .filter((value): value is Role => typeof value === "string" && isRole(value));
  const toAdd = user.roles.filter((role) => !existing.includes(role));
  const toRemove = existing.filter((role) => !user.roles.includes(role));
  if (toRemove.length) {
    const result = await db.from("user_roles").delete().eq("user_id", user.id).in("role", toRemove);
    if (result.error) throw classifyDataError(result.error);
  }
  if (toAdd.length) {
    const result = await db
      .from("user_roles")
      .insert(toAdd.map((role) => ({ user_id: user.id, role })));
    if (result.error) throw classifyDataError(result.error);
  }
  if (!usesProductionContract) {
    const result = await db
      .from("profiles")
      .update({ doctor_id: user.doctorId || null })
      .eq("id", user.id);
    if (result.error) throw classifyDataError(result.error);
  }
}

export async function listStaffEnquiries(): Promise<StaffEnquiry[]> {
  const table = usesProductionContract ? "appointment_enquiries" : "enquiries";
  const selection = usesProductionContract
    ? "*, doctor:doctors!appointment_enquiries_preferred_doctor_id_fkey(full_name,whatsapp), department:departments!appointment_enquiries_preferred_department_id_fkey(name), service:services!appointment_enquiries_preferred_service_id_fkey(title)"
    : "*, doctor:doctors(name,whatsapp_number), department:departments(name), professional_service:professional_services(title), hospital_service:hospital_services(title)";
  return getRows(
    await db.from(table).select(selection).order("created_at", { ascending: false }),
  ).map((row) => {
    const doctor = nested(row["doctor"]);
    const department = nested(row["department"]);
    const service =
      nested(row["service"]) ??
      nested(row["professional_service"]) ??
      nested(row["hospital_service"]);
    return {
      id: String(row["id"]),
      createdAt: String(row["created_at"]),
      patientName: String(row["patient_name"]),
      contactNumber: String(row["contact_number"]),
      registeredContactNumber: text(row["registered_contact_number"]),
      familyMemberName: text(row["family_member_name"]),
      preferredAt: text(row["preferred_at"]),
      status: String(row["status"]),
      message: text(row["message"]),
      doctor: doctor
        ? {
            name: String(doctor["full_name"] ?? doctor["name"]),
            whatsappNumber: text(doctor["whatsapp"] ?? doctor["whatsapp_number"]),
          }
        : null,
      department: department ? { name: String(department["name"]) } : null,
      service: service ? { title: String(service["title"]) } : null,
    };
  });
}

export async function updateEnquiryStatus(id: string, status: string): Promise<void> {
  const table = usesProductionContract ? "appointment_enquiries" : "enquiries";
  const result = await db.from(table).update({ status }).eq("id", id);
  if (result.error) throw classifyDataError(result.error);
}

export async function listAuditLogs(): Promise<AuditLog[]> {
  return getRows(
    await db.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500),
  ).map((row) => ({
    id: String(row["id"]),
    actorEmail: text(row["actor_email"]),
    action: String(row["action"]),
    entityTable: text(row["entity_table"]),
    summary: text(row["summary"]),
    createdAt: String(row["created_at"]),
  }));
}

const localContentTables = [
  ["departments", "Departments"],
  ["doctors", "Doctors"],
  ["professional_services", "Professional services"],
  ["hospital_services", "Hospital services"],
  ["facilities", "Facilities"],
  ["media_items", "Media items"],
  ["faqs", "FAQs"],
  ["reviews", "Reviews"],
  ["blog_posts", "Blog posts"],
] as const;
const productionContentTables = [
  ["departments", "Departments"],
  ["doctors", "Doctors"],
  ["services", "Services"],
  ["facilities", "Facilities"],
  ["media_content", "Media items"],
  ["faqs", "FAQs"],
  ["reviews", "Reviews"],
] as const;

export async function getDashboardCounts(): Promise<DashboardCount[]> {
  const tables = usesProductionContract ? productionContentTables : localContentTables;
  return Promise.all(
    tables.map(async ([table, label]) => {
      const result = await db.from(table).select("id", { count: "exact", head: true });
      if (result.error) throw classifyDataError(result.error);
      return { label, count: result.count ?? 0 };
    }),
  );
}

export async function getActiveEnquiryCount(): Promise<number> {
  const table = usesProductionContract ? "appointment_enquiries" : "enquiries";
  const statuses = usesProductionContract
    ? ["new", "in_progress"]
    : ["submitted", "pending_forwarding"];
  const result = await db
    .from(table)
    .select("id", { count: "exact", head: true })
    .in("status", statuses);
  if (result.error) throw classifyDataError(result.error);
  return result.count ?? 0;
}

export function requireSupportedStaffFeature(
  feature: "blog" | "notifications" | "profileRequests",
): void {
  if (!backendFeatures[feature])
    throw new DataAccessError("unavailable", `${feature} is pending backend support.`);
}
