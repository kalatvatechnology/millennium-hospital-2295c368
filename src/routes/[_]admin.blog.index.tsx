import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Plus, Stethoscope } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  DataTable,
  FilterSelect,
  Pagination,
  SearchField,
  StatusBadge,
  type Column,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { useAdminSession } from "@/hooks/use-admin-session";
import { supabase } from "@/integrations/supabase/client";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/_admin/blog/")({
  head: () => ({
    meta: [
      ...createPageMeta("Blog", "Manage hospital articles and clinical review."),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BlogList,
});
const PAGE_SIZE = 20;

function BlogList() {
  const { can, profile } = useAdminSession();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const posts = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id,slug,title,status,clinical_review_status,clinical_reviewer_id,updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const filtered = useMemo(
    () =>
      (posts.data ?? []).filter(
        (row) =>
          (!search.trim() ||
            `${row.title} ${row.slug}`.toLowerCase().includes(search.toLowerCase())) &&
          (status === "all" || row.status === status),
      ),
    [posts.data, search, status],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
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
      cell: (row) => (
        <div className="flex justify-end gap-2">
          {can("blog.review") && profile?.doctor_id === row.clinical_reviewer_id ? (
            <Button asChild size="sm">
              <Link
                to="/_admin/blog/$postId/$section"
                params={{ postId: row.id, section: "clinical-review" }}
              >
                <Stethoscope className="size-4" /> Review
              </Link>
            </Button>
          ) : null}
          {can("content.write") ? (
            <Button asChild size="sm" variant="outline">
              <Link
                to="/_admin/blog/$postId/$section"
                params={{ postId: row.id, section: "writing" }}
              >
                <Pencil className="size-4" /> Edit
              </Link>
            </Button>
          ) : null}
        </div>
      ),
    },
  ];
  return (
    <AdminShell
      title="Blog"
      description="Write, review, and publish patient-friendly hospital articles."
      requires={["content.write", "blog.review"]}
      actions={
        can("content.write") ? (
          <Button asChild>
            <Link to="/_admin/blog/$postId/$section" params={{ postId: "new", section: "writing" }}>
              <Plus className="size-4" /> New article
            </Link>
          </Button>
        ) : null
      }
    >
      <div className="flex flex-wrap items-end gap-4">
        <SearchField
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search articles"
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={(value) => {
            setStatus(value);
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
      {!can("content.publish") && can("content.write") ? (
        <p className="mt-4 text-sm text-muted-foreground">
          You can write and edit drafts. Publishing remains restricted to Editors and
          Administrators.
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
    </AdminShell>
  );
}
