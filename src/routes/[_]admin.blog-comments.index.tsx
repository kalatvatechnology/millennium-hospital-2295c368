import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { DataTable, StatusBadge, type Column } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/_admin/blog-comments/")({
  head: () => ({
    meta: [
      ...createPageMeta("Blog comment moderation", "Review reader comments before publication."),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BlogComments,
});

type CommentRow = {
  id: string;
  content: string;
  status: string;
  created_at: string;
  blog_posts: { title: string } | null;
  profiles: { full_name: string | null } | null;
};

function BlogComments() {
  const comments = useQuery({
    queryKey: ["admin-blog-comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_comments")
        .select(
          "id,content,status,created_at,blog_posts(title),profiles!blog_comments_author_id_fkey(full_name)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CommentRow[];
    },
  });
  const columns: Column<CommentRow>[] = [
    {
      key: "comment",
      header: "Comment",
      cell: (row) => (
        <div>
          <p className="line-clamp-2 font-medium">{row.content}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {row.profiles?.full_name ?? "Reader"}
          </p>
        </div>
      ),
    },
    {
      key: "article",
      header: "Article",
      cell: (row) => row.blog_posts?.title ?? "Unknown article",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge
          status={row.status}
          tone={
            row.status === "approved"
              ? "positive"
              : row.status === "hidden"
                ? "critical"
                : "warning"
          }
        />
      ),
    },
    {
      key: "action",
      header: "Actions",
      className: "text-right",
      cell: (row) => (
        <Button asChild size="sm" variant="outline">
          <Link to="/_admin/blog-comments/$commentId" params={{ commentId: row.id }}>
            Review
          </Link>
        </Button>
      ),
    },
  ];
  return (
    <AdminShell
      title="Blog comments"
      description="Approve or hide reader comments on a dedicated review page."
      requires="content.write"
    >
      <DataTable
        rows={comments.data ?? []}
        columns={columns}
        getRowId={(row) => row.id}
        isPending={comments.isPending}
        isError={comments.isError}
        emptyTitle="No comments"
        emptyDescription="Submitted article comments will appear here."
      />
    </AdminShell>
  );
}
