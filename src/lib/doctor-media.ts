/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

/**
 * Doctor image roles. Each role is an explicit media_doctors connection
 * (usage = role) to one central Media & Content asset. The doctors.* URL column
 * is a rendered copy kept in step by database triggers.
 */
export const DOCTOR_MEDIA_ROLES = [
  { usage: "profile_image", column: "photo_url", altColumn: "profile_image_alt", label: "Profile image" },
  { usage: "hero_image", column: "hero_image_url", altColumn: "hero_image_alt", label: "Hero image" },
  {
    usage: "hero_background_image",
    column: "hero_background_image_url",
    altColumn: "hero_background_image_alt",
    label: "Hero background image",
  },
  { usage: "og_image", column: "og_image_url", altColumn: null, label: "Open Graph / Social Sharing" },
] as const;

export type DoctorMediaUsage = (typeof DOCTOR_MEDIA_ROLES)[number]["usage"] | "gallery";

export const doctorUsageLabel = (usage: string) =>
  DOCTOR_MEDIA_ROLES.find((r) => r.usage === usage)?.label ?? "Profile media";

/** The image a media asset shows: uploaded image (thumbnail) first, then its URL. */
export const mediaImageSrc = (item: { thumbnail_url?: string | null; url?: string | null }) =>
  item.thumbnail_url || item.url || "";

/**
 * Makes the doctor's role connections match the chosen image URLs. A URL not yet in
 * Media & Content (a fresh upload) becomes one central asset first; replacing or removing
 * only changes the connection — the asset itself is never deleted here.
 */
export async function syncDoctorMediaRoles(doctorId: string, doctorName: string, values: Record<string, any>) {
  const { data: current, error } = await db
    .from("media_doctors")
    .select("media_id,usage,media_items(id,url,thumbnail_url)")
    .eq("doctor_id", doctorId)
    .neq("usage", "gallery");
  if (error) throw error;
  for (const role of DOCTOR_MEDIA_ROLES) {
    const src = String(values[role.column] ?? "").trim();
    const existing = (current ?? []).find((row: any) => row.usage === role.usage);
    if (existing && src && mediaImageSrc(existing.media_items ?? {}) === src) continue;
    if (!existing && !src) continue;
    if (existing) {
      const { error: e } = await db
        .from("media_doctors")
        .delete()
        .eq("doctor_id", doctorId)
        .eq("usage", role.usage);
      if (e) throw e;
    }
    if (!src) continue;
    const { data: found, error: findError } = await db
      .from("media_items")
      .select("id")
      .or(`thumbnail_url.eq."${src}",url.eq."${src}"`)
      .order("created_at")
      .limit(1);
    if (findError) throw findError;
    let mediaId = found?.[0]?.id as string | undefined;
    if (!mediaId) {
      const alt = role.altColumn ? String(values[role.altColumn] ?? "").trim() : "";
      const { data: created, error: createError } = await db
        .from("media_items")
        .insert({
          title: `${doctorName || "Doctor"} — ${role.label}`,
          media_type: "image",
          url: src,
          thumbnail_url: src,
          alt_text: alt || null,
          published: true,
          show_on_home: false,
        })
        .select("id")
        .single();
      if (createError) throw createError;
      mediaId = created.id as string;
    }
    const { error: linkError } = await db.from("media_doctors").insert({
      media_id: mediaId,
      doctor_id: doctorId,
      usage: role.usage,
      enabled: true,
      show_on_profile: false,
      display_order: 0,
    });
    if (linkError) throw linkError;
  }
}

/** Public URLs referenced by any Media & Content asset (never removed from storage on replace). */
export async function mediaReferencedUrls(urls: string[]) {
  if (!urls.length) return new Set<string>();
  const [a, b] = await Promise.all([
    db.from("media_items").select("url").in("url", urls),
    db.from("media_items").select("thumbnail_url").in("thumbnail_url", urls),
  ]);
  if (a.error) throw a.error;
  if (b.error) throw b.error;
  return new Set<string>([
    ...(a.data ?? []).map((r: any) => r.url),
    ...(b.data ?? []).map((r: any) => r.thumbnail_url),
  ]);
}

export type DoctorMediaUse = { doctor: string; usage: string; label: string };

/** Where a media asset is used by doctors, in staff-readable form. */
export async function loadDoctorMediaUses(mediaId: string): Promise<DoctorMediaUse[]> {
  const { data, error } = await db
    .from("media_doctors")
    .select("usage,doctors(name)")
    .eq("media_id", mediaId);
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    doctor: row.doctors?.name ?? "Doctor",
    usage: row.usage,
    label: doctorUsageLabel(row.usage),
  }));
}
