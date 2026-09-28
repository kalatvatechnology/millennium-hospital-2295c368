/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { hasPageContent, parseDepartmentPage } from "@/lib/department-page";

const db = supabase as any;

export type MediaAssociations = {
  departments: string[];
  doctors: string[];
  professional: string[];
  hospital: string[];
};
export const emptyAssociations = (): MediaAssociations => ({ departments: [], doctors: [], professional: [], hospital: [] });

type Option = { id: string; label: string };

function draftPage(row: any) {
  const source = hasPageContent(row.page_draft) ? row.page_draft : row.page_published;
  return parseDepartmentPage(source ?? {});
}

async function loadOptions() {
  const [departments, doctors, professional, hospital] = await Promise.all([
    db.from("departments").select("id,name,page_draft,page_published").order("name"),
    db.from("doctors").select("id,name").order("name"),
    db.from("professional_services").select("id,title").order("title"),
    db.from("hospital_services").select("id,title").order("title"),
  ]);
  for (const r of [departments, doctors, professional, hospital]) if (r.error) throw r.error;
  return {
    departmentRows: departments.data as any[],
    departments: (departments.data as any[]).map((r) => ({ id: r.id, label: r.name })) as Option[],
    doctors: (doctors.data as any[]).map((r) => ({ id: r.id, label: r.name })) as Option[],
    professional: (professional.data as any[]).map((r) => ({ id: r.id, label: r.title })) as Option[],
    hospital: (hospital.data as any[]).map((r) => ({ id: r.id, label: r.title })) as Option[],
  };
}

async function loadCurrent(mediaId: string): Promise<MediaAssociations> {
  const [departments, doctors, professional, hospital] = await Promise.all([
    db.from("departments").select("id,page_draft,page_published"),
    db.from("media_doctors").select("doctor_id").eq("media_id", mediaId).eq("usage", "gallery"),
    db.from("media_professional_services").select("professional_service_id").eq("media_id", mediaId),
    db.from("media_hospital_services").select("hospital_service_id").eq("media_id", mediaId),
  ]);
  for (const r of [departments, doctors, professional, hospital]) if (r.error) throw r.error;
  return {
    departments: (departments.data as any[])
      .filter((row) => (draftPage(row).links?.media ?? []).includes(mediaId))
      .map((r) => r.id),
    doctors: (doctors.data as any[]).map((r) => r.doctor_id),
    professional: (professional.data as any[]).map((r) => r.professional_service_id),
    hospital: (hospital.data as any[]).map((r) => r.hospital_service_id),
  };
}

/**
 * Applies association changes for one central media record. Departments are staged in the
 * department draft (live only after that department is published); the others use their
 * existing relationship tables. Never creates or copies media records.
 */
export async function applyMediaAssociations(mediaId: string, before: MediaAssociations, next: MediaAssociations) {
  const diff = (a: string[], b: string[]) => a.filter((x) => !b.includes(x));
  const deptChanged = [...diff(next.departments, before.departments), ...diff(before.departments, next.departments)];
  if (deptChanged.length) {
    const { data, error } = await db.from("departments").select("id,page_draft,page_published").in("id", deptChanged);
    if (error) throw error;
    for (const row of data as any[]) {
      const page = draftPage(row);
      const links = page.links ?? { doctors: [], faqs: [], media: [] };
      const media = next.departments.includes(row.id)
        ? links.media.includes(mediaId) ? links.media : [...links.media, mediaId]
        : links.media.filter((id: string) => id !== mediaId);
      const { error: e } = await db
        .from("departments")
        .update({ page_draft: { ...page, links: { ...links, media } }, page_draft_saved_at: new Date().toISOString() })
        .eq("id", row.id);
      if (e) throw e;
    }
  }
  const tables = [
    { key: "doctors", table: "media_doctors", col: "doctor_id" },
    { key: "professional", table: "media_professional_services", col: "professional_service_id" },
    { key: "hospital", table: "media_hospital_services", col: "hospital_service_id" },
  ] as const;
  for (const t of tables) {
    const add = diff(next[t.key], before[t.key]);
    const remove = diff(before[t.key], next[t.key]);
    if (add.length) {
      const { error } = await db.from(t.table).insert(add.map((id) => ({ media_id: mediaId, [t.col]: id })));
      if (error) throw error;
    }
    if (remove.length) {
      let del = db.from(t.table).delete().eq("media_id", mediaId).in(t.col, remove);
      // Doctor image roles (profile/hero/OG) are managed in the Doctor Workspace, not here.
      if (t.table === "media_doctors") del = del.eq("usage", "gallery");
      const { error } = await del;
      if (error) throw error;
    }
  }
}

export function MediaAssociationPicker({
  mediaId,
  value,
  onChange,
  onLoaded,
  presetDepartment,
}: {
  mediaId: string | null;
  value: MediaAssociations;
  onChange: (v: MediaAssociations) => void;
  /** Reports the saved associations so the caller can diff on save. */
  onLoaded: (v: MediaAssociations) => void;
  presetDepartment?: string | undefined;
}) {
  const options = useQuery({ queryKey: ["media-association-options"], queryFn: loadOptions });
  const current = useQuery({
    queryKey: ["media-associations", mediaId],
    enabled: Boolean(mediaId),
    queryFn: () => loadCurrent(mediaId!),
  });
  useEffect(() => {
    if (mediaId && current.data) {
      onLoaded(current.data);
      onChange(structuredClone(current.data));
    } else if (!mediaId) {
      const initial = emptyAssociations();
      onLoaded(initial);
      onChange({ ...initial, departments: presetDepartment ? [presetDepartment] : [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId, current.data, presetDepartment]);
  if (options.isPending || (mediaId && current.isPending))
    return <p className="text-sm text-muted-foreground">Loading associations…</p>;
  if (options.isError || current.isError)
    return <p className="text-sm text-destructive">Associations could not be loaded.</p>;
  const groups: { key: keyof MediaAssociations; label: string; hint?: string }[] = [
    { key: "departments", label: "Departments", hint: "Added to the department draft. Shown on the department page after it is published." },
    { key: "doctors", label: "Doctors" },
    { key: "professional", label: "Professional services" },
    { key: "hospital", label: "Hospital services" },
  ];
  const none = Object.values(value).every((list) => list.length === 0);
  return (
    <div className="grid gap-5 lg:col-span-2">
      <p className="text-sm text-muted-foreground">
        {none
          ? "Hospital-wide: this media is in the central library only and is not linked to any page."
          : "Linked to the pages selected below. The same media record is used everywhere; nothing is copied."}
      </p>
      {groups.map((g) => {
        const list = options.data![g.key] as Option[];
        return (
          <fieldset key={g.key} className="border border-border p-4">
            <legend className="px-1 text-sm font-semibold">{g.label}</legend>
            {g.hint ? <p className="mb-3 text-xs text-muted-foreground">{g.hint}</p> : null}
            {list.length ? (
              <div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">
                {list.map((o) => (
                  <label key={o.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={value[g.key].includes(o.id)}
                      onCheckedChange={(c) =>
                        onChange({
                          ...value,
                          [g.key]: c === true ? [...value[g.key], o.id] : value[g.key].filter((x) => x !== o.id),
                        })
                      }
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">None available.</p>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}
