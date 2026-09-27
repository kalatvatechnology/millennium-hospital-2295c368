import { supabase } from "@/integrations/supabase/client";

// Department images live in the shared doctor-profile-images bucket under "departments/".
const BUCKET = "doctor-profile-images";
const ENDPOINT = "/api/public/doctor-profile-image";
const FOLDER = "departments/";

function pathFromUrl(value: string): string | null {
  if (!value.includes(ENDPOINT)) return null;
  try {
    const parsed = new URL(value, "https://millennium.invalid");
    if (parsed.pathname !== ENDPOINT) return null;
    const path = parsed.searchParams.get("path");
    return path && path.startsWith(FOLDER) && !path.includes("..") ? path : null;
  } catch {
    return null;
  }
}

function collectPaths(value: unknown, out: Set<string>) {
  if (typeof value === "string") {
    const path = pathFromUrl(value);
    if (path) out.add(path);
  } else if (Array.isArray(value)) value.forEach((v) => collectPaths(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => collectPaths(v, out));
}

/** Department-owned storage paths referenced by this department (read BEFORE deleting it). */
export async function departmentOwnedImagePaths(departmentId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("departments")
    .select("card_image_url, page_draft, page_published")
    .eq("id", departmentId)
    .maybeSingle();
  if (error || !data) return [];
  const out = new Set<string>();
  collectPaths(data, out);
  return [...out];
}

/**
 * Runs only AFTER the department row is deleted. Removes files that no other record still
 * references. Any lookup failure keeps every file (never risk deleting a shared asset);
 * storage failures are logged only — the database is already consistent.
 */
export async function removeUnreferencedDepartmentImages(paths: string[]) {
  const candidates = [...new Set(paths.filter((p) => p.startsWith(FOLDER) && !p.includes("..")))];
  if (!candidates.length) return;
  const lookups = await Promise.all([
    supabase.from("departments").select("card_image_url, page_draft, page_published"),
    supabase.from("media_items").select("url, thumbnail_url"),
    supabase.from("department_specializations").select("default_icon_url"),
    supabase.from("blog_posts").select("cover_image_url, og_image_url"),
    supabase.from("doctors").select("photo_url, hero_image_url, hero_background_image_url, og_image_url"),
  ]);
  if (lookups.some((r) => r.error)) {
    console.error("Department image cleanup skipped: could not confirm files are unused", lookups.map((r) => r.error));
    return;
  }
  const referenced = new Set<string>();
  lookups.forEach((r) => collectPaths(r.data, referenced));
  const unused = candidates.filter((p) => !referenced.has(p));
  if (!unused.length) return;
  const { error } = await supabase.storage.from(BUCKET).remove(unused);
  if (error) console.error("Department image cleanup failed", { paths: unused, error });
}
