/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminError } from "@/components/admin/ui";
import { userFacingDataError } from "@/lib/data/errors";

const db = supabase as any;
type Section = { table: string; title: string; fields: { name: string; label: string; multiline?: boolean }[] };
const sections: Section[] = [
  { table: "doctor_statistics", title: "Statistics", fields: [{ name: "value", label: "Value" }, { name: "label", label: "Label" }] },
  { table: "doctor_specializations", title: "Specializations", fields: [{ name: "title", label: "Title" }, { name: "description", label: "Description", multiline: true }] },
  { table: "doctor_experience", title: "Experience", fields: [{ name: "position", label: "Position" }, { name: "organization", label: "Organization" }, { name: "start_year", label: "Start year" }, { name: "end_year", label: "End year" }, { name: "description", label: "Description", multiline: true }] },
  { table: "doctor_education", title: "Education", fields: [{ name: "qualification", label: "Qualification" }, { name: "institution", label: "Institution" }, { name: "year", label: "Year" }, { name: "description", label: "Description", multiline: true }] },
  { table: "doctor_achievements", title: "Achievements & memberships", fields: [{ name: "achievement_type", label: "Type" }, { name: "title", label: "Title" }, { name: "organization", label: "Organization" }, { name: "year", label: "Year" }] },
];

export function DoctorProfileSections({ doctorId }: { doctorId: string }) {
  return <div className="grid gap-8">{sections.map((section) => <SectionEditor key={section.table} doctorId={doctorId} section={section} />)}<RelationshipSummary doctorId={doctorId} /></div>;
}

function SectionEditor({ doctorId, section }: { doctorId: string; section: Section }) {
  const client = useQueryClient();
  const key = ["doctor-profile-section", section.table, doctorId];
  const query = useQuery({ queryKey: key, queryFn: async () => { const { data, error } = await db.from(section.table).select("*").eq("doctor_id", doctorId).order("display_order"); if (error) throw error; return data ?? []; } });
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const add = async () => {
    setError(null);
    const required = section.fields[0]?.name;
    if (!required || !draft[required]?.trim()) return setError(`${section.fields[0]?.label} is required.`);
    const payload: Record<string, any> = { doctor_id: doctorId, display_order: query.data?.length ?? 0 };
    section.fields.forEach((field) => { const value = draft[field.name]?.trim(); if (value) payload[field.name] = field.name.includes("year") ? Number(value) : value; });
    const { error: insertError } = await db.from(section.table).insert(payload);
    if (insertError) return setError(userFacingDataError(insertError));
    setDraft({}); void client.invalidateQueries({ queryKey: key });
  };
  const remove = async (id: string) => { const { error: deleteError } = await db.from(section.table).delete().eq("id", id); if (deleteError) setError(userFacingDataError(deleteError)); else void client.invalidateQueries({ queryKey: key }); };
  return <section className="rounded-lg border border-border p-4"><h3 className="font-semibold">{section.title}</h3><div className="mt-4 grid gap-3 sm:grid-cols-2">{section.fields.map((field) => <div key={field.name} className={field.multiline ? "sm:col-span-2" : ""}><Label htmlFor={`${section.table}-${field.name}`}>{field.label}</Label>{field.multiline ? <Textarea id={`${section.table}-${field.name}`} value={draft[field.name] ?? ""} onChange={(event) => setDraft((old) => ({ ...old, [field.name]: event.target.value }))} className="mt-1" /> : <Input id={`${section.table}-${field.name}`} value={draft[field.name] ?? ""} onChange={(event) => setDraft((old) => ({ ...old, [field.name]: event.target.value }))} className="mt-1" />}</div>)}</div><Button type="button" size="sm" variant="outline" className="mt-3" onClick={add}><Plus className="size-4" /> Add</Button><AdminError message={error} /><ul className="mt-4 grid gap-2">{query.data?.map((row: any) => <li key={row.id} className="flex items-center justify-between gap-3 rounded-md bg-secondary p-3 text-sm"><span>{row[section.fields[0].name]}</span><Button type="button" size="icon" variant="ghost" aria-label={`Remove ${row[section.fields[0].name]}`} onClick={() => remove(row.id)}><Trash2 className="size-4" /></Button></li>)}</ul></section>;
}

function RelationshipSummary({ doctorId }: { doctorId: string }) {
  const query = useQuery({ queryKey: ["doctor-profile-relations", doctorId], queryFn: async () => { const [locations, faqs, media, services] = await Promise.all([db.from("doctor_locations").select("location_id").eq("doctor_id", doctorId), db.from("doctor_faqs").select("faq_id").eq("doctor_id", doctorId), db.from("media_doctors").select("media_id").eq("doctor_id", doctorId), db.from("professional_service_doctors").select("professional_service_id").eq("doctor_id", doctorId)]); return { locations: locations.data?.length ?? 0, faqs: faqs.data?.length ?? 0, media: media.data?.length ?? 0, services: services.data?.length ?? 0 }; } });
  return <section className="rounded-lg border border-border p-4"><h3 className="font-semibold">Linked content</h3><p className="mt-2 text-sm text-muted-foreground">Relationships use the existing CMS records. Manage source records in their respective sections.</p><dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">{Object.entries(query.data ?? {}).map(([label, count]) => <div key={label} className="rounded-md bg-secondary p-3"><dt className="capitalize text-muted-foreground">{label}</dt><dd className="mt-1 text-xl font-semibold">{count}</dd></div>)}</dl></section>;
}