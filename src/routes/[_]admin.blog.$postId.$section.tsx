/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminShell } from "@/components/admin/admin-shell";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { AdminError } from "@/components/admin/ui";
import {
  InlineDelete,
  WorkspaceLayout,
  WorkspaceSaveBar,
  WorkspaceSection,
} from "@/components/admin/workspace";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAdminSession } from "@/hooks/use-admin-session";
import { supabase } from "@/integrations/supabase/client";
import { logAction } from "@/lib/audit";
import { userFacingDataError } from "@/lib/data/errors";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/_admin/blog/$postId/$section")({
  head: () => ({
    meta: [
      ...createPageMeta("Article workspace", "Write and manage a hospital article."),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BlogWorkspace,
});
const sections = [
  ["writing", "Writing"],
  ["media", "Media"],
  ["visualizations", "Data visualizations"],
  ["seo", "SEO"],
  ["social-preview", "Social preview"],
  ["engagement", "Engagement"],
  ["clinical-review", "Clinical review"],
  ["publishing", "Publishing"],
] as const;
type Section = (typeof sections)[number][0];
type ChartBlock = {
  id: string;
  type: "bar" | "line" | "pie";
  title: string;
  explanation: string;
  labels: string;
  values: string;
  unit: string;
  source: string;
  accessibilityText: string;
  caption: string;
  showLegend: boolean;
};
type Form = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  body_document: Record<string, unknown>;
  cover_image_url: string;
  featured_image_alt: string;
  featured_image_caption: string;
  seo_title: string;
  meta_description: string;
  canonical_url: string;
  focus_topic: string;
  related_keywords: string;
  search_intent: string;
  robots_index: boolean;
  og_title: string;
  og_description: string;
  og_image_url: string;
  engagement_enabled: boolean;
  comments_enabled: boolean;
  status: "draft" | "in_review" | "ready_to_publish" | "published";
  clinical_reviewer_id: string;
  clinical_review_status: "not_required" | "pending" | "approved" | "changes_requested";
  clinical_review_notes: string;
  visualizations: ChartBlock[];
};
const blank: Form = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  body_document: { type: "doc", content: [] },
  cover_image_url: "",
  featured_image_alt: "",
  featured_image_caption: "",
  seo_title: "",
  meta_description: "",
  canonical_url: "",
  focus_topic: "",
  related_keywords: "",
  search_intent: "",
  robots_index: true,
  og_title: "",
  og_description: "",
  og_image_url: "",
  engagement_enabled: true,
  comments_enabled: false,
  status: "draft",
  clinical_reviewer_id: "",
  clinical_review_status: "not_required",
  clinical_review_notes: "",
  visualizations: [],
};
const clone = (value: Form): Form => structuredClone(value);

function BlogWorkspace() {
  const { postId, section: rawSection } = Route.useParams();
  const section = (
    sections.some(([key]) => key === rawSection) ? rawSection : "writing"
  ) as Section;
  const isNew = postId === "new";
  const { can, profile } = useAdminSession();
  const canWrite = can("content.write");
  const canPublish = can("content.publish");
  const canReview = can("blog.review");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Form>(clone(blank));
  const [baseline, setBaseline] = useState<Form>(clone(blank));
  const [error, setError] = useState<string | null>(null);
  const post = useQuery({
    queryKey: ["admin-blog-post", postId],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", postId)
        .single();
      if (queryError) throw queryError;
      return data;
    },
  });
  const options = useQuery({
    queryKey: ["blog-workspace-options"],
    queryFn: async () => {
      const [media, doctors] = await Promise.all([
        supabase.from("media_items").select("id,title,url,thumbnail_url").order("title"),
        supabase.from("doctors").select("id,name").order("name"),
      ]);
      if (media.error) throw media.error;
      if (doctors.error) throw doctors.error;
      return { media: media.data ?? [], doctors: doctors.data ?? [] };
    },
  });
  useEffect(() => {
    if (!post.data) return;
    const row = post.data;
    const next: Form = {
      ...blank,
      ...row,
      excerpt: row.excerpt ?? "",
      body: row.body ?? "",
      body_document:
        typeof row.body_document === "object" &&
        row.body_document &&
        !Array.isArray(row.body_document)
          ? (row.body_document as Record<string, unknown>)
          : blank.body_document,
      cover_image_url: row.cover_image_url ?? "",
      featured_image_alt: row.featured_image_alt ?? "",
      featured_image_caption: row.featured_image_caption ?? "",
      seo_title: row.seo_title ?? "",
      meta_description: row.meta_description ?? "",
      canonical_url: row.canonical_url ?? "",
      focus_topic: row.focus_topic ?? "",
      related_keywords: row.related_keywords.join(", "),
      search_intent: row.search_intent ?? "",
      og_title: row.og_title ?? "",
      og_description: row.og_description ?? "",
      og_image_url: row.og_image_url ?? "",
      clinical_reviewer_id: row.clinical_reviewer_id ?? "",
      clinical_review_notes: row.clinical_review_notes ?? "",
      visualizations: Array.isArray(row.visualizations)
        ? (row.visualizations as unknown as ChartBlock[])
        : [],
    };
    setForm(next);
    setBaseline(clone(next));
  }, [post.data]);
  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const save = useMutation({
    mutationFn: async () => {
      const reviewOnly = section === "clinical-review" && canReview && !canWrite;
      if (reviewOnly) {
        const { error: reviewError } = await supabase
          .from("blog_posts")
          .update({
            clinical_review_status: form.clinical_review_status,
            clinical_review_notes: form.clinical_review_notes || null,
            clinical_reviewed_at: new Date().toISOString(),
          })
          .eq("id", postId);
        if (reviewError) throw reviewError;
        return postId;
      }
      const payload = {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt || null,
        body: form.body || null,
        body_document: form.body_document as any,
        cover_image_url: form.cover_image_url || null,
        featured_image_alt: form.featured_image_alt || null,
        featured_image_caption: form.featured_image_caption || null,
        seo_title: form.seo_title || null,
        meta_description: form.meta_description || null,
        canonical_url: form.canonical_url || null,
        focus_topic: form.focus_topic || null,
        related_keywords: form.related_keywords
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        search_intent: form.search_intent || null,
        robots_index: form.robots_index,
        og_title: form.og_title || null,
        og_description: form.og_description || null,
        og_image_url: form.og_image_url || null,
        engagement_enabled: form.engagement_enabled,
        comments_enabled: form.comments_enabled,
        clinical_reviewer_id: form.clinical_reviewer_id || null,
        visualizations: form.visualizations as any,
        ...(canPublish
          ? {
              status: form.status,
              published_at: form.status === "published" ? new Date().toISOString() : null,
            }
          : {}),
      };
      if (isNew) {
        const { data, error: createError } = await supabase
          .from("blog_posts")
          .insert(payload)
          .select("id")
          .single();
        if (createError) throw createError;
        return data.id;
      }
      const { error: updateError } = await supabase
        .from("blog_posts")
        .update(payload)
        .eq("id", postId);
      if (updateError) throw updateError;
      return postId;
    },
    onSuccess: async (savedId) => {
      setBaseline(clone(form));
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      await logAction({
        action: section === "clinical-review" ? "clinical_review" : isNew ? "create" : "update",
        entityTable: "blog_posts",
        entityId: savedId,
        summary: `${isNew ? "Created" : "Updated"} article: ${form.title}`,
      });
      if (isNew)
        void navigate({
          to: "/_admin/blog/$postId/$section",
          params: { postId: savedId, section: "writing" },
          replace: true,
        });
    },
    onError: (cause: Error) => setError(userFacingDataError(cause)),
  });
  const remove = useMutation({
    mutationFn: async () => {
      const { error: deleteError } = await supabase.from("blog_posts").delete().eq("id", postId);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => navigate({ to: "/_admin/blog" }),
    onError: (cause: Error) => setError(userFacingDataError(cause)),
  });
  const nav = sections.map(([key, label]) => ({
    key,
    label,
    link: (
      <Link to="/_admin/blog/$postId/$section" params={{ postId, section: key }}>
        {label}
      </Link>
    ),
  }));
  const isAssignedReviewer = canReview && profile?.doctor_id === post.data?.clinical_reviewer_id;
  return (
    <AdminShell
      title={isNew ? "New article" : form.title || "Article workspace"}
      description="Create accurate, readable content with review and publishing kept separate."
      requires={["content.write", "blog.review"]}
    >
      <WorkspaceLayout
        backLink={<Link to="/_admin/blog">All posts</Link>}
        sections={nav}
        active={section}
      >
        <AdminError message={error} />
        {section === "writing" ? <Writing form={form} set={set} /> : null}
        {section === "media" ? (
          <Media form={form} set={set} media={options.data?.media ?? []} />
        ) : null}
        {section === "visualizations" ? (
          <Visualizations
            value={form.visualizations}
            onChange={(value) => set("visualizations", value)}
          />
        ) : null}
        {section === "seo" ? <Seo form={form} set={set} /> : null}
        {section === "social-preview" ? <Social form={form} set={set} /> : null}
        {section === "engagement" ? <Engagement form={form} set={set} /> : null}
        {section === "clinical-review" ? (
          <Clinical
            form={form}
            set={set}
            doctors={options.data?.doctors ?? []}
            canWrite={canWrite}
            canReview={Boolean(isAssignedReviewer)}
          />
        ) : null}
        {section === "publishing" ? (
          <Publishing form={form} set={set} canPublish={canPublish} />
        ) : null}
        {!isNew && canWrite ? (
          <div className="mt-8">
            <InlineDelete
              label="article"
              description="This permanently removes this article, its comments, and its relationships."
              busy={remove.isPending}
              onConfirm={() => remove.mutate()}
            />
          </div>
        ) : null}
        <WorkspaceSaveBar
          busy={save.isPending}
          disabled={
            (section === "clinical-review" && !canWrite && !isAssignedReviewer) ||
            (!canWrite && section !== "clinical-review")
          }
          onCancel={() => {
            setForm(clone(baseline));
            setError(null);
          }}
          onSave={() => save.mutate()}
        />
      </WorkspaceLayout>
    </AdminShell>
  );
}

type Setter = <K extends keyof Form>(key: K, value: Form[K]) => void;
function TextField({
  label,
  value,
  onChange,
  help,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string;
  multiline?: boolean;
}) {
  const id = `blog-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {help ? <p className="mt-1 text-sm text-muted-foreground">{help}</p> : null}
      {multiline ? (
        <Textarea
          id={id}
          className="mt-2 min-h-28"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          id={id}
          className="mt-2"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}
function Writing({ form, set }: { form: Form; set: Setter }) {
  return (
    <WorkspaceSection
      title="Writing"
      description="Write the article for patients and families. Use headings to make longer content easy to scan."
    >
      <div className="grid gap-5">
        <TextField label="Article title" value={form.title} onChange={(v) => set("title", v)} />
        <TextField
          label="Web address"
          value={form.slug}
          onChange={(v) => set("slug", v)}
          help="Use a short, readable address with words separated by hyphens."
        />
        <TextField
          label="Summary"
          value={form.excerpt}
          onChange={(v) => set("excerpt", v)}
          multiline
        />
        <div>
          <Label>Article</Label>
          <RichTextEditor
            content={form.body_document}
            onChange={(json, html) => {
              set("body_document", json);
              set("body", html);
            }}
          />
        </div>
      </div>
    </WorkspaceSection>
  );
}
function Media({
  form,
  set,
  media,
}: {
  form: Form;
  set: Setter;
  media: { id: string; title: string; url: string; thumbnail_url: string | null }[];
}) {
  const options = media.flatMap((item) =>
    item.thumbnail_url || item.url
      ? [{ label: item.title, value: item.thumbnail_url || item.url }]
      : [],
  );
  return (
    <WorkspaceSection
      title="Article media"
      description="Choose reusable Media Library imagery. Removing it here never deletes the source asset."
    >
      <p className="border border-warning bg-warning/20 p-3 text-sm">
        Image upload is currently unavailable. You can select an existing Media Library image.
      </p>
      {form.cover_image_url ? (
        <img
          src={form.cover_image_url}
          alt={form.featured_image_alt || "Featured image preview"}
          className="max-h-96 w-full object-contain"
        />
      ) : null}
      <div>
        <Label>Featured image</Label>
        <Select
          value={
            options.some((o) => o.value === form.cover_image_url) ? form.cover_image_url : "none"
          }
          onValueChange={(v) => set("cover_image_url", v === "none" ? "" : v)}
        >
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No featured image</SelectItem>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <TextField
        label="Alternative text"
        value={form.featured_image_alt}
        onChange={(v) => set("featured_image_alt", v)}
        help="Describe what the image shows for people using screen readers."
      />
      <TextField
        label="Caption"
        value={form.featured_image_caption}
        onChange={(v) => set("featured_image_caption", v)}
      />
    </WorkspaceSection>
  );
}
function Seo({ form, set }: { form: Form; set: Setter }) {
  const checks = [
    { ok: Boolean(form.seo_title), text: "Add a unique search title." },
    { ok: form.seo_title.length <= 60, text: "Keep the search title at 60 characters or fewer." },
    { ok: Boolean(form.meta_description), text: "Add a search description." },
    {
      ok: form.meta_description.length <= 160,
      text: "Keep the description at 160 characters or fewer.",
    },
    { ok: Boolean(form.canonical_url), text: "Confirm the preferred page address." },
    { ok: Boolean(form.excerpt), text: "Add a clear article summary." },
    {
      ok: Boolean(form.cover_image_url && form.featured_image_alt),
      text: "Add a featured image and alternative text.",
    },
  ];
  return (
    <WorkspaceSection
      title="Search appearance"
      description="SEO helps Google understand this article. These checks identify missing information; they are not a score."
    >
      <div className="grid gap-5">
        <TextField
          label="SEO title"
          value={form.seo_title}
          onChange={(v) => set("seo_title", v)}
          help="Where is it used? Search result headlines. Write a clear, unique title."
        />
        <TextField
          label="Meta description"
          value={form.meta_description}
          onChange={(v) => set("meta_description", v)}
          multiline
          help="Where is it used? The short description shown under a search result."
        />
        <TextField
          label="Canonical URL"
          value={form.canonical_url}
          onChange={(v) => set("canonical_url", v)}
          help="The preferred full public address for this article."
        />
        <TextField
          label="Focus topic"
          value={form.focus_topic}
          onChange={(v) => set("focus_topic", v)}
        />
        <TextField
          label="Related keywords"
          value={form.related_keywords}
          onChange={(v) => set("related_keywords", v)}
          help="Separate phrases with commas. Use only topics actually covered by the article."
        />
        <TextField
          label="Search intent"
          value={form.search_intent}
          onChange={(v) => set("search_intent", v)}
          help="What question should this article answer?"
        />
        <label className="flex items-center gap-3 border border-border p-4">
          <Checkbox
            checked={form.robots_index}
            onCheckedChange={(v) => set("robots_index", v === true)}
          />
          <span>Allow search engines to index this article</span>
        </label>
      </div>
      <div className="border border-border p-4">
        <p className="font-semibold">SEO checks</p>
        <ul className="mt-3 grid gap-2 text-sm">
          {checks.map((check) => (
            <li
              key={check.text}
              className={check.ok ? "text-success-foreground" : "text-destructive"}
            >
              {check.ok ? "Ready: " : "Needs attention: "}
              {check.text}
            </li>
          ))}
        </ul>
      </div>
      <div className="border border-border bg-background p-4">
        <p className="text-sm text-primary">
          {form.canonical_url || `https://hospital.example/blog/${form.slug || "article"}`}
        </p>
        <p className="mt-1 text-xl text-primary">
          {form.seo_title || form.title || "Article title"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {form.meta_description || form.excerpt || "Search description preview"}
        </p>
      </div>
    </WorkspaceSection>
  );
}
function Social({ form, set }: { form: Form; set: Setter }) {
  return (
    <WorkspaceSection
      title="Social preview"
      description="Control how the article appears when shared. This is separate from the featured image."
    >
      <TextField
        label="Open Graph title"
        value={form.og_title}
        onChange={(v) => set("og_title", v)}
      />
      <TextField
        label="Open Graph description"
        value={form.og_description}
        onChange={(v) => set("og_description", v)}
        multiline
      />
      <TextField
        label="Social sharing image"
        value={form.og_image_url}
        onChange={(v) => set("og_image_url", v)}
      />
      {form.og_image_url ? (
        <img
          src={form.og_image_url}
          alt="Social sharing preview"
          className="aspect-[1.91/1] w-full object-cover"
        />
      ) : null}
      <div className="border border-border bg-background">
        <div className="p-4">
          <p className="font-semibold">{form.og_title || form.title || "Article title"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {form.og_description || form.excerpt || "Article description"}
          </p>
        </div>
      </div>
    </WorkspaceSection>
  );
}
function Engagement({ form, set }: { form: Form; set: Setter }) {
  return (
    <WorkspaceSection
      title="Engagement"
      description="Readers must sign in to comment. Every new comment stays pending until a staff member approves it."
    >
      <label className="flex items-center gap-3 border border-border p-4">
        <Switch
          checked={form.engagement_enabled}
          onCheckedChange={(v) => set("engagement_enabled", v)}
        />
        <span>
          <span className="block font-medium">Likes and sharing</span>
          <span className="text-sm text-muted-foreground">
            Allow signed-in likes and standard sharing links.
          </span>
        </span>
      </label>
      <label className="flex items-center gap-3 border border-border p-4">
        <Switch
          checked={form.comments_enabled}
          onCheckedChange={(v) => set("comments_enabled", v)}
        />
        <span>
          <span className="block font-medium">Moderated comments</span>
          <span className="text-sm text-muted-foreground">
            Comments remain hidden until approved.
          </span>
        </span>
      </label>
    </WorkspaceSection>
  );
}
function Clinical({
  form,
  set,
  doctors,
  canWrite,
  canReview,
}: {
  form: Form;
  set: Setter;
  doctors: { id: string; name: string }[];
  canWrite: boolean;
  canReview: boolean;
}) {
  return (
    <WorkspaceSection
      title="Clinical review"
      description="Clinical approval checks accuracy. It does not publish the article."
    >
      {canWrite ? (
        <div>
          <Label>Clinical reviewer</Label>
          <Select
            value={form.clinical_reviewer_id || "none"}
            onValueChange={(v) => set("clinical_reviewer_id", v === "none" ? "" : v)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No reviewer</SelectItem>
              {doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <div>
        <Label>Review outcome</Label>
        <Select
          disabled={!canReview}
          value={form.clinical_review_status}
          onValueChange={(v) => set("clinical_review_status", v as Form["clinical_review_status"])}
        >
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Still reviewing</SelectItem>
            <SelectItem value="approved">Clinically approved</SelectItem>
            <SelectItem value="changes_requested">Changes requested</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <TextField
        label="Review notes"
        value={form.clinical_review_notes}
        onChange={(v) => canReview && set("clinical_review_notes", v)}
        multiline
      />
    </WorkspaceSection>
  );
}
function Publishing({ form, set, canPublish }: { form: Form; set: Setter; canPublish: boolean }) {
  return (
    <WorkspaceSection
      title="Publishing"
      description="Only Editors and Administrators can make an article public."
    >
      <div>
        <Label>Status</Label>
        <Select
          disabled={!canPublish}
          value={form.status}
          onValueChange={(v) => set("status", v as Form["status"])}
        >
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in_review">In review</SelectItem>
            <SelectItem value="ready_to_publish">Ready to publish</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
        {!canPublish ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Your edits keep the existing publication status unchanged.
          </p>
        ) : null}
      </div>
    </WorkspaceSection>
  );
}
function Visualizations({
  value,
  onChange,
}: {
  value: ChartBlock[];
  onChange: (value: ChartBlock[]) => void;
}) {
  const add = () =>
    onChange([
      ...value,
      {
        id: crypto.randomUUID(),
        type: "bar",
        title: "",
        explanation: "",
        labels: "",
        values: "",
        unit: "",
        source: "",
        accessibilityText: "",
        caption: "",
        showLegend: true,
      },
    ]);
  const update = (id: string, patch: Partial<ChartBlock>) =>
    onChange(value.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  return (
    <WorkspaceSection
      title="Data visualizations"
      description="Use only verified, author-supplied data. Patients should understand the chart without drawing new medical conclusions."
    >
      <Button type="button" variant="outline" className="w-fit" onClick={add}>
        Add chart
      </Button>
      {value.map((chart) => {
        const labels = chart.labels
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
        const numbers = chart.values.split(",").map((v) => Number(v.trim()));
        const data = labels.map((name, index) => ({
          name,
          value: Number.isFinite(numbers[index]) ? numbers[index] : 0,
        }));
        return (
          <div key={chart.id} className="grid gap-5 border border-border p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Chart type</Label>
                <Select
                  value={chart.type}
                  onValueChange={(v) => update(chart.id, { type: v as ChartBlock["type"] })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="pie">Pie / doughnut</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <TextField
                label="Title"
                value={chart.title}
                onChange={(v) => update(chart.id, { title: v })}
              />
              <TextField
                label="Labels"
                value={chart.labels}
                onChange={(v) => update(chart.id, { labels: v })}
                help="Comma-separated labels."
              />
              <TextField
                label="Values"
                value={chart.values}
                onChange={(v) => update(chart.id, { values: v })}
                help="Comma-separated numbers in the same order."
              />
              <TextField
                label="Unit"
                value={chart.unit}
                onChange={(v) => update(chart.id, { unit: v })}
              />
              <TextField
                label="Source or reference"
                value={chart.source}
                onChange={(v) => update(chart.id, { source: v })}
              />
              <TextField
                label="Short explanation"
                value={chart.explanation}
                onChange={(v) => update(chart.id, { explanation: v })}
                multiline
              />
              <TextField
                label="Accessibility text"
                value={chart.accessibilityText}
                onChange={(v) => update(chart.id, { accessibilityText: v })}
                multiline
              />
            </div>
            <div
              role="img"
              aria-label={chart.accessibilityText || chart.title || "Chart preview"}
              className="h-72 border border-border p-3"
            >
              <ResponsiveContainer width="100%" height="100%">
                {chart.type === "line" ? (
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line dataKey="value" stroke="var(--color-primary)" />
                  </LineChart>
                ) : chart.type === "pie" ? (
                  <PieChart>
                    <Tooltip />
                    <Legend />
                    <Pie
                      data={data}
                      dataKey="value"
                      nameKey="name"
                      fill="var(--color-primary)"
                      innerRadius={42}
                    />
                  </PieChart>
                ) : (
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="var(--color-primary)" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-fit text-destructive"
              onClick={() => onChange(value.filter((item) => item.id !== chart.id))}
            >
              Remove chart
            </Button>
          </div>
        );
      })}
    </WorkspaceSection>
  );
}
