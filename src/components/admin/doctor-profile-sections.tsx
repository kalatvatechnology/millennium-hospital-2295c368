/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  return <div className="grid gap-8"><VisibilityEditor doctorId={doctorId} />{sections.map((section) => <SectionEditor key={section.table} doctorId={doctorId} section={section} />)}<RelationshipEditor doctorId={doctorId} /></div>;
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

const visibilityLabels: Record<string, string> = { statistics: "Statistics", quote: "Quote", specializations: "Specializations", services: "Professional services", experience: "Experience", education: "Education", achievements: "Achievements & memberships", locations: "Locations", media: "Media", reviews: "Reviews", faqs: "FAQs" };

function VisibilityEditor({ doctorId }: { doctorId: string }) {
  const client = useQueryClient();
  const key = ["doctor-profile-visibility", doctorId];
  const query = useQuery({ queryKey: key, queryFn: async () => { const { data, error } = await db.from("doctors").select("section_visibility").eq("id", doctorId).single(); if (error) throw error; return (data?.section_visibility ?? {}) as Record<string, boolean>; } });
  const update = async (name: string, checked: boolean) => { const next = { ...query.data, [name]: checked }; const { error } = await db.from("doctors").update({ section_visibility: next }).eq("id", doctorId); if (!error) client.setQueryData(key, next); };
  return <section className="rounded-lg border border-border p-4"><h3 className="font-semibold">Section visibility</h3><p className="mt-2 text-sm text-muted-foreground">A section still stays hidden when it has no published content.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{Object.entries(visibilityLabels).map(([name, label]) => <label key={name} className="flex items-center gap-3 rounded-md bg-secondary p-3 text-sm font-medium"><Checkbox checked={query.data?.[name] !== false} onCheckedChange={(value) => update(name, value === true)} />{label}</label>)}</div></section>;
}

const relationships = [
  { key: "locations", source: "locations", link: "doctor_locations", sourceId: "location_id", label: "Locations", text: "name" },
  { key: "faqs", source: "faqs", link: "doctor_faqs", sourceId: "faq_id", label: "FAQs", text: "question" },
  { key: "media", source: "media_items", link: "media_doctors", sourceId: "media_id", label: "Media", text: "title" },
  { key: "services", source: "professional_services", link: "professional_service_doctors", sourceId: "professional_service_id", label: "Professional services", text: "title" },
] as const;

function RelationshipEditor({ doctorId }: { doctorId: string }) {
  return <section className="rounded-lg border border-border p-4"><h3 className="font-semibold">Linked content</h3><p className="mt-2 text-sm text-muted-foreground">Select existing CMS records to show on this doctor profile. Unpublished records remain hidden publicly.</p><div className="mt-5 grid gap-6">{relationships.map((relation) => <RelationshipGroup key={relation.key} doctorId={doctorId} relation={relation} />)}</div></section>;
}

function RelationshipGroup({ doctorId, relation }: { doctorId: string; relation: (typeof relationships)[number] }) {
  const client = useQueryClient();
  const key = ["doctor-profile-relation", relation.key, doctorId];
  const query = useQuery({ queryKey: key, queryFn: async () => { const [source, links] = await Promise.all([db.from(relation.source).select(`id,${relation.text}`).order(relation.text), db.from(relation.link).select(relation.sourceId).eq("doctor_id", doctorId)]); if (source.error) throw source.error; if (links.error) throw links.error; return { options: source.data ?? [], linked: new Set((links.data ?? []).map((row: any) => row[relation.sourceId])) }; } });
  const toggle = async (id: string, checked: boolean) => { const command = checked ? db.from(relation.link).insert({ doctor_id: doctorId, [relation.sourceId]: id }) : db.from(relation.link).delete().eq("doctor_id", doctorId).eq(relation.sourceId, id); const { error } = await command; if (!error) void client.invalidateQueries({ queryKey: key }); };
  return <div><h4 className="text-sm font-semibold">{relation.label}</h4><div className="mt-2 max-h-44 overflow-y-auto rounded-md border border-border p-2">{query.data?.options.length ? query.data.options.map((option: any) => <label key={option.id} className="flex items-start gap-3 rounded p-2 text-sm hover:bg-secondary"><Checkbox checked={query.data?.linked.has(option.id)} onCheckedChange={(value) => toggle(option.id, value === true)} /><span>{option[relation.text]}</span></label>) : <p className="p-2 text-sm text-muted-foreground">No records available.</p>}</div></div>;
}