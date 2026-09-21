/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminError } from "@/components/admin/ui";
import { DoctorProfileSections, type DoctorProfileSectionsHandle, type DoctorProfileTab } from "@/components/admin/doctor-profile-sections";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAdminSession } from "@/hooks/use-admin-session";
import { contentTypeByKey, saveRecord } from "@/lib/admin-content";
import { userFacingDataError } from "@/lib/data/errors";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;
const doctorType = contentTypeByKey("doctors");
const sections = [
  ["profile", "Profile"], ["hero", "Hero & Statistics"], ["specializations", "Specializations"],
  ["services", "Services"], ["experience", "Experience"], ["education", "Education"],
  ["achievements", "Achievements & Memberships"], ["locations", "Locations"],
  ["social-media", "Social Media"], ["media", "Media"], ["reviews", "Reviews"],
  ["faqs", "FAQs"], ["seo", "SEO"], ["publishing", "Publishing"],
] as const;
type SectionKey = (typeof sections)[number][0];
const sectionKeys = new Set<string>(sections.map(([key]) => key));
const profileFields = [
  ["name", "Doctor name", "text"], ["slug", "Web address (slug)", "text"],
  ["specialty", "Specialty", "text"], ["designation", "Designation", "text"],
  ["qualifications", "Qualifications (comma separated)", "text"],
  ["short_introduction", "Short introduction", "textarea"], ["bio", "Biography", "textarea"],
  ["phone_number", "Phone", "text"], ["whatsapp_number", "WhatsApp", "text"],
] as const;
const socialPlatforms = ["Instagram", "Facebook", "LinkedIn", "YouTube", "X / Twitter", "Other"];

type SocialRow = { id: string; platform: string; url: string; enabled: boolean };
const blankDoctor = () => ({ name: "", slug: "", department_id: null, specialty: "", designation: "", qualifications: [], short_introduction: "", bio: "", phone_number: "", whatsapp_number: "", photo_url: "", profile_image_alt: "", hero_image_url: "", hero_image_alt: "", quote: "", quote_attribution: "", social_links: {}, seo_title: "", seo_description: "", canonical_url: "", og_image_url: "", verification_status: "unverified", display_order: 0, published: false });
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function DoctorWorkspace() {
  const { doctorId, section: rawSection } = useParams({ from: "/_admin/doctors/$doctorId/$section" });
  const section: SectionKey = sectionKeys.has(rawSection) ? rawSection as SectionKey : "profile";
  const isNew = doctorId === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = useAdminSession();
  const canWrite = can("content.write");
  const canPublish = can("content.publish");
  const detailRef = useRef<DoctorProfileSectionsHandle>(null);
  const query = useQuery({
    queryKey: ["admin-doctor", doctorId],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await db.from("doctors").select("*").eq("id", doctorId).single();
      if (error) throw error;
      return data as any;
    },
  });
  const departments = useQuery({ queryKey: ["doctor-workspace-departments"], queryFn: async () => { const { data, error } = await db.from("departments").select("id,name").order("name"); if (error) throw error; return data ?? []; } });
  const media = useQuery({ queryKey: ["doctor-workspace-image-options"], queryFn: async () => { const { data, error } = await db.from("media_items").select("id,title,thumbnail_url,url").order("title"); if (error) throw error; return data ?? []; } });
  const [values, setValues] = useState<any>(blankDoctor());
  const [baseline, setBaseline] = useState<any>(blankDoctor());
  const [social, setSocial] = useState<SocialRow[]>([]);
  const [socialBaseline, setSocialBaseline] = useState<SocialRow[]>([]);
  const [detailReset, setDetailReset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const next = isNew ? blankDoctor() : query.data;
    if (!next) return;
    const prepared = clone(next);
    setValues(prepared); setBaseline(clone(prepared));
    const links = Object.entries((prepared.social_links ?? {}) as Record<string, string>).map(([platform, url], index) => ({ id: `${index}-${platform}`, platform, url, enabled: true }));
    setSocial(links); setSocialBaseline(clone(links));
  }, [isNew, query.data]);
  const title = isNew ? "New doctor" : (values.name || "Doctor workspace");
  const detailTab = sectionKeys.has(section) && !["profile", "social-media", "seo", "publishing"].includes(section) ? section as DoctorProfileTab : null;
  const payload = () => ({ ...values, qualifications: typeof values.qualifications === "string" ? values.qualifications.split(",").map((item: string) => item.trim()).filter(Boolean) : values.qualifications, social_links: Object.fromEntries(social.filter((item) => item.enabled && item.url.trim()).map((item) => [item.platform.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_"), item.url.trim()])), ...(canPublish ? {} : { published: baseline.published }) });
  const save = useMutation({
    mutationFn: async () => {
      if (!doctorType) throw new Error("Doctor content configuration is unavailable");
      if (detailTab && !isNew) {
        await detailRef.current?.save();
        if (section !== "hero") return doctorId;
      }
      const data = payload();
      if (isNew) {
        const { data: created, error: createError } = await db.from("doctors").insert(data).select("id").single();
        if (createError) throw createError;
        return created.id as string;
      }
      await saveRecord(doctorType, doctorId, data);
      return doctorId;
    },
    onSuccess: (savedId) => {
      setError(null); setBaseline(clone(values)); setSocialBaseline(clone(social));
      setDetailReset((current) => current + 1);
      void queryClient.invalidateQueries({ queryKey: ["admin-doctor", savedId] });
      void queryClient.invalidateQueries({ queryKey: ["doctor-profile-section"] });
      void queryClient.invalidateQueries({ queryKey: ["doctor-profile-relation"] });
      void queryClient.invalidateQueries({ queryKey: ["doctor-profile-reviews"] });
      void queryClient.invalidateQueries({ queryKey: ["doctor-profile-visibility"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-content", "doctors"] });
      if (isNew) void navigate({ to: "/_admin/doctors/$doctorId/$section", params: { doctorId: savedId, section: "profile" }, replace: true });
    },
    onError: (cause: Error) => setError(userFacingDataError(cause)),
  });
  const cancel = () => {
    setValues(clone(baseline));
    setSocial(clone(socialBaseline));
    setDetailReset((current) => current + 1);
    setError(null);
  };
  const set = (name: string, value: any) =>
    setValues((current: Record<string, any>) => ({ ...current, [name]: value }));
  const imageOptions = useMemo(() => (media.data ?? []).flatMap((item: any) => item.thumbnail_url ? [{ value: item.thumbnail_url, label: item.title }] : []), [media.data]);

  return <AdminShell title={title} description={isNew ? "Create the basic doctor record before adding related profile sections." : `Editing ${title}`} requires="content.write" actions={<div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link to="/_admin/doctors"><ArrowLeft className="size-4" /> Doctors</Link></Button>{!isNew && values.slug ? <Button asChild variant="outline"><a href={`/doctors/${values.slug}?preview=1`} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /> Preview</a></Button> : null}</div>}>
    <div className="grid gap-6 xl:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="min-w-0">
        <div className="xl:hidden"><Label htmlFor="doctor-workspace-section">Editing section</Label><Select value={section} onValueChange={(next) => navigate({ to: "/_admin/doctors/$doctorId/$section", params: { doctorId, section: next } })}><SelectTrigger id="doctor-workspace-section" className="mt-2 w-full"><SelectValue /></SelectTrigger><SelectContent>{sections.map(([key, label]) => <SelectItem key={key} value={key} disabled={isNew && key !== "profile"}>{label}</SelectItem>)}</SelectContent></Select></div>
        <nav aria-label="Doctor sections" className="hidden rounded-md border border-border bg-background p-2 xl:block"><p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase text-muted-foreground">{title}</p><ul className="grid gap-1">{sections.map(([key, label]) => <li key={key}><Button asChild variant={section === key ? "secondary" : "ghost"} className="h-auto w-full justify-start whitespace-normal text-left" disabled={isNew && key !== "profile"}><Link to="/_admin/doctors/$doctorId/$section" params={{ doctorId, section: key }}>{label}</Link></Button></li>)}</ul></nav>
      </aside>
      <div className="min-w-0">
        {query.isPending && !isNew ? <p className="text-muted-foreground">Loading doctor workspace…</p> : query.isError ? <AdminError message={userFacingDataError(query.error)} /> : <>
          <SectionHeading section={section} />
          <AdminError message={error} />
          <div className="mt-6">
            {section === "profile" ? <div className="grid gap-5 lg:grid-cols-2">{profileFields.map(([name, label, kind]) => <Field key={name} name={name} label={label} kind={kind} value={name === "qualifications" && Array.isArray(values[name]) ? values[name].join(", ") : values[name]} onChange={(value) => set(name, value)} />)}<div><Label htmlFor="doctor-department">Department</Label><Select value={values.department_id || "none"} onValueChange={(value) => set("department_id", value === "none" ? null : value)}><SelectTrigger id="doctor-department" className="mt-2"><SelectValue placeholder="Select a department" /></SelectTrigger><SelectContent><SelectItem value="none">No department selected</SelectItem>{(departments.data ?? []).map((item: any) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div><ImageEditor label="Profile image" value={values.photo_url ?? ""} alt={values.profile_image_alt ?? ""} options={imageOptions} ratio="4:5" onValue={(value) => set("photo_url", value)} onAlt={(value) => set("profile_image_alt", value)} /></div> : null}
            {section === "hero" ? <div className="grid gap-6"><ImageEditor label="Hero image" value={values.hero_image_url ?? ""} alt={values.hero_image_alt ?? ""} options={imageOptions} ratio="Current profile header crop" onValue={(value) => set("hero_image_url", value)} onAlt={(value) => set("hero_image_alt", value)} /><Field name="quote" label="Doctor quote" kind="textarea" value={values.quote} onChange={(value) => set("quote", value)} /><Field name="quote_attribution" label="Quote attribution" kind="text" value={values.quote_attribution} onChange={(value) => set("quote_attribution", value)} />{!isNew ? <DoctorProfileSections key={`hero-${detailReset}`} ref={detailRef} doctorId={doctorId} activeTab="hero" /> : null}</div> : null}
            {detailTab && section !== "hero" && !isNew ? <DoctorProfileSections key={`${detailTab}-${detailReset}`} ref={detailRef} doctorId={doctorId} activeTab={detailTab} /> : null}
            {section === "social-media" ? <SocialEditor rows={social} onChange={setSocial} /> : null}
            {section === "seo" ? <div className="grid gap-5"><Field name="seo_title" label="SEO title" kind="text" value={values.seo_title} onChange={(value) => set("seo_title", value)} /><Field name="seo_description" label="SEO description" kind="textarea" value={values.seo_description} onChange={(value) => set("seo_description", value)} /><Field name="canonical_url" label="Canonical URL" kind="text" value={values.canonical_url} onChange={(value) => set("canonical_url", value)} /><ImageEditor label="Open Graph image" value={values.og_image_url ?? ""} alt="" options={imageOptions} ratio="Social sharing image" onValue={(value) => set("og_image_url", value)} /></div> : null}
            {section === "publishing" ? <div className="grid max-w-2xl gap-5"><div><Label htmlFor="verification">Verification</Label><Select value={values.verification_status ?? "unverified"} onValueChange={(value) => set("verification_status", value)}><SelectTrigger id="verification" className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unverified">Needs verification</SelectItem><SelectItem value="pending">Pending verification</SelectItem><SelectItem value="verified">Verified</SelectItem></SelectContent></Select></div><Field name="display_order" label="Display order" kind="number" value={values.display_order} onChange={(value) => set("display_order", Number(value))} /><label className="flex items-center gap-3 rounded-md border border-border p-4"><Switch checked={Boolean(values.published)} disabled={!canPublish} onCheckedChange={(checked) => set("published", checked)} /><span><span className="block font-medium">Published</span><span className="block text-sm text-muted-foreground">{canPublish ? "Controls public visibility." : "Only an Editor, Admin, or Super Admin can change this."}</span></span></label></div> : null}
          </div>
          <div className="sticky bottom-0 mt-8 flex justify-end gap-3 border-t border-border bg-admin/95 py-4 backdrop-blur"><Button type="button" variant="outline" onClick={cancel}>Cancel</Button><Button type="button" disabled={!canWrite || save.isPending} onClick={() => save.mutate()}><Save className="size-4" /> {save.isPending ? "Saving…" : "Save"}</Button></div>
        </>}
      </div>
    </div>
  </AdminShell>;
}

function SectionHeading({ section }: { section: SectionKey }) { const label = sections.find(([key]) => key === section)?.[1] ?? "Profile"; return <div className="border-b border-border pb-4"><p className="text-sm font-medium text-primary">Doctor workspace</p><h2 className="mt-1 text-2xl font-semibold">{label}</h2></div>; }
function Field({ name, label, kind, value, onChange }: { name: string; label: string; kind: string; value: any; onChange: (value: string) => void }) { return <div className={kind === "textarea" ? "lg:col-span-2" : ""}><Label htmlFor={`doctor-${name}`}>{label}</Label>{kind === "textarea" ? <Textarea id={`doctor-${name}`} className="mt-2 min-h-32" value={value ?? ""} onChange={(event) => onChange(event.target.value)} /> : <Input id={`doctor-${name}`} className="mt-2" type={kind === "number" ? "number" : "text"} value={value ?? ""} onChange={(event) => onChange(event.target.value)} />}</div>; }
function ImageEditor({ label, value, alt, options, ratio, onValue, onAlt }: { label: string; value: string; alt: string; options: { value: string; label: string }[]; ratio: string; onValue: (value: string) => void; onAlt?: (value: string) => void }) { return <section className="grid gap-4 rounded-md border border-border p-4 lg:col-span-2"><div><h3 className="font-semibold">{label}</h3><p className="text-sm text-muted-foreground">Recommended aspect: {ratio}. Use JPG, PNG, or WebP. Upload is unavailable until approved storage is configured.</p></div>{value ? <img src={value} alt={alt || `${label} preview`} className="max-h-80 w-full rounded-md bg-secondary object-contain" /> : <div className="grid min-h-36 place-items-center rounded-md border border-dashed border-border text-sm text-muted-foreground">No image selected</div>}{options.length ? <div><Label>Select from Media & Content thumbnails</Label><Select value={options.some((option) => option.value === value) ? value : ""} onValueChange={onValue}><SelectTrigger className="mt-2"><SelectValue placeholder="Choose an existing image" /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div> : null}<div><Label>Image URL</Label><Input className="mt-2" value={value} onChange={(event) => onValue(event.target.value)} /></div>{onAlt ? <div><Label>Alternative text</Label><Input className="mt-2" value={alt} onChange={(event) => onAlt(event.target.value)} /></div> : null}{value ? <Button type="button" variant="outline" className="w-fit" onClick={() => onValue("")}><Trash2 className="size-4" /> Remove reference</Button> : null}</section>; }
function SocialEditor({ rows, onChange }: { rows: SocialRow[]; onChange: (rows: SocialRow[]) => void }) { const update = (id: string, patch: Partial<SocialRow>) => onChange(rows.map((row) => row.id === id ? { ...row, ...patch } : row)); return <div className="grid gap-4"><p className="text-sm text-muted-foreground">These are the doctor’s professional links, separate from hospital social accounts.</p>{rows.map((row, index) => <div key={row.id} className="grid gap-3 rounded-md border border-border p-4 md:grid-cols-[12rem_1fr_auto]"><Select value={socialPlatforms.includes(row.platform) ? row.platform : "Other"} onValueChange={(value) => update(row.id, { platform: value })}><SelectTrigger aria-label="Platform"><SelectValue /></SelectTrigger><SelectContent>{socialPlatforms.map((platform) => <SelectItem key={platform} value={platform}>{platform}</SelectItem>)}</SelectContent></Select><Input aria-label="Profile URL" type="url" value={row.url} onChange={(event) => update(row.id, { url: event.target.value })} /><div className="flex items-center gap-2"><Checkbox checked={row.enabled} onCheckedChange={(checked) => update(row.id, { enabled: checked === true })} /><Button type="button" size="icon" variant="ghost" aria-label="Remove social link" onClick={() => onChange(rows.filter((item) => item.id !== row.id))}><Trash2 className="size-4" /></Button></div>{index === rows.length ? null : null}</div>)}<Button type="button" variant="outline" className="w-fit" onClick={() => onChange([...rows, { id: crypto.randomUUID(), platform: "LinkedIn", url: "", enabled: true }])}><Plus className="size-4" /> Add social link</Button></div>; }
