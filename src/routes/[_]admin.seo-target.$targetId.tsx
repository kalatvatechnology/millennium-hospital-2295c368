import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  InlineDelete,
  WorkspaceLayout,
  WorkspaceSaveBar,
  WorkspaceSection,
} from "@/components/admin/workspace";
import { InlineNotice } from "@/components/admin/seo-ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingState } from "@/components/shared/page";
import { createPageMeta } from "@/lib/seo";
import { useAdminSession } from "@/hooks/use-admin-session";
import { userFacingDataError } from "@/lib/data/errors";
import {
  SEO_KEYWORD_CATEGORIES,
  SEO_SEARCH_INTENTS,
  SEO_TARGET_STATUSES,
  type SeoKeywordCategory,
  type SeoSearchIntent,
  type SeoTargetStatus,
} from "@/lib/seo/types";
import {
  deleteTargetKeyword,
  getTargetKeyword,
  listSeoRelationOptions,
  saveTargetKeyword,
  type TargetKeywordInput,
} from "@/lib/data/seo-repository";

export const Route = createFileRoute("/_admin/seo-target/$targetId")({
  head: () => ({
    meta: [
      ...createPageMeta("Target keyword", "Edit a target keyword and the page it belongs to."),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: TargetKeywordWorkspace,
});

const EMPTY: TargetKeywordInput = {
  keyword: "",
  keywordType: "general",
  searchIntent: "informational",
  priority: "primary",
  targetUrl: null,
  targetEntityType: null,
  departmentId: null,
  professionalServiceId: null,
  doctorId: null,
  locationId: null,
  blogPostId: null,
  status: "planned",
  notes: null,
};

const NONE = "__none__";

function TargetKeywordWorkspace() {
  const { targetId } = Route.useParams();
  const isNew = targetId === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = useAdminSession();
  const [draft, setDraft] = useState<TargetKeywordInput>(EMPTY);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const existing = useQuery({
    queryKey: ["seo-target", targetId],
    queryFn: () => getTargetKeyword(targetId),
    enabled: !isNew,
  });
  const options = useQuery({ queryKey: ["seo-relations"], queryFn: listSeoRelationOptions });

  useEffect(() => {
    if (existing.data)
      setDraft({
        id: existing.data.id,
        keyword: existing.data.keyword,
        keywordType: existing.data.keywordType,
        searchIntent: existing.data.searchIntent,
        priority: existing.data.priority,
        targetUrl: existing.data.targetUrl,
        targetEntityType: existing.data.targetEntityType,
        departmentId: existing.data.departmentId,
        professionalServiceId: existing.data.professionalServiceId,
        doctorId: existing.data.doctorId,
        locationId: existing.data.locationId,
        blogPostId: existing.data.blogPostId,
        status: existing.data.status,
        notes: existing.data.notes,
      });
  }, [existing.data]);

  const save = useMutation({
    mutationFn: () => saveTargetKeyword(draft),
    onSuccess: (id) => {
      void queryClient.invalidateQueries({ queryKey: ["seo-targets"] });
      void queryClient.invalidateQueries({ queryKey: ["seo-target", id] });
      setMessage({ tone: "success", text: "Target keyword saved." });
      if (isNew) void navigate({ to: "/_admin/seo-target/$targetId", params: { targetId: id } });
    },
    onError: (error) => setMessage({ tone: "error", text: userFacingDataError(error) }),
  });

  const remove = useMutation({
    mutationFn: () => deleteTargetKeyword(targetId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["seo-targets"] });
      void navigate({ to: "/_admin/seo-targets" });
    },
    onError: (error) => setMessage({ tone: "error", text: userFacingDataError(error) }),
  });

  const relation = (
    label: string,
    value: string | null,
    items: { id: string; label: string }[] | undefined,
    onChange: (next: string | null) => void,
  ) => (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select
        value={value ?? NONE}
        onValueChange={(next) => onChange(next === NONE ? null : next)}
        disabled={!can("seo.manage")}
      >
        <SelectTrigger>
          <SelectValue placeholder="Not linked" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Not linked</SelectItem>
          {(items ?? []).map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <AdminShell
      title={isNew ? "Add target keyword" : draft.keyword || "Target keyword"}
      description="Record a keyword your team wants to be found for, and the page it belongs to."
      requires="seo.read"
    >
      <WorkspaceLayout
        backLink={
          <Link to="/_admin/seo-targets">
            <ArrowLeft className="mr-2 size-4" /> All target keywords
          </Link>
        }
      >
        {!isNew && existing.isPending ? (
          <LoadingState />
        ) : (
          <div className="grid gap-8">
            {message ? <InlineNotice tone={message.tone}>{message.text}</InlineNotice> : null}

            <WorkspaceSection title="Keyword">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="target-keyword">Keyword or phrase</Label>
                  <Input
                    id="target-keyword"
                    value={draft.keyword}
                    disabled={!can("seo.manage")}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, keyword: event.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Keyword type</Label>
                  <Select
                    value={draft.keywordType}
                    disabled={!can("seo.manage")}
                    onValueChange={(next) =>
                      setDraft((prev) => ({ ...prev, keywordType: next as SeoKeywordCategory }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEO_KEYWORD_CATEGORIES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Search intent</Label>
                  <Select
                    value={draft.searchIntent}
                    disabled={!can("seo.manage")}
                    onValueChange={(next) =>
                      setDraft((prev) => ({ ...prev, searchIntent: next as SeoSearchIntent }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEO_SEARCH_INTENTS.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Select
                    value={draft.priority}
                    disabled={!can("seo.manage")}
                    onValueChange={(next) =>
                      setDraft((prev) => ({
                        ...prev,
                        priority: next === "secondary" ? "secondary" : "primary",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={draft.status}
                    disabled={!can("seo.manage")}
                    onValueChange={(next) =>
                      setDraft((prev) => ({ ...prev, status: next as SeoTargetStatus }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEO_TARGET_STATUSES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </WorkspaceSection>

            <WorkspaceSection
              title="Target page"
              description="Choose the page this keyword should lead people to."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="target-url">Target address</Label>
                  <Input
                    id="target-url"
                    placeholder="/services/professional/dental-implants"
                    value={draft.targetUrl ?? ""}
                    disabled={!can("seo.manage")}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, targetUrl: event.target.value || null }))
                    }
                  />
                </div>
                {relation("Department", draft.departmentId, options.data?.departments, (next) =>
                  setDraft((prev) => ({ ...prev, departmentId: next })),
                )}
                {relation(
                  "Professional service",
                  draft.professionalServiceId,
                  options.data?.professionalServices,
                  (next) => setDraft((prev) => ({ ...prev, professionalServiceId: next })),
                )}
                {relation("Doctor", draft.doctorId, options.data?.doctors, (next) =>
                  setDraft((prev) => ({ ...prev, doctorId: next })),
                )}
                {relation("Location", draft.locationId, options.data?.locations, (next) =>
                  setDraft((prev) => ({ ...prev, locationId: next })),
                )}
                {relation("Blog article", draft.blogPostId, options.data?.blogPosts, (next) =>
                  setDraft((prev) => ({ ...prev, blogPostId: next })),
                )}
              </div>
            </WorkspaceSection>

            <WorkspaceSection title="Notes">
              <Textarea
                rows={4}
                value={draft.notes ?? ""}
                disabled={!can("seo.manage")}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, notes: event.target.value || null }))
                }
              />
            </WorkspaceSection>

            <WorkspaceSection
              title="Google search performance"
              description="Google Search Console is not connected, so no ranking or search data is shown for this keyword."
            >
              <p className="text-sm text-muted-foreground">No data.</p>
            </WorkspaceSection>

            {can("seo.manage") ? (
              <>
                {!isNew ? (
                  <InlineDelete
                    label="target keyword"
                    description="This removes the keyword from your target list. Website content is not changed."
                    busy={remove.isPending}
                    onConfirm={() => remove.mutate()}
                  />
                ) : null}
                <WorkspaceSaveBar
                  busy={save.isPending}
                  disabled={!draft.keyword.trim()}
                  onSave={() => save.mutate()}
                  onCancel={() => navigate({ to: "/_admin/seo-targets" })}
                />
              </>
            ) : null}
          </div>
        )}
      </WorkspaceLayout>
    </AdminShell>
  );
}
