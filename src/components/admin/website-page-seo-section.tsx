/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, AlertTriangle, ImagePlus, Images, Sparkles, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceSection } from "@/components/admin/workspace";
import { siteConfig } from "@/config/site";
import { userFacingDataError } from "@/lib/data/errors";
import {
  PAGE_DESCRIPTION_RANGE,
  PAGE_TITLE_RANGE,
  canonicalUrlError,
  pagePublicUrl,
  pageSeoChecks,
  resolvePageCanonical,
  suggestPageDescription,
  suggestPageTitle,
} from "@/lib/website-page-seo";

const db = supabase as any;
const bucket = "doctor-profile-images";
const endpoint = "/api/public/doctor-profile-image";
const allowed = ["image/jpeg", "image/png", "image/webp"];
const mediaSrc = (m: { url?: string | null; thumbnail_url?: string | null }) => m.thumbnail_url || m.url || "";

type Props = {
  values: Record<string, any>;
  set: (name: string, value: any) => void;
};

function Count({ value, range }: { value: string; range: readonly [number, number] }) {
  const n = value.trim().length;
  const ok = n >= range[0] && n <= range[1];
  return (
    <span aria-live="polite" className={ok ? "text-primary" : n > range[1] ? "text-destructive" : ""}>
      {n} / {range[1]} characters · recommended {range[0]}–{range[1]}
    </span>
  );
}

/** Website Page → SEO. Every value lives on the same website_pages row. */
export function WebsitePageSeoSection({ values, set }: Props) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const title = String(values["meta_title"] ?? "");
  const desc = String(values["meta_description"] ?? "");
  const canonical = String(values["canonical_url"] ?? "");
  const ogTitle = String(values["og_title"] ?? "");
  const ogDesc = String(values["og_description"] ?? "");
  const ogMediaId = String(values["og_media_id"] ?? "");
  const published = values["status"] === "published";
  const publicUrl = pagePublicUrl(values["slug"]);
  const suggestedTitle = suggestPageTitle(values["title"]);
  const suggestedDesc = suggestPageDescription(values["body"], values["title"]);
  const canonicalError = canonicalUrlError(canonical);

  const library = useQuery({
    queryKey: ["website-page-og-library"],
    enabled: picking || Boolean(ogMediaId),
    queryFn: async () => {
      const { data, error } = await db
        .from("media_items")
        .select("id,title,url,thumbnail_url,alt_text")
        .eq("media_type", "image")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as { id: string; title: string; url: string; thumbnail_url: string | null; alt_text: string | null }[];
    },
  });
  const selected = library.data?.find((m) => m.id === ogMediaId) ?? null;

  const upload = async (file?: File) => {
    if (!file) return;
    if (!allowed.includes(file.type)) return setMessage("Please upload a JPG, PNG, or WebP image.");
    if (file.size > 5 * 1024 * 1024) return setMessage("Image is too large (up to 5 MB).");
    setMessage(null);
    setBusy(true);
    try {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `media/${crypto.randomUUID()}/card.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const url = `${endpoint}?path=${encodeURIComponent(path)}`;
      const name = `${String(values["title"] || "Website page")} — Open Graph / Social Sharing`;
      // A normal Media & Content asset; the page only links to it.
      const { data, error: insertError } = await db
        .from("media_items")
        .insert({ title: name, media_type: "image", url, thumbnail_url: url, alt_text: name, published: true, show_on_home: false })
        .select("id")
        .single();
      if (insertError) {
        await supabase.storage.from(bucket).remove([path]);
        throw insertError;
      }
      await queryClient.invalidateQueries({ queryKey: ["website-page-og-library"] });
      set("og_media_id", data.id);
      setPicking(false);
    } catch (cause) {
      setMessage(userFacingDataError(cause as Error));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const checks = pageSeoChecks({ ...values } as any);
  const shownTitle = ogTitle.trim() || title.trim() || String(values["title"] ?? "");
  const shownDesc = ogDesc.trim() || desc.trim();

  return (
    <WorkspaceSection
      className="mt-10"
      title="SEO"
      description="Search and social sharing details for this page. Saved together with the content above."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="page-seo-title">SEO title</Label>
            {suggestedTitle ? (
              <Button type="button" size="sm" variant="ghost" onClick={() => set("meta_title", suggestedTitle)}>
                <Sparkles className="size-4" /> Suggested
              </Button>
            ) : null}
          </div>
          <Input id="page-seo-title" className="mt-2" value={title} onChange={(e) => set("meta_title", e.target.value)} />
          <p className="mt-1 text-xs text-muted-foreground"><Count value={title} range={PAGE_TITLE_RANGE} /></p>
        </div>

        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="page-seo-description">Meta description</Label>
            {suggestedDesc ? (
              <Button type="button" size="sm" variant="ghost" onClick={() => set("meta_description", suggestedDesc)}>
                <Sparkles className="size-4" /> Suggested
              </Button>
            ) : null}
          </div>
          <Textarea id="page-seo-description" className="mt-2 min-h-24" value={desc} onChange={(e) => set("meta_description", e.target.value)} />
          <p className="mt-1 text-xs text-muted-foreground"><Count value={desc} range={PAGE_DESCRIPTION_RANGE} /></p>
          <p className="mt-1 text-xs text-muted-foreground">Suggestions use only this page's title and written content.</p>
        </div>

        <div className="lg:col-span-2">
          <Label htmlFor="page-seo-canonical">Canonical URL</Label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              id="page-seo-canonical"
              placeholder={publicUrl ?? "https://"}
              value={canonical}
              onChange={(e) => set("canonical_url", e.target.value)}
            />
            <Button type="button" variant="outline" disabled={!publicUrl} onClick={() => set("canonical_url", "")}>
              Use Public URL
            </Button>
          </div>
          {canonicalError ? (
            <p className="mt-1 text-xs text-destructive">{canonicalError}</p>
          ) : !canonical.trim() ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Automatic canonical: using this page's public URL{publicUrl ? ` (${publicUrl})` : ""}.
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">Custom canonical URL.</p>
          )}
        </div>

        <div>
          <Label htmlFor="page-og-title">Open Graph title</Label>
          <Input id="page-og-title" className="mt-2" placeholder={title || "Uses the SEO title"} value={ogTitle} onChange={(e) => set("og_title", e.target.value)} />
          <p className="mt-1 text-xs text-muted-foreground">Empty = uses the SEO title.</p>
        </div>
        <div>
          <Label htmlFor="page-og-description">Open Graph description</Label>
          <Textarea id="page-og-description" className="mt-2 min-h-20" placeholder={desc || "Uses the meta description"} value={ogDesc} onChange={(e) => set("og_description", e.target.value)} />
          <p className="mt-1 text-xs text-muted-foreground">Empty = uses the meta description.</p>
        </div>

        <div className="lg:col-span-2">
          <Label>Open Graph image</Label>
          <p className="mt-1 text-xs text-muted-foreground">Recommended 1200 × 630 px. Images come from Media & Content.</p>
          <input ref={fileRef} type="file" accept={allowed.join(",")} className="sr-only" onChange={(e) => void upload(e.target.files?.[0])} />
          {ogMediaId ? (
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
              {selected ? (
                <img src={mediaSrc(selected)} alt={selected.alt_text ?? selected.title} className="aspect-[1200/630] w-full max-w-sm rounded-md border border-border object-cover" />
              ) : (
                <div className="flex aspect-[1200/630] w-full max-w-sm items-center justify-center rounded-md border border-border text-sm text-muted-foreground">Loading…</div>
              )}
              <div className="grid gap-2">
                {selected ? <p className="text-sm font-medium">{selected.title}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setPicking(true)}>Change</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => set("og_media_id", "")}>
                    <Trash2 className="size-4" /> Remove
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No image selected.</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPicking((p) => !p)}>
              <Images className="size-4" /> Choose Existing Image
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
              <ImagePlus className="size-4" /> {busy ? "Uploading…" : "Upload New Image"}
            </Button>
          </div>
          {message ? <p role="alert" className="mt-1 text-xs text-destructive">{message}</p> : null}
          {picking ? (
            <div className="mt-3 max-h-80 overflow-y-auto rounded-md border border-border p-3">
              {library.isPending ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : !library.data?.length ? (
                <p className="text-sm text-muted-foreground">No images in Media & Content yet. Upload a new image.</p>
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {library.data.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => { set("og_media_id", m.id); setPicking(false); }}
                        className={`w-full rounded-md border p-1 text-left ${m.id === ogMediaId ? "border-primary" : "border-border hover:border-primary/40"}`}
                      >
                        <img src={mediaSrc(m)} alt={m.alt_text ?? m.title} className="aspect-[1200/630] w-full rounded object-cover" loading="lazy" />
                        <span className="mt-1 block truncate text-xs">{m.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-2">
          <label htmlFor="page-seo-index" className="flex items-center gap-3 border border-border p-4">
            <Checkbox
              id="page-seo-index"
              disabled={!published}
              checked={published && values["robots_index"] !== false}
              onCheckedChange={(c) => set("robots_index", c === true)}
            />
            <span className="font-medium">Allow search engines to index this page</span>
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            {!published
              ? "Draft pages are never public or indexable. Indexing applies once the page is published."
              : values["robots_index"] === false
                ? "Indexing is off: the public page tells search engines not to list it."
                : "Search engines may list this page."}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold">Search preview</h3>
          <p className="text-xs text-muted-foreground">Approximate — search engines may display it differently.</p>
          <div className="mt-2 rounded-md border border-border p-4">
            <p className="truncate text-xs text-muted-foreground">{resolvePageCanonical(canonical, values["slug"]) ?? siteConfig.url}</p>
            <p className="mt-1 line-clamp-1 text-lg text-primary">{title.trim() || String(values["title"] ?? "") || "Page title"}</p>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{desc.trim() || "No meta description yet."}</p>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Social sharing preview</h3>
          <p className="text-xs text-muted-foreground">Approximate — each app shows links in its own style.</p>
          <div className="mt-2 overflow-hidden rounded-md border border-border">
            {selected ? (
              <img src={mediaSrc(selected)} alt="" className="aspect-[1200/630] w-full object-cover" />
            ) : (
              <div className="flex aspect-[1200/630] w-full items-center justify-center bg-muted text-sm text-muted-foreground">No image</div>
            )}
            <div className="p-3">
              <p className="text-xs uppercase text-muted-foreground">{new URL(siteConfig.url).hostname}</p>
              <p className="line-clamp-1 font-semibold">{shownTitle || "Page title"}</p>
              <p className="line-clamp-2 text-sm text-muted-foreground">{shownDesc || "No description yet."}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold">SEO health</h3>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {checks.map((c) => (
            <li key={c.label} className="flex gap-2 text-sm">
              {c.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />}
              <span>
                {c.label}
                {!c.ok && c.fix ? <span className="block text-xs text-muted-foreground">Fix: {c.fix}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </WorkspaceSection>
  );
}
