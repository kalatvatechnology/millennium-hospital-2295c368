import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminError,
  ConfirmDialog,
  DataTable,
  FilterSelect,
  FormModal,
  Pagination,
  SearchField,
  StatusBadge,
  type Column,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
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
import { supabase } from "@/integrations/supabase/client";
import { useAdminSession } from "@/hooks/use-admin-session";
import { logAction } from "@/lib/audit";
import { createPageMeta } from "@/lib/seo";
import { backendFeatures } from "@/lib/data/backend";
import { AdminFeatureUnavailable } from "@/components/admin/feature-unavailable";

export const Route = createFileRoute("/_admin/blog")({
  head: () => ({
    meta: [
      ...createPageMeta("Blog", "Manage hospital articles and clinical review."),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminBlog,
});

type PostForm = {
  id: string | null;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_image_url: string;
  status: string;
  clinical_reviewer_id: string;
};

const emptyPost: PostForm = {
  id: null,
  slug: "",
  title: "",
  excerpt: "",
  body: "",
  cover_image_url: "",
  status: "draft",
  clinical_reviewer_id: "",
};

const PAGE_SIZE = 20;

function AdminBlog() {
  if (!backendFeatures.blog)
    return <AdminFeatureUnavailable title="Blog / resources" frontendReady />;
  return <AvailableAdminBlog />;
}

function AvailableAdminBlog() {
  const queryClient = useQueryClient();
  const { can, profile } = useAdminSession();
  const canWrite = can("content.write");
  const canPublish = can("content.publish");
  const canReview = can("blog.review");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<PostForm | null>(null);
  const [reviewing, setReviewing] = useState<{
    id: string;
    title: string;
    outcome: string;
    notes: string;
  } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const posts = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("blog_posts")
        .select(
          "id, slug, title, excerpt, body, cover_image_url, status, clinical_review_status, clinical_reviewer_id, published_at, updated_at",
        )
        .order("updated_at", { ascending: false });
      if (queryError) throw new Error(queryError.message);
      return data ?? [];
    },
  });

  const doctors = useQuery({
    queryKey: ["admin-blog-doctors"],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("doctors")
        .select("id, name")
        .order("name");
      if (queryError) throw new Error(queryError.message);
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const rows = posts.data ?? [];
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (term && !`${row.title} ${row.slug}`.toLowerCase().includes(term)) return false;
      if (status !== "all" && row.status !== status) return false;
      return true;
    });
  }, [posts.data, search, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });

  const save = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const payload = {
        slug: editing.slug,
        title: editing.title,
        excerpt: editing.excerpt || null,
        body: editing.body || null,
        cover_image_url: editing.cover_image_url || null,
        clinical_reviewer_id: editing.clinical_reviewer_id || null,
        ...(canPublish
          ? {
              status: editing.status as never,
              published_at: editing.status === "published" ? new Date().toISOString() : null,
            }
          : {}),
      };
      const query = supabase.from("blog_posts");
      const { error: saveError } = editing.id
        ? await query.update(payload).eq("id", editing.id)
        : await query.insert(payload as never);
      if (saveError) throw new Error(saveError.message);
      await logAction({
        action: editing.id ? "update" : "create",
        entityTable: "blog_posts",
        entityId: editing.id,
        summary: `${editing.id ? "Updated" : "Created"} article: ${editing.title}`,
      });
    },
    onSuccess: () => {
      setEditing(null);
      setError(null);
      void invalidate();
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const review = useMutation({
    mutationFn: async () => {
      if (!reviewing) return;
      const { error: reviewError } = await supabase
        .from("blog_posts")
        .update({
          clinical_review_status: reviewing.outcome as never,
          clinical_review_notes: reviewing.notes || null,
          clinical_reviewed_at: new Date().toISOString(),
        })
        .eq("id", reviewing.id);
      if (reviewError) throw new Error(reviewError.message);
      await logAction({
        action: "clinical_review",
        entityTable: "blog_posts",
        entityId: reviewing.id,
        summary: `Clinical review ${reviewing.outcome} for: ${reviewing.title}`,
      });
    },
    onSuccess: () => {
      setReviewing(null);
      setError(null);
      void invalidate();
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const remove = useMutation({
    mutationFn: async (row: { id: string; title: string }) => {
      const { error: deleteError } = await supabase.from("blog_posts").delete().eq("id", row.id);
      if (deleteError) throw new Error(deleteError.message);
      await logAction({
        action: "delete",
        entityTable: "blog_posts",
        entityId: row.id,
        summary: `Deleted article: ${row.title}`,
      });
    },
    onSuccess: () => {
      setPendingDelete(null);
      void invalidate();
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const columns: Column<(typeof filtered)[number]>[] = [
    {
      key: "title",
      header: "Article",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.title}</p>
          <p className="text-sm text-muted-foreground">{row.slug}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge
          status={row.status}
          tone={row.status === "published" ? "positive" : "neutral"}
        />
      ),
    },
    {
      key: "review",
      header: "Clinical review",
      cell: (row) => (
        <StatusBadge
          status={row.clinical_review_status}
          tone={
            row.clinical_review_status === "approved"
              ? "positive"
              : row.clinical_review_status === "changes_requested"
                ? "critical"
                : row.clinical_review_status === "pending"
                  ? "warning"
                  : "neutral"
          }
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (row) => {
        const isMyReview =
          canReview && profile?.doctor_id && row.clinical_reviewer_id === profile.doctor_id;
        return (
          <div className="flex justify-end gap-2">
            {isMyReview ? (
              <Button
                size="sm"
                onClick={() =>
                  setReviewing({
                    id: row.id,
                    title: row.title,
                    outcome: row.clinical_review_status,
                    notes: "",
                  })
                }
              >
                Clinical review
              </Button>
            ) : null}
            {canWrite ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setEditing({
                      id: row.id,
                      slug: row.slug,
                      title: row.title,
                      excerpt: row.excerpt ?? "",
                      body: row.body ?? "",
                      cover_image_url: row.cover_image_url ?? "",
                      status: row.status,
                      clinical_reviewer_id: row.clinical_reviewer_id ?? "",
                    })
                  }
                >
                  <Pencil className="size-4" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPendingDelete({ id: row.id, title: row.title })}
                >
                  <Trash2 className="size-4" /> Delete
                </Button>
              </>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <AdminShell
      title="Blog"
      description="Draft articles, request clinical review, and publish approved content."
      requires={["content.write", "blog.review"]}
      actions={
        canWrite ? (
          <Button onClick={() => setEditing({ ...emptyPost })}>
            <Plus className="size-4" /> New article
          </Button>
        ) : null
      }
    >
      <div className="flex flex-wrap items-end gap-4">
        <SearchField
          value={search}
          onChange={(next) => {
            setSearch(next);
            setPage(1);
          }}
          placeholder="Search articles"
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={(next) => {
            setStatus(next);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All" },
            { value: "draft", label: "Draft" },
            { value: "in_review", label: "In review" },
            { value: "ready_to_publish", label: "Ready to publish" },
            { value: "published", label: "Published" },
          ]}
        />
      </div>

      <AdminError message={error} />
      {!canPublish ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Your role can write and edit articles. Publishing is done by an editor or admin.
        </p>
      ) : null}

      <div className="mt-6">
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          isPending={posts.isPending}
          isError={posts.isError}
          emptyTitle="No articles found"
        />
        <Pagination
          page={currentPage}
          pageCount={pageCount}
          total={filtered.length}
          onPageChange={setPage}
        />
      </div>

      <FormModal
        open={editing !== null}
        onOpenChange={(open) => (open ? null : setEditing(null))}
        title={editing?.id ? "Edit article" : "New article"}
        busy={save.isPending}
        onSubmit={() => save.mutate()}
      >
        <div>
          <Label htmlFor="post-title">Title</Label>
          <Input
            id="post-title"
            required
            value={editing?.title ?? ""}
            onChange={(event) =>
              setEditing((current) =>
                current ? { ...current, title: event.target.value } : current,
              )
            }
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="post-slug">Web address (slug)</Label>
          <Input
            id="post-slug"
            required
            value={editing?.slug ?? ""}
            onChange={(event) =>
              setEditing((current) =>
                current ? { ...current, slug: event.target.value } : current,
              )
            }
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="post-excerpt">Summary</Label>
          <Textarea
            id="post-excerpt"
            value={editing?.excerpt ?? ""}
            onChange={(event) =>
              setEditing((current) =>
                current ? { ...current, excerpt: event.target.value } : current,
              )
            }
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="post-body">Article</Label>
          <Textarea
            id="post-body"
            value={editing?.body ?? ""}
            onChange={(event) =>
              setEditing((current) =>
                current ? { ...current, body: event.target.value } : current,
              )
            }
            className="mt-2 min-h-48"
          />
        </div>
        <div>
          <Label htmlFor="post-cover">Cover image URL</Label>
          <Input
            id="post-cover"
            value={editing?.cover_image_url ?? ""}
            onChange={(event) =>
              setEditing((current) =>
                current ? { ...current, cover_image_url: event.target.value } : current,
              )
            }
            className="mt-2"
          />
        </div>
        <div>
          <Label>Clinical reviewer</Label>
          <Select
            value={editing?.clinical_reviewer_id || "none"}
            onValueChange={(next) =>
              setEditing((current) =>
                current
                  ? { ...current, clinical_reviewer_id: next === "none" ? "" : next }
                  : current,
              )
            }
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No reviewer</SelectItem>
              {(doctors.data ?? []).map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canPublish ? (
          <div>
            <Label>Status</Label>
            <Select
              value={editing?.status ?? "draft"}
              onValueChange={(next) =>
                setEditing((current) => (current ? { ...current, status: next } : current))
              }
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
          </div>
        ) : null}
      </FormModal>

      <FormModal
        open={reviewing !== null}
        onOpenChange={(open) => (open ? null : setReviewing(null))}
        title="Clinical review"
        description="Record whether this article is clinically accurate. This does not publish the article."
        submitLabel="Record review"
        busy={review.isPending}
        onSubmit={() => review.mutate()}
      >
        <div>
          <Label>Outcome</Label>
          <Select
            value={reviewing?.outcome ?? "pending"}
            onValueChange={(next) =>
              setReviewing((current) => (current ? { ...current, outcome: next } : current))
            }
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
        <div>
          <Label htmlFor="review-notes">Notes</Label>
          <Textarea
            id="review-notes"
            value={reviewing?.notes ?? ""}
            onChange={(event) =>
              setReviewing((current) =>
                current ? { ...current, notes: event.target.value } : current,
              )
            }
            className="mt-2"
          />
        </div>
      </FormModal>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => (open ? null : setPendingDelete(null))}
        title="Delete this article?"
        description="This permanently removes the article from the website."
        onConfirm={() => pendingDelete && remove.mutate(pendingDelete)}
      />
    </AdminShell>
  );
}
