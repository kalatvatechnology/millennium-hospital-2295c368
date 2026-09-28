import { useMemo, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, ChevronDown, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  SEO_DESCRIPTION_RANGE,
  SEO_TITLE_RANGE,
  doctorProfileUrl,
  absolutePublicUrl,
  detectDoctorSchemaType,
  doctorStructuredData,
  suggestDoctorSeoDescription,
  suggestDoctorSeoTitle,
  type DoctorSeoSource,
} from "@/lib/doctor-seo";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Values = any;

/** Reads the SAVED doctor profile (same fields the public page uses) — never the unsaved form. */
async function loadSavedSchemaSource(doctorId: string): Promise<{ source: DoctorSeoSource; updatedAt: string | null }> {
  const { data, error } = await supabase
    .from("doctors")
    .select(
      "name,slug,designation,specialty,qualifications,short_introduction,bio,location,photo_url,social_links,updated_at, department:departments!doctors_department_id_fkey(name), doctor_departments(departments!doctor_departments_department_id_fkey(name)), doctor_specializations(title,enabled,display_order)",
    )
    .eq("id", doctorId)
    .single();
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  return {
    updatedAt: row.updated_at ?? null,
    source: {
      name: row.name,
      slug: row.slug,
      designation: row.designation,
      specialty: row.specialty,
      departmentName: row.department?.name ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      departmentNames: (row.doctor_departments ?? []).map((l: any) => l.departments?.name).filter(Boolean),
      specializations: (row.doctor_specializations ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((x: any) => x.enabled !== false)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort((a: any, b: any) => a.display_order - b.display_order)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((x: any) => x.title),
      qualifications: row.qualifications ?? [],
      shortIntroduction: row.short_introduction,
      bio: row.bio,
      location: row.location,
      photoUrl: row.photo_url,
      socialLinks: row.social_links ?? {},
    },
  };
}

function Group({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="border border-border bg-card p-5">
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      <div className="mt-4 grid gap-5">{children}</div>
    </section>
  );
}

function Counted({
  id,
  label,
  value,
  range,
  multiline,
  placeholder,
  onChange,
  onSuggest,
  suggestion,
}: {
  id: string;
  label: string;
  value: string;
  range?: readonly [number, number];
  multiline?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  onSuggest?: () => void;
  suggestion?: string;
}) {
  const length = value.trim().length;
  const tooLong = range ? length > range[1] : false;
  const Control = multiline ? Textarea : Input;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {onSuggest ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!suggestion}
            onClick={onSuggest}
            title={suggestion || "Add the doctor's name first"}
          >
            <Sparkles className="size-3.5" /> Suggested
          </Button>
        ) : null}
      </div>
      <Control
        id={id}
        className={cn("mt-2", multiline && "min-h-24")}
        value={value}
        placeholder={placeholder}
        aria-describedby={`${id}-help`}
        onChange={(event: { target: { value: string } }) => onChange(event.target.value)}
      />
      {range ? (
        <div id={`${id}-help`} className="mt-1 flex justify-between gap-3 text-xs">
          <span className="text-muted-foreground">
            Recommended: around {range[0]}–{range[1]} characters.
          </span>
          <span className={cn("shrink-0 tabular-nums", tooLong ? "font-semibold text-destructive" : "text-muted-foreground")}>
            {length} characters{tooLong ? " — too long" : ""}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function DoctorSeoWorkspace({
  doctorId,
  values,
  source,
  set,
  imageEditor,
}: {
  doctorId: string;
  values: Values;
  source: DoctorSeoSource;
  set: (key: string, value: unknown) => void;
  /** The existing Media & Content image selector, rendered for the OG image. */
  imageEditor: ReactNode;
}) {
  const profileUrl = doctorProfileUrl(source.slug);
  const title = String(values.seo_title ?? "");
  const description = String(values.seo_description ?? "");
  const canonical = String(values.canonical_url ?? "");
  const published = values.published === true;
  const indexable = published && values.robots_index !== false;
  const titleSuggestion = suggestDoctorSeoTitle(source);
  const descriptionSuggestion = suggestDoctorSeoDescription(source);
  const effectiveCanonical = canonical.trim() || profileUrl || "";
  const autoCanonical = !canonical.trim() || canonical.trim() === profileUrl;
  const ogTitle = String(values.og_title ?? "").trim() || title.trim() || String(source.name ?? "");
  const ogDescription = String(values.og_description ?? "").trim() || description.trim();
  const saved = useQuery({
    queryKey: ["doctor-schema-source", doctorId],
    enabled: doctorId !== "new",
    queryFn: () => loadSavedSchemaSource(doctorId),
  });
  const savedSource = saved.data?.source ?? null;
  const schema = useMemo(() => (savedSource ? doctorStructuredData(savedSource) : null), [savedSource]);
  const detected = savedSource ? detectDoctorSchemaType(savedSource) : null;
  const canSchema = Boolean(source.name && profileUrl);
  const schemaChecks = savedSource
    ? [
        { ok: Boolean(detected), yes: `Schema type detected (${detected?.type})`, no: "Schema type not detected" },
        { ok: Boolean(savedSource.name?.trim()), yes: "Doctor name available", no: "Doctor name missing" },
        { ok: Boolean(doctorProfileUrl(savedSource.slug)), yes: "Profile URL available", no: "Profile URL missing" },
        { ok: Boolean(savedSource.shortIntroduction?.trim() || savedSource.bio?.trim()), yes: "Description available", no: "Description missing" },
        { ok: (savedSource.qualifications ?? []).length > 0, yes: "Qualification data available", no: "Qualification data missing" },
        { ok: Boolean(savedSource.departmentName || (savedSource.departmentNames ?? []).length), yes: "Department available", no: "Department not assigned" },
        { ok: true, yes: "Hospital available", no: "" },
        { ok: Boolean(savedSource.photoUrl?.trim()), yes: "Profile image available", no: "Profile image missing" },
        { ok: Boolean(absolutePublicUrl(savedSource.photoUrl)), yes: "Public image URL available", no: "Public image URL missing" },
      ]
    : [];

  const checks: { label: string; ok: boolean; fix?: string | undefined }[] = [
    { label: "SEO title present", ok: Boolean(title.trim()) },
    { label: "SEO description present", ok: Boolean(description.trim()) },
    { label: "Canonical URL available", ok: Boolean(effectiveCanonical) },
    { label: "Profile URL available", ok: Boolean(profileUrl), fix: "profile" },
    { label: "Doctor name available", ok: Boolean(source.name?.trim()), fix: "profile" },
    { label: "Designation available", ok: Boolean(source.designation?.trim()), fix: "profile" },
    { label: "Specialization available", ok: Boolean(source.specialty?.trim()), fix: "specializations" },
    { label: "Hospital department relationship available", ok: Boolean(source.departmentName?.trim()), fix: "profile" },
    { label: "Profile image available", ok: Boolean(source.photoUrl?.trim()), fix: "profile" },
    { label: "Profile image ALT text available", ok: Boolean(String(values.profile_image_alt ?? "").trim()), fix: "profile" },
    { label: "Structured data can be generated", ok: canSchema, fix: "profile" },
    { label: "Published status compatible with indexing", ok: indexable, fix: published ? undefined : "publishing" },
  ];

  return (
    <div className="grid gap-5">
      <Group title="SEO basics" description="How this profile appears in Google results. Lengths are guidance only — saving is never blocked.">
        <Counted
          id="doctor-seo_title"
          label="SEO title"
          value={title}
          range={SEO_TITLE_RANGE}
          onChange={(v) => set("seo_title", v)}
          suggestion={titleSuggestion}
          onSuggest={() => set("seo_title", titleSuggestion)}
        />
        <Counted
          id="doctor-seo_description"
          label="SEO description"
          value={description}
          range={SEO_DESCRIPTION_RANGE}
          multiline
          onChange={(v) => set("seo_description", v)}
          suggestion={descriptionSuggestion}
          onSuggest={() => set("seo_description", descriptionSuggestion)}
        />
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="doctor-canonical_url">Canonical URL</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!profileUrl || autoCanonical}
              onClick={() => set("canonical_url", "")}
            >
              Use profile URL
            </Button>
          </div>
          <Input
            id="doctor-canonical_url"
            className="mt-2"
            value={canonical}
            placeholder={profileUrl ?? "Save a web address (slug) first"}
            onChange={(event) => set("canonical_url", event.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {autoCanonical
              ? "Automatic: uses this doctor's public profile URL. Type a different address only if another page should be the main one."
              : "Manual: a custom canonical URL is set."}
          </p>
        </div>
      </Group>

      <Group title="Search preview" description="Updates as you type.">
        <div className="max-w-2xl border border-border bg-background p-4">
          <p className="truncate text-xs text-muted-foreground">
            {(profileUrl ?? "").replace(/^https?:\/\//, "") || "No profile URL yet"}
          </p>
          <p className="mt-1 line-clamp-1 text-lg text-primary">
            {title.trim() || source.name || "SEO title"}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {description.trim() || "Add an SEO description to control this summary."}
          </p>
        </div>
      </Group>

      <Group title="Social sharing" description="Shown when the profile is shared on WhatsApp, Facebook or LinkedIn. Empty fields reuse the SEO title and description.">
        <Counted
          id="doctor-og_title"
          label="OG title"
          value={String(values.og_title ?? "")}
          placeholder={title.trim() || "Uses the SEO title"}
          onChange={(v) => set("og_title", v)}
        />
        <Counted
          id="doctor-og_description"
          label="OG description"
          value={String(values.og_description ?? "")}
          placeholder={description.trim() || "Uses the SEO description"}
          multiline
          onChange={(v) => set("og_description", v)}
        />
        {imageEditor}
        <div className="max-w-md overflow-hidden border border-border bg-background">
          <div className="aspect-[1200/630] bg-muted">
            {values.og_image_url ? (
              <img src={values.og_image_url} alt="" className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center text-xs text-muted-foreground">No sharing image selected</div>
            )}
          </div>
          <div className="p-3">
            <p className="truncate text-[11px] uppercase text-muted-foreground">
              {(profileUrl ?? "").replace(/^https?:\/\//, "").split("/")[0]}
            </p>
            <p className="line-clamp-1 text-sm font-semibold">{ogTitle || "OG title"}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{ogDescription}</p>
          </div>
        </div>
      </Group>

      <Group title="Structured data">
        <p className="text-sm text-muted-foreground">
          Structured data is automatically generated from this doctor's profile. You do not need to manually edit JSON-LD.
        </p>
        {doctorId === "new" ? (
          <p className="text-sm text-muted-foreground">Save the doctor first to generate structured data.</p>
        ) : saved.isError ? (
          <p className="text-sm text-destructive">Could not read the saved profile. Try Refresh from Doctor Profile.</p>
        ) : !schema ? (
          <p className="text-sm text-muted-foreground">Reading saved profile…</p>
        ) : (
          <>
            <dl className="grid gap-2 text-sm sm:grid-cols-[10rem_1fr]">
              <dt className="text-muted-foreground">Schema type</dt>
              <dd className="font-semibold">
                {detected?.type}
                {detected?.basis ? <span className="ml-2 font-normal text-muted-foreground">based on "{detected.basis}"</span> : null}
              </dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-primary" /> Automatically synced with Doctor Profile</dd>
              <dt className="text-muted-foreground">Last generated</dt>
              <dd>
                {saved.dataUpdatedAt ? new Date(saved.dataUpdatedAt).toLocaleString() : "—"}
                {saved.data?.updatedAt ? <span className="ml-2 text-muted-foreground">(profile saved {new Date(saved.data.updatedAt).toLocaleString()})</span> : null}
              </dd>
            </dl>
            <p className="text-xs text-muted-foreground">Uses the last saved profile. Unsaved changes appear here after you save. The public page always generates this data itself — Refresh is only a manual check.</p>
            <div>
              <Button type="button" size="sm" variant="outline" disabled={saved.isFetching} onClick={() => void saved.refetch()}>
                <RefreshCw className={cn("size-3.5", saved.isFetching && "animate-spin")} /> Refresh from Doctor Profile
              </Button>
            </div>
            <ul className="divide-y divide-border">
              {schemaChecks.map((c) => (
                <li key={c.yes} className="flex items-center gap-2 py-1.5 text-sm">
                  {c.ok ? <CheckCircle2 className="size-4 text-primary" /> : <AlertCircle className="size-4 text-destructive" />}
                  {c.ok ? c.yes : c.no}
                </li>
              ))}
            </ul>
            <details className="group border border-border">
              <summary className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm font-medium">
                View Generated Schema <ChevronDown className="size-4 transition group-open:rotate-180" />
              </summary>
              <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">Generated automatically from Doctor Profile (read-only).</p>
              <pre className="max-h-80 overflow-auto border-t border-border bg-muted p-3 text-xs">
                {JSON.stringify(schema, null, 2)}
              </pre>
            </details>
          </>
        )}
      </Group>

      <Group title="Search visibility">
        <label className="flex items-start justify-between gap-4">
          <span>
            <span className="block text-sm font-medium">Allow search engines to index this profile</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {published
                ? "On by default for published profiles."
                : "Off while the profile is unpublished — it can't be indexed until it is published."}
            </span>
          </span>
          <Switch
            checked={indexable}
            disabled={!published}
            onCheckedChange={(checked) => set("robots_index", checked)}
            aria-label="Allow search engines to index this profile"
          />
        </label>
      </Group>

      <Group title="SEO health" description="Factual checks only — no score.">
        <ul className="divide-y divide-border">
          {checks.map((check) => (
            <li key={check.label} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <span className="flex items-center gap-2">
                {check.ok ? (
                  <CheckCircle2 className="size-4 text-primary" />
                ) : (
                  <AlertCircle className="size-4 text-destructive" />
                )}
                {check.ok ? check.label : `${check.label.replace(/ (present|available|can be generated|compatible with indexing)$/, "")} — missing`}
              </span>
              {!check.ok && check.fix && doctorId !== "new" ? (
                <Link
                  to="/_admin/doctors/$doctorId/$section"
                  params={{ doctorId, section: check.fix }}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Fix → {check.fix === "specializations" ? "Specializations" : check.fix === "publishing" ? "Publishing" : "Profile"}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </Group>
    </div>
  );
}
