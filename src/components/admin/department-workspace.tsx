import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  Circle,
  ExternalLink,
  ImagePlus,
  Plus,
  Send,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminDataError, AdminError, StatusBadge } from "@/components/admin/ui";
import { InlineDelete } from "@/components/admin/workspace";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminSession } from "@/hooks/use-admin-session";
import { userFacingDataError } from "@/lib/data/errors";
import { getDepartmentPresentation } from "@/lib/department-presentation";
import {
  hasPageContent,
  newItemId,
  pageImageUrls,
  parseDepartmentPage,
  type DepartmentPage,
  type ListSection,
  type PageItem,
} from "@/lib/department-page";
import { cn } from "@/lib/utils";

const db = supabase as any;
const imageBucket = "doctor-profile-images";
const imageEndpoint = "/api/public/doctor-profile-image";
const imageFolder = "departments";
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageBytes = 5 * 1024 * 1024;

const SECTIONS = [
  { key: "identity", label: "Identity & Hero" },
  { key: "about", label: "About Department" },
  { key: "care", label: "Specialized Care" },
  { key: "conditions", label: "Conditions" },
  { key: "specialists", label: "Specialists" },
  { key: "facilities", label: "Facilities & Technology" },
  { key: "approach", label: "Millennium Approach" },
  { key: "faqs", label: "FAQs" },
  { key: "media", label: "Media" },
  { key: "seo", label: "SEO" },
  { key: "publishing", label: "Publishing" },
] as const;
type SectionKey = (typeof SECTIONS)[number]["key"];

type Identity = { name: string; slug: string; short_description: string; description: string };

function managedPath(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url, "https://millennium.invalid");
    if (parsed.pathname !== imageEndpoint) return null;
    const path = parsed.searchParams.get("path");
    return path && path.startsWith(`${imageFolder}/`) && !path.includes("..") ? path : null;
  } catch {
    return null;
  }
}

async function removeImages(urls: string[]) {
  const paths = [...new Set(urls.map(managedPath).filter((p): p is string => Boolean(p)))];
  if (!paths.length) return;
  const { error } = await supabase.storage.from(imageBucket).remove(paths);
  if (error) console.error("Department image cleanup failed", { paths, error });
}

function saveErrorMessage(cause: unknown) {
  const raw = cause as { code?: string; message?: string; details?: string };
  const text = `${raw?.message ?? ""} ${raw?.details ?? ""}`;
  if ((raw?.code === "23505" || /duplicate key/i.test(text)) && /slug/i.test(text))
    return "This web address is already being used by another department. Please choose a different one.";
  if (/permission to publish/i.test(text))
    return "Your role can save drafts, but publishing is done by an editor or admin.";
  if (/short_description_length/i.test(text))
    return "Short description must be 180 characters or fewer.";
  return userFacingDataError(cause);
}

function validate(identity: Identity, page: DepartmentPage): string | null {
  if (!identity.name.trim()) return "Department name is required.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(identity.slug))
    return "Slug may only use lowercase letters, numbers and single hyphens.";
  if (identity.short_description.length > 180)
    return "Short description must be 180 characters or fewer.";
  if (page.hero.image_url && !page.hero.image_alt.trim()) return "Add alt text for the hero image.";
  if (page.facilities.image_url && !page.facilities.image_alt.trim())
    return "Add alt text for the facilities image.";
  const lists: [string, ListSection][] = [
    ["About highlight", page.about],
    ["Care area", page.care],
    ["Condition", page.conditions],
    ["Facility point", page.facilities],
    ["Principle", page.approach],
  ];
  for (const [label, s] of lists)
    if (s.items.some((i) => !i.title.trim())) return `Every ${label.toLowerCase()} needs a title.`;
  if (page.seo.canonical_url && !/^https:\/\//.test(page.seo.canonical_url))
    return "Canonical URL must start with https://";
  if (
    page.seo.og_image_url &&
    !/^https:\/\//.test(page.seo.og_image_url) &&
    !managedPath(page.seo.og_image_url)
  )
    return "OG image must be an https link or an uploaded image.";
  return null;
}

/** Existing approved page text (no images) to start a department that has no CMS content yet. */
function pageFromPresentation(slug: string, base: DepartmentPage): DepartmentPage | null {
  const p = getDepartmentPresentation(slug);
  if (!p) return null;
  const item = (title: string, text = ""): PageItem => ({
    id: newItemId(),
    title,
    text,
    enabled: true,
  });
  return {
    ...base,
    hero: { ...base.hero, headline: p.heroLines.join("\n"), intro: p.lead },
    about: {
      ...base.about,
      title: p.introHeading,
      items: p.highlights.map((h) => item(h.title, h.text)),
    },
    care: {
      ...base.care,
      intro: p.careIntro,
      items: p.careAreas.map((a) => item(a.title, a.text)),
    },
    conditions: { ...base.conditions, items: p.conditions.map((c) => item(c)) },
    facilities: {
      ...base.facilities,
      intro: p.facilityText,
      items: p.facilityPoints.map((f) => item(f)),
    },
  };
}

export function DepartmentWorkspace() {
  const { departmentId, section } = useParams({
    from: "/_admin/departments/$departmentId/$section",
  });
  const active = (SECTIONS.find((s) => s.key === section)?.key ?? "identity") as SectionKey;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = useAdminSession();
  const canPublish = can("content.publish");

  const record = useQuery({
    queryKey: ["admin-department-workspace", departmentId],
    queryFn: async () => {
      const { data, error } = await db
        .from("departments")
        .select("*")
        .eq("id", departmentId)
        .maybeSingle();
      if (error) throw error;
      return data as Record<string, any> | null;
    },
  });

  // Current relationship-table links, used once to seed pages saved before staged links existed.
  const legacyLinks = useQuery({
    queryKey: ["admin-department-legacy-links", departmentId],
    queryFn: async (): Promise<DepartmentLinks> => {
      const [d, f, m] = await Promise.all([
        db.from("doctor_departments").select("doctor_id").eq("department_id", departmentId).order("display_order"),
        db.from("department_faqs").select("faq_id").eq("department_id", departmentId).order("display_order"),
        db.from("media_departments").select("media_id").eq("department_id", departmentId).order("display_order"),
      ]);
      for (const r of [d, f, m]) if (r.error) throw r.error;
      return {
        doctors: (d.data as any[]).map((r) => r.doctor_id),
        faqs: (f.data as any[]).map((r) => r.faq_id),
        media: (m.data as any[]).map((r) => r.media_id),
      };
    },
  });

  const [identity, setIdentity] = useState<Identity>({
    name: "",
    slug: "",
    short_description: "",
    description: "",
  });
  const [page, setPage] = useState<DepartmentPage>(() => parseDepartmentPage({}));
  const [baseline, setBaseline] = useState<{ identity: Identity; page: DepartmentPage } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const uploads = useRef(new Set<string>());

  useEffect(() => {
    const row = record.data;
    if (!row) return;
    const nextIdentity = {
      name: row["name"] ?? "",
      slug: row["slug"] ?? "",
      short_description: row["short_description"] ?? "",
      description: row["description"] ?? "",
    };
    const source = hasPageContent(row["page_draft"]) ? row["page_draft"] : row["page_published"];
    const nextPage = parseDepartmentPage(source ?? {});
    if (!nextPage.links) nextPage.links = legacyLinks.data ?? null;
    setIdentity(nextIdentity);
    setPage(nextPage);
    setBaseline({ identity: structuredClone(nextIdentity), page: structuredClone(nextPage) });
  }, [record.data, legacyLinks.data]);

  const dirty = useMemo(
    () => (baseline ? JSON.stringify({ identity, page }) !== JSON.stringify(baseline) : false),
    [identity, page, baseline],
  );

  // Unsaved uploads are removed when leaving the workspace.
  useEffect(() => {
    const pending = uploads.current;
    return () => {
      if (pending.size) void removeImages([...pending]);
    };
  }, []);

  const row = record.data;
  const published = Boolean(row?.["published"]);
  const publishedPage =
    row && hasPageContent(row["page_published"])
      ? parseDepartmentPage(row["page_published"])
      : null;
  const hasDraftChanges =
    !!row &&
    hasPageContent(row["page_draft"]) &&
    JSON.stringify(row["page_draft"]) !== JSON.stringify(row["page_published"]);

  const persist = async (mode: "draft" | "publish") => {
    setError(null);
    const problem = validate(identity, page);
    if (problem) throw new Error(problem);
    const now = new Date().toISOString();
    const payload: Record<string, unknown> = {
      name: identity.name.trim(),
      slug: identity.slug,
      short_description: identity.short_description.trim() || null,
      description: identity.description.trim() || null,
      page_draft: page,
      page_draft_saved_at: now,
    };
    if (mode === "publish")
      Object.assign(payload, { page_published: page, page_published_at: now, published: true });
    const { error: saveError } = await db
      .from("departments")
      .update(payload)
      .eq("id", departmentId);
    if (saveError) throw saveError;
    // Only after a successful save: remove images no longer referenced by the draft, the published page or the card.
    const keep = new Set([
      ...pageImageUrls(page),
      ...(mode === "draft" && publishedPage ? pageImageUrls(publishedPage) : []),
      row?.["card_image_url"] ?? "",
    ]);
    const previous = [
      ...(baseline ? pageImageUrls(baseline.page) : []),
      ...(publishedPage ? pageImageUrls(publishedPage) : []),
    ];
    await removeImages([...previous, ...uploads.current].filter((u) => !keep.has(u)));
    uploads.current.clear();
  };

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-department-workspace", departmentId] }),
      queryClient.invalidateQueries({ queryKey: ["admin-content", "departments"] }),
      queryClient.invalidateQueries({ queryKey: ["departments"] }),
      queryClient.invalidateQueries({ queryKey: ["department"] }),
    ]);

  const saveDraft = useMutation({
    mutationFn: () => persist("draft"),
    onSuccess: async () => {
      await refresh();
      toast.success("Department draft saved successfully.");
    },
    onError: (cause) => setError(saveErrorMessage(cause)),
  });
  const publish = useMutation({
    mutationFn: () => persist("publish"),
    onSuccess: async () => {
      await refresh();
      toast.success("Department published successfully.");
    },
    onError: (cause) => setError(saveErrorMessage(cause)),
  });
  const unpublish = useMutation({
    mutationFn: async () => {
      const { error: e } = await db
        .from("departments")
        .update({ published: false })
        .eq("id", departmentId);
      if (e) throw e;
    },
    onSuccess: async () => {
      await refresh();
      toast.success("Department unpublished. It is no longer visible on the website.");
    },
    onError: (cause) => setError(saveErrorMessage(cause)),
  });

  const cancel = () => {
    if (!baseline) return;
    const keep = new Set(pageImageUrls(baseline.page));
    void removeImages([...uploads.current].filter((u) => !keep.has(u)));
    uploads.current.clear();
    setIdentity(structuredClone(baseline.identity));
    setPage(structuredClone(baseline.page));
    setError(null);
  };

  const busy = saveDraft.isPending || publish.isPending || unpublish.isPending;
  const set = <K extends keyof DepartmentPage>(key: K, value: DepartmentPage[K]) =>
    setPage((p) => ({ ...p, [key]: value }));
  const onUpload = (url: string) => uploads.current.add(url);
  const setLinks = (key: keyof DepartmentLinks, value: string[]) =>
    setPage((p) => ({
      ...p,
      links: { ...(p.links ?? { doctors: [], faqs: [], media: [] }), [key]: value },
    }));

  const configured: Record<SectionKey, boolean> = {
    identity: Boolean(identity.name && page.hero.headline),
    about: Boolean(page.about.intro || identity.description || page.about.items.length),
    care: page.care.items.length > 0,
    conditions: page.conditions.items.length > 0,
    specialists: false,
    facilities: page.facilities.items.length > 0 || Boolean(page.facilities.intro),
    approach: page.approach.items.length > 0,
    faqs: false,
    media: false,
    seo: Boolean(page.seo.title && page.seo.description),
    publishing: published,
  };
  const enabled: Partial<Record<SectionKey, boolean>> = {
    identity: page.hero.enabled,
    about: page.about.enabled,
    care: page.care.enabled,
    conditions: page.conditions.enabled,
    specialists: page.specialists.enabled,
    facilities: page.facilities.enabled,
    approach: page.approach.enabled,
    faqs: page.faqs.enabled,
    media: page.media.enabled,
  };

  if (record.isPending)
    return (
      <AdminShell title="Department workspace" requires="content.write">
        <p className="text-muted-foreground">Loading department…</p>
      </AdminShell>
    );
  if (record.isError || !row)
    return (
      <AdminShell title="Department workspace" requires="content.write">
        {record.isError ? (
          <AdminDataError error={record.error} />
        ) : (
          <AdminError message="This department could not be found." />
        )}
        <Button asChild variant="outline" className="mt-4">
          <Link to="/_admin/departments">Back to Departments</Link>
        </Button>
      </AdminShell>
    );

  const goto = (key: string) =>
    void navigate({
      to: "/_admin/departments/$departmentId/$section",
      params: { departmentId, section: key },
    });
  const index = SECTIONS.findIndex((s) => s.key === active);

  return (
    <AdminShell
      title={identity.name || "Department"}
      description="Department workspace"
      requires="content.write"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Link
            to="/_admin/departments"
            className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to Departments
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold">{identity.name || "Untitled department"}</h2>
            <StatusBadge
              status={published ? "Published" : "Draft"}
              tone={published ? "positive" : "neutral"}
            />
            {hasDraftChanges && published ? (
              <span className="text-xs font-medium text-muted-foreground">Unpublished changes</span>
            ) : null}
            {dirty ? (
              <span className="text-xs font-medium text-brand-accent">Unsaved edits</span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={!dirty || busy} onClick={cancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => saveDraft.mutate()}
          >
            {saveDraft.isPending ? "Saving…" : "Save Draft"}
          </Button>
          <Button asChild variant="outline">
            <a
              href={`/departments/${row["slug"]}?preview=1`}
              target="_blank"
              rel="noreferrer"
              title={dirty ? "Save the draft first to preview your latest edits." : undefined}
            >
              <ExternalLink className="size-4" /> Preview
            </a>
          </Button>
          {canPublish ? (
            <Button type="button" disabled={busy} onClick={() => publish.mutate()}>
              <Send className="size-4" /> {publish.isPending ? "Publishing…" : "Publish"}
            </Button>
          ) : null}
        </div>
      </div>
      {error ? (
        <div className="mt-4">
          <AdminError message={error} />
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="min-w-0">
          <label className="lg:hidden">
            <span className="sr-only">Section</span>
            <select
              className="h-11 w-full border border-input bg-background px-3 text-sm"
              value={active}
              onChange={(e) => goto(e.target.value)}
            >
              {SECTIONS.map((s, i) => (
                <option
                  key={s.key}
                  value={s.key}
                >{`${String(i + 1).padStart(2, "0")} ${s.label}`}</option>
              ))}
            </select>
          </label>
          <nav
            aria-label="Department sections"
            className="sticky top-24 hidden border border-border bg-background lg:block"
          >
            <ul>
              {SECTIONS.map((s, i) => {
                const isActive = s.key === active;
                const off = enabled[s.key] === false;
                return (
                  <li key={s.key}>
                    <Link
                      to="/_admin/departments/$departmentId/$section"
                      params={{ departmentId, section: s.key }}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center gap-3 border-l-2 px-3 py-2 text-sm",
                        isActive
                          ? "border-brand-accent bg-secondary font-semibold text-foreground"
                          : "border-transparent text-muted-foreground hover:bg-secondary/60",
                      )}
                    >
                      <span className="w-5 font-heading text-xs tabular-nums text-brand-accent">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className={cn("flex-1", off && "line-through opacity-60")}>
                        {s.label}
                      </span>
                      {configured[s.key] ? (
                        <CheckCircle2 className="size-3.5 text-primary" aria-label="Configured" />
                      ) : (
                        <Circle className="size-3 opacity-30" aria-hidden />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <div className="min-w-0">
          {active === "identity" ? (
            <Panel
              title="Identity & Hero"
              description="Department details and the top of the public page. Name, slug and descriptions also appear on the Department Card."
            >
              {!hasPageContent(row["page_draft"]) &&
              !hasPageContent(row["page_published"]) &&
              getDepartmentPresentation(row["slug"]) ? (
                <div className="flex flex-col gap-3 border border-border bg-secondary p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    This department's page currently shows its approved design text. Load that text
                    here to edit it (images are not copied).
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const next = pageFromPresentation(row["slug"], page);
                      if (next) setPage(next);
                    }}
                  >
                    Load current page text
                  </Button>
                </div>
              ) : null}
              <Grid>
                <Field label="Department name" required>
                  <Input
                    value={identity.name}
                    onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
                  />
                </Field>
                <Field label="Slug" help="Web address: /departments/slug">
                  <Input
                    value={identity.slug}
                    onChange={(e) =>
                      setIdentity({ ...identity, slug: e.target.value.toLowerCase() })
                    }
                  />
                </Field>
                <Field
                  label="Short description"
                  wide
                  count={[identity.short_description.length, 180]}
                >
                  <Textarea
                    rows={2}
                    value={identity.short_description}
                    onChange={(e) =>
                      setIdentity({ ...identity, short_description: e.target.value })
                    }
                  />
                </Field>
                <Field
                  label="Full description"
                  wide
                  help="Used as the About introduction when that section has no introduction of its own."
                >
                  <Textarea
                    rows={4}
                    value={identity.description}
                    onChange={(e) => setIdentity({ ...identity, description: e.target.value })}
                  />
                </Field>
              </Grid>
              <SubHeading
                title="Hero"
                toggle={
                  <Toggle
                    checked={page.hero.enabled}
                    onChange={(v) => set("hero", { ...page.hero, enabled: v })}
                  />
                }
              />
              <Grid>
                <Field
                  label="Hero headline"
                  wide
                  help="One line per row. The last row is shown in navy."
                >
                  <Textarea
                    rows={4}
                    value={page.hero.headline}
                    onChange={(e) => set("hero", { ...page.hero, headline: e.target.value })}
                  />
                </Field>
                <Field
                  label="Hero introduction"
                  wide
                  help="Leave empty to use the short description."
                >
                  <Textarea
                    rows={3}
                    value={page.hero.intro}
                    onChange={(e) => set("hero", { ...page.hero, intro: e.target.value })}
                  />
                </Field>
                <ImageField
                  label="Hero image"
                  url={page.hero.image_url}
                  fallbackNote="Without a hero image, the Department Card image is used."
                  onChange={(url) => set("hero", { ...page.hero, image_url: url })}
                  onUpload={onUpload}
                />
                <Field label="Hero image alt text" wide count={[page.hero.image_alt.length, 160]}>
                  <Input
                    value={page.hero.image_alt}
                    maxLength={160}
                    onChange={(e) => set("hero", { ...page.hero, image_alt: e.target.value })}
                  />
                </Field>
              </Grid>
              <div className="grid gap-3 sm:grid-cols-3">
                <Toggle
                  label="Show Book Appointment"
                  checked={page.hero.show_book}
                  onChange={(v) => set("hero", { ...page.hero, show_book: v })}
                />
                <Toggle
                  label="Show Contact Hospital"
                  checked={page.hero.show_contact}
                  onChange={(v) => set("hero", { ...page.hero, show_contact: v })}
                />
                <Toggle
                  label="Show Meet Our Specialists"
                  checked={page.hero.show_specialists}
                  onChange={(v) => set("hero", { ...page.hero, show_specialists: v })}
                />
              </div>
            </Panel>
          ) : null}

          {active === "about" ? (
            <ListPanel
              title="About Department"
              itemName="highlight"
              emptyText="No highlights added."
              value={page.about}
              onChange={(v) => set("about", v)}
              introHelp="Leave empty to use the department's full description."
            />
          ) : null}
          {active === "care" ? (
            <ListPanel
              title="Specialized Care"
              itemName="care area"
              emptyText="No care areas added."
              value={page.care}
              onChange={(v) => set("care", v)}
              titleHelp="One line per row. Leave empty for “Specialized [Department] Care”."
            />
          ) : null}
          {active === "conditions" ? (
            <ListPanel
              title="Conditions We Treat"
              itemName="condition"
              nameLabel="Name"
              textOptional
              emptyText="No conditions added."
              value={page.conditions}
              onChange={(v) => set("conditions", v)}
            />
          ) : null}
          {active === "specialists" ? (
            <Panel
              title="Specialists"
              description="Choose existing doctors for this department page. Doctor profiles are edited in the Doctor workspace. Changes are saved with the draft and appear on the public page only after Publish."
            >
              <Toggle
                label="Show the specialists section"
                checked={page.specialists.enabled}
                onChange={(v) => set("specialists", { enabled: v })}
              />
              <SpecialistsManager ids={(page.links ?? { doctors: [], faqs: [], media: [] }).doctors} onChange={(v) => setLinks("doctors", v)} />
            </Panel>
          ) : null}
          {active === "facilities" ? (
            <ListPanel
              title="Facilities & Technology"
              itemName="facility point"
              textOptional
              emptyText="No facilities added."
              value={page.facilities}
              onChange={(v) => set("facilities", { ...page.facilities, ...v })}
              extra={
                <Grid>
                  <ImageField
                    label="Feature image"
                    url={page.facilities.image_url}
                    onChange={(url) => set("facilities", { ...page.facilities, image_url: url })}
                    onUpload={onUpload}
                  />
                  <Field
                    label="Feature image alt text"
                    wide
                    count={[page.facilities.image_alt.length, 160]}
                  >
                    <Input
                      value={page.facilities.image_alt}
                      maxLength={160}
                      onChange={(e) =>
                        set("facilities", { ...page.facilities, image_alt: e.target.value })
                      }
                    />
                  </Field>
                </Grid>
              }
            />
          ) : null}
          {active === "approach" ? (
            <ListPanel
              title="The Millennium Approach"
              itemName="principle"
              titleLabel="Main statement"
              emptyText="No principles added."
              value={page.approach}
              onChange={(v) => set("approach", v)}
              titleHelp="One line per row. The last row is shown in navy."
            />
          ) : null}
          {active === "faqs" ? (
            <Panel
              title="FAQs"
              description="Choose existing FAQs for this department page. FAQ wording is edited in the FAQ area. Changes are saved with the draft and appear on the public page only after Publish. The section is hidden when none are selected."
            >
              <Toggle
                label="Show the FAQ section"
                checked={page.faqs.enabled}
                onChange={(v) => set("faqs", { enabled: v })}
              />
              <LinkManager kind="faq" ids={(page.links ?? { doctors: [], faqs: [], media: [] }).faqs} onChange={(v) => setLinks("faqs", v)} />
            </Panel>
          ) : null}
          {active === "media" ? (
            <Panel
              title="Media"
              description="Choose existing Media & Content items for this department page. Removing an item never deletes it. Changes are saved with the draft and appear on the public page only after Publish. The section is hidden when none are selected."
            >
              <Toggle
                label="Show the media section"
                checked={page.media.enabled}
                onChange={(v) => set("media", { enabled: v })}
              />
              <LinkManager kind="media" ids={(page.links ?? { doctors: [], faqs: [], media: [] }).media} onChange={(v) => setLinks("media", v)} />
            </Panel>
          ) : null}
          {active === "seo" ? (
            <SeoPanel
              page={page}
              identity={identity}
              cardImage={row["card_image_url"]}
              onChange={(v) => set("seo", v)}
              onUpload={onUpload}
            />
          ) : null}
          {active === "publishing" ? (
            <Panel
              title="Publishing"
              description="Saving a draft never changes the public page. Publishing copies the saved content to the website."
            >
              <dl className="grid gap-4 border border-border p-4 sm:grid-cols-3">
                <Meta label="Current status" value={published ? "Published" : "Draft"} />
                <Meta label="Last saved" value={formatDate(row["page_draft_saved_at"])} />
                <Meta label="Last published" value={formatDate(row["page_published_at"])} />
              </dl>
              {hasDraftChanges ? (
                <p className="text-sm text-muted-foreground">
                  The saved draft differs from the published page.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => saveDraft.mutate()}
                >
                  Save Draft
                </Button>
                <Button asChild variant="outline">
                  <a
                    href={`/departments/${row["slug"]}?preview=1`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="size-4" /> Preview
                  </a>
                </Button>
                {canPublish ? (
                  <>
                    <Button type="button" disabled={busy} onClick={() => publish.mutate()}>
                      <Send className="size-4" /> Publish
                    </Button>
                    {published ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="text-destructive"
                        disabled={busy}
                        onClick={() => unpublish.mutate()}
                      >
                        Unpublish
                      </Button>
                    ) : null}
                  </>
                ) : (
                  <p className="self-center text-sm text-muted-foreground">
                    Your role can save drafts. Publishing is done by an editor or admin.
                  </p>
                )}
              </div>
            </Panel>
          ) : null}

          <div className="mt-8 flex justify-between gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="ghost"
              disabled={index <= 0}
              onClick={() => goto(SECTIONS[index - 1]!.key)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={index >= SECTIONS.length - 1}
              onClick={() => goto(SECTIONS[index + 1]!.key)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function formatDate(v: unknown) {
  if (!v || typeof v !== "string") return "Never";
  return new Date(v).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-5">
      <header className="border-b border-border pb-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function SubHeading({ title, toggle }: { title: string; toggle?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
      <h4 className="font-semibold">{title}</h4>
      {toggle}
    </div>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function Field({
  label,
  help,
  required,
  wide,
  count,
  children,
}: {
  label: string;
  help?: string | undefined;
  required?: boolean;
  wide?: boolean;
  count?: [number, number];
  children: ReactNode;
}) {
  return (
    <div className={cn("grid gap-1.5", wide && "md:col-span-2")}>
      <div className="flex items-baseline justify-between gap-3">
        <Label>
          {label}
          {required ? <span className="text-brand-accent"> *</span> : null}
        </Label>
        {count ? (
          <span
            className={cn(
              "text-xs tabular-nums",
              count[0] > count[1] ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {count[0]}/{count[1]}
          </span>
        ) : null}
      </div>
      {children}
      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex min-h-10 cursor-pointer items-center gap-2.5 text-sm font-medium">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      {label ?? (checked ? "Section enabled" : "Section disabled")}
    </label>
  );
}

function ListPanel({
  title,
  itemName,
  emptyText,
  value,
  onChange,
  nameLabel = "Title",
  titleLabel = "Section title",
  titleHelp,
  introHelp,
  textOptional,
  extra,
}: {
  title: string;
  itemName: string;
  emptyText: string;
  value: ListSection;
  onChange: (v: ListSection) => void;
  nameLabel?: string;
  titleLabel?: string;
  titleHelp?: string;
  introHelp?: string;
  textOptional?: boolean;
  extra?: ReactNode;
}) {
  const items = value.items;
  const setItems = (next: PageItem[]) => onChange({ ...value, items: next });
  const move = (i: number, d: -1 | 1) => {
    const next = [...items];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x!);
    setItems(next);
  };
  return (
    <Panel
      title={title}
      description="Only enabled items with a title appear on the public page. The section is hidden when it has no content."
    >
      <Toggle checked={value.enabled} onChange={(v) => onChange({ ...value, enabled: v })} />
      <Grid>
        <Field label="Section label">
          <Input
            value={value.label}
            onChange={(e) => onChange({ ...value, label: e.target.value })}
          />
        </Field>
        <Field label={titleLabel} help={titleHelp}>
          <Textarea
            rows={2}
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
          />
        </Field>
        <Field label="Introduction" wide help={introHelp}>
          <Textarea
            rows={3}
            value={value.intro}
            onChange={(e) => onChange({ ...value, intro: e.target.value })}
          />
        </Field>
      </Grid>
      {extra}
      <SubHeading
        title={`${itemName.charAt(0).toUpperCase()}${itemName.slice(1)}s (${items.length})`}
      />
      {items.length ? (
        <ol className="grid border-t border-border">
          {items.map((item, i) => (
            <li
              key={item.id}
              className={cn(
                "grid gap-3 border-b border-border py-4 md:grid-cols-[2rem_minmax(0,1fr)_auto]",
                !item.enabled && "opacity-60",
              )}
            >
              <span className="font-heading text-sm font-semibold tabular-nums text-brand-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="grid gap-2">
                <Input
                  aria-label={`${itemName} ${i + 1} ${nameLabel.toLowerCase()}`}
                  placeholder={nameLabel}
                  value={item.title}
                  onChange={(e) =>
                    setItems(
                      items.map((x) => (x.id === item.id ? { ...x, title: e.target.value } : x)),
                    )
                  }
                />
                <Textarea
                  aria-label={`${itemName} ${i + 1} description`}
                  rows={2}
                  placeholder={textOptional ? "Short description (optional)" : "Short description"}
                  value={item.text}
                  onChange={(e) =>
                    setItems(
                      items.map((x) => (x.id === item.id ? { ...x, text: e.target.value } : x)),
                    )
                  }
                />
              </div>
              <div className="flex flex-wrap items-start gap-1 md:flex-col md:items-end">
                <Toggle
                  label={item.enabled ? "Enabled" : "Disabled"}
                  checked={item.enabled}
                  onChange={(v) =>
                    setItems(items.map((x) => (x.id === item.id ? { ...x, enabled: v } : x)))
                  }
                />
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Move up"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Move down"
                    disabled={i === items.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove ${itemName}`}
                    className="text-destructive"
                    onClick={() => setItems(items.filter((x) => x.id !== item.id))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="border border-dashed border-border p-5 text-sm text-muted-foreground">
          {emptyText}
        </p>
      )}
      <div>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setItems([...items, { id: newItemId(), title: "", text: "", enabled: true }])
          }
        >
          <Plus className="size-4" /> Add {itemName}
        </Button>
      </div>
    </Panel>
  );
}

function ImageField({
  label,
  url,
  onChange,
  onUpload,
  fallbackNote,
}: {
  label: string;
  url: string;
  onChange: (url: string) => void;
  onUpload: (url: string) => void;
  fallbackNote?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const upload = async (file?: File) => {
    if (!file) return;
    if (!allowedImageTypes.includes(file.type))
      return setMessage("Please upload a JPG, PNG, or WebP image.");
    if (file.size > maxImageBytes)
      return setMessage("Image is too large. Please upload a smaller image (up to 5 MB).");
    setMessage(null);
    setBusy(true);
    try {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${imageFolder}/${crypto.randomUUID()}/page.${ext}`;
      const { error } = await supabase.storage
        .from(imageBucket)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const next = `${imageEndpoint}?path=${encodeURIComponent(path)}`;
      const check = await fetch(next, { cache: "no-store" });
      if (!check.ok) {
        await supabase.storage.from(imageBucket).remove([path]);
        throw new Error("The uploaded image could not be verified.");
      }
      onUpload(next);
      onChange(next);
    } catch (cause) {
      setMessage(userFacingDataError(cause));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };
  return (
    <div className="grid gap-2 md:col-span-2">
      <Label>{label}</Label>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="grid h-28 w-44 shrink-0 place-items-center overflow-hidden border border-border bg-secondary">
          {url ? (
            <img src={url} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground" aria-hidden />
          )}
        </div>
        <div className="grid gap-2">
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => void upload(e.target.files?.[0])}
            aria-label={`Upload ${label.toLowerCase()}`}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => input.current?.click()}
            >
              <Upload className="size-4" /> {busy ? "Uploading…" : url ? "Replace" : "Upload"}
            </Button>
            {url ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                onClick={() => onChange("")}
              >
                <Trash2 className="size-4" /> Remove
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            JPG, PNG or WebP, up to 5 MB. The previous image is deleted only after a successful
            save.{fallbackNote ? ` ${fallbackNote}` : ""}
          </p>
          {message ? (
            <p className="text-xs text-destructive" role="alert">
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SeoPanel({
  page,
  identity,
  cardImage,
  onChange,
  onUpload,
}: {
  page: DepartmentPage;
  identity: Identity;
  cardImage: string | null;
  onChange: (v: DepartmentPage["seo"]) => void;
  onUpload: (url: string) => void;
}) {
  const seo = page.seo;
  const title = seo.title || `${identity.name} | The Millennium Hospital`;
  const description = seo.description || identity.short_description || identity.description;
  const checks: { ok: boolean; text: string }[] = [
    {
      ok: title.length >= 30 && title.length <= 60,
      text: `SEO title is ${title.length} characters (recommended 30–60)${seo.title ? "" : " — using the default"}.`,
    },
    {
      ok: description.length >= 70 && description.length <= 160,
      text: `Meta description is ${description.length} characters (recommended 70–160)${seo.description ? "" : " — using the default"}.`,
    },
    {
      ok: Boolean(seo.canonical_url),
      text: seo.canonical_url ? "Canonical URL is set." : "No canonical URL set.",
    },
    {
      ok: Boolean(seo.og_image_url || page.hero.image_url || cardImage),
      text: seo.og_image_url
        ? "OG image is set."
        : page.hero.image_url || cardImage
          ? "No OG image set — the hero or card image is used."
          : "No OG image available.",
    },
    {
      ok: seo.index,
      text: seo.index
        ? "Search engines may index this page."
        : "This page asks search engines not to index it.",
    },
  ];
  return (
    <Panel
      title="SEO"
      description="Leave fields empty to use sensible defaults from the department details."
    >
      <Grid>
        <Field label="SEO title" wide count={[seo.title.length, 60]}>
          <Input
            value={seo.title}
            placeholder={`${identity.name} | The Millennium Hospital`}
            onChange={(e) => onChange({ ...seo, title: e.target.value })}
          />
        </Field>
        <Field label="Meta description" wide count={[seo.description.length, 160]}>
          <Textarea
            rows={3}
            value={seo.description}
            placeholder={identity.short_description || identity.description}
            onChange={(e) => onChange({ ...seo, description: e.target.value })}
          />
        </Field>
        <Field
          label="Canonical URL"
          wide
          help="Full https address of this page on the live website."
        >
          <Input
            value={seo.canonical_url}
            placeholder="https://"
            onChange={(e) => onChange({ ...seo, canonical_url: e.target.value.trim() })}
          />
        </Field>
        <ImageField
          label="OG image (social sharing)"
          url={seo.og_image_url}
          onChange={(url) => onChange({ ...seo, og_image_url: url })}
          onUpload={onUpload}
          fallbackNote="Without one, the hero or card image is used."
        />
      </Grid>
      <Toggle
        label="Allow search engines to index this page"
        checked={seo.index}
        onChange={(v) => onChange({ ...seo, index: v })}
      />
      <SubHeading title="Checks" />
      <ul className="grid gap-2">
        {checks.map((c) => (
          <li key={c.text} className="flex items-start gap-2 text-sm">
            {c.ok ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            ) : (
              <Circle className="mt-0.5 size-4 shrink-0 text-brand-accent" />
            )}
            <span className={c.ok ? "" : "text-foreground"}>{c.text}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ---------- Relationship managers (existing records only) ---------- */

type LinkRow = {
  id: string;
  order: number;
  title: string;
  sub: string;
  image: string | null;
  status: string;
};

const move = (list: string[], i: number, d: -1 | 1) => {
  const next = [...list];
  const [x] = next.splice(i, 1);
  next.splice(i + d, 0, x!);
  return next;
};

function LinkedList({
  rows,
  empty,
  onMove,
  onRemove,
  removeLabel,
  busy,
}: {
  rows: LinkRow[];
  empty: ReactNode;
  onMove: (i: number, d: -1 | 1) => void;
  onRemove: (id: string) => void;
  removeLabel: string;
  busy: boolean;
}) {
  if (!rows.length)
    return (
      <div className="border border-dashed border-border p-5 text-sm text-muted-foreground">
        {empty}
      </div>
    );
  return (
    <ol className="grid border-t border-border">
      {rows.map((r, i) => (
        <li key={r.id} className="flex flex-wrap items-center gap-3 border-b border-border py-3">
          <span className="w-6 font-heading text-sm tabular-nums text-brand-accent">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="grid size-12 shrink-0 place-items-center overflow-hidden bg-secondary">
            {r.image ? (
              <img src={r.image} alt="" className="size-full object-cover" loading="lazy" />
            ) : (
              <UserRound className="size-5 text-muted-foreground" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{r.title}</p>
            {r.sub ? <p className="truncate text-sm text-muted-foreground">{r.sub}</p> : null}
          </div>
          <StatusBadge status={r.status} tone={r.status === "Published" ? "positive" : "neutral"} />
          <div className="flex gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Move up"
              disabled={busy || i === 0}
              onClick={() => onMove(i, -1)}
            >
              <ArrowUp className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Move down"
              disabled={busy || i === rows.length - 1}
              onClick={() => onMove(i, 1)}
            >
              <ArrowDown className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={removeLabel}
              className="text-destructive"
              disabled={busy}
              onClick={() => onRemove(r.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Picker({
  options,
  placeholder,
  onAdd,
  busy,
  label,
}: {
  options: { id: string; label: string }[];
  placeholder: string;
  onAdd: (id: string) => void;
  busy: boolean;
  label: string;
}) {
  const [value, setValue] = useState("");
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <select
        aria-label={label}
        className="h-10 min-w-0 flex-1 border border-input bg-background px-3 text-sm"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      >
        <option value="">{options.length ? placeholder : "Nothing left to link"}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant="outline"
        disabled={!value || busy}
        onClick={() => {
          onAdd(value);
          setValue("");
        }}
      >
        <Plus className="size-4" /> {label}
      </Button>
    </div>
  );
}

/** Staged selection of existing doctors. Saved with the draft; live only after Publish. */
function SpecialistsManager({ ids, onChange }: { ids: string[]; onChange: (ids: string[]) => void }) {
  const data = useQuery({
    queryKey: ["admin-department-doctor-options"],
    queryFn: async () => {
      const { data, error } = await db
        .from("doctors")
        .select("id, name, photo_url, designation, specialty, published")
        .order("name");
      if (error) throw error;
      return data as any[];
    },
  });
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  if (data.isPending) return <p className="text-sm text-muted-foreground">Loading specialists…</p>;
  if (data.isError) return <AdminDataError error={data.error} />;
  const byId = new Map(data.data.map((d) => [d.id, d]));
  const rows: LinkRow[] = ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((d, i) => ({
      id: d.id,
      order: i,
      title: d.name,
      sub: [d.designation, d.specialty].filter(Boolean).join(" · "),
      image: d.photo_url,
      status: d.published ? "Published" : "Draft",
    }));
  const linked = new Set(ids);
  return (
    <div className="grid gap-4">
      <LinkedList
        rows={rows}
        busy={false}
        removeLabel="Remove doctor from this page"
        empty={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>No specialists are selected for this department page.</span>
            <Button asChild variant="outline" size="sm">
              <Link to="/_admin/doctors">Manage Doctors</Link>
            </Button>
          </div>
        }
        onMove={(i, d) => onChange(move(ids, i, d))}
        onRemove={(id) => setPendingRemove(id)}
      />
      {pendingRemove ? (
        <InlineDelete
          label="link"
          description={`${byId.get(pendingRemove)?.name ?? "This doctor"} will be removed from this department page when the draft is saved and published. The doctor profile itself is not changed.`}
          onConfirm={() => {
            onChange(ids.filter((x) => x !== pendingRemove));
            setPendingRemove(null);
          }}
        />
      ) : null}
      <Picker
        label="Link Existing Doctor"
        placeholder="Choose a doctor…"
        busy={false}
        options={data.data
          .filter((d) => !linked.has(d.id))
          .map((d) => ({ id: d.id, label: `${d.name}${d.published ? "" : " (draft)"}` }))}
        onAdd={(id) => onChange([...ids, id])}
      />
    </div>
  );
}

/** Staged selection of existing FAQs or media. Removing never deletes the underlying record. */
function LinkManager({
  kind,
  ids,
  onChange,
}: {
  kind: "faq" | "media";
  ids: string[];
  onChange: (ids: string[]) => void;
}) {
  const cfg =
    kind === "faq"
      ? {
          source: "faqs",
          select: "id, question, published",
          title: (r: any) => r.question,
          sub: () => "",
          image: () => null,
          label: "Link Existing FAQ",
          noun: "FAQ",
          empty: "No FAQs selected. The FAQ section is hidden on the public page.",
        }
      : {
          source: "media_items",
          select: "id, title, media_type, thumbnail_url, published",
          title: (r: any) => r.title,
          sub: (r: any) => String(r.media_type ?? "").replace(/^./, (c: string) => c.toUpperCase()),
          image: (r: any) => r.thumbnail_url ?? null,
          label: "Link Existing Media",
          noun: "media item",
          empty: "No media selected. The Media section is hidden on the public page.",
        };
  const data = useQuery({
    queryKey: ["admin-department-link-options", kind],
    queryFn: async () => {
      const { data, error } = await db.from(cfg.source).select(cfg.select).order("display_order");
      if (error) throw error;
      return data as any[];
    },
  });
  if (data.isPending) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (data.isError) return <AdminDataError error={data.error} />;
  const byId = new Map(data.data.map((r) => [r.id, r]));
  const rows: LinkRow[] = ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((r, i) => ({
      id: r.id,
      order: i,
      title: cfg.title(r),
      sub: cfg.sub(r),
      image: cfg.image(r),
      status: r.published ? "Published" : "Draft",
    }));
  const linked = new Set(ids);
  return (
    <div className="grid gap-4">
      {rows.some((r) => r.status !== "Published") ? (
        <p className="text-xs text-muted-foreground">
          Draft items stay hidden on the public page until they are published in their own area.
        </p>
      ) : null}
      <LinkedList
        rows={rows}
        busy={false}
        removeLabel={`Remove ${cfg.noun} from this page`}
        empty={cfg.empty}
        onMove={(i, d) => onChange(move(ids, i, d))}
        onRemove={(id) => onChange(ids.filter((x) => x !== id))}
      />
      <Picker
        label={cfg.label}
        placeholder={`Choose ${kind === "faq" ? "an FAQ" : "media"}…`}
        busy={false}
        options={data.data
          .filter((r) => !linked.has(r.id))
          .map((r) => ({ id: r.id, label: `${cfg.title(r)}${r.published ? "" : " (draft)"}` }))}
        onAdd={(id) => onChange([...ids, id])}
      />
    </div>
  );
}
