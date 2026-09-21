import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminError, StatusBadge } from "@/components/admin/ui";
import { WorkspaceLayout, WorkspaceSaveBar, WorkspaceSection } from "@/components/admin/workspace";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAdminSession } from "@/hooks/use-admin-session";
import { supabase } from "@/integrations/supabase/client";
import { logAction } from "@/lib/audit";
import { userFacingDataError } from "@/lib/data/errors";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/_admin/blog-comments/$commentId")({
  head: () => ({ meta: [...createPageMeta("Review blog comment", "Moderate a reader comment."), { name: "robots", content: "noindex, nofollow" }] }),
  component: CommentWorkspace,
});

function CommentWorkspace() {
  const { commentId } = Route.useParams();
  const { session } = useAdminSession();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [status, setStatus] = useState<"pending" | "approved" | "hidden">("pending");
  const [error, setError] = useState<string | null>(null);
  const comment = useQuery({
    queryKey: ["admin-blog-comment", commentId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase.from("blog_comments").select("id,content,status,created_at,blog_posts(title),profiles!blog_comments_author_id_fkey(full_name)").eq("id", commentId).single();
      if (queryError) throw queryError;
      return data;
    },
  });
  useEffect(() => {
    if (comment.data?.status) setStatus(comment.data.status as typeof status);
  }, [comment.data?.status]);
  const save = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error("Your staff session has expired.");
      const { error: updateError } = await supabase.from("blog_comments").update({ status, moderated_by: session.user.id, moderated_at: new Date().toISOString() }).eq("id", commentId);
      if (updateError) throw updateError;
      await logAction({ action: "blog_comment_moderated", entityTable: "blog_comments", entityId: commentId, summary: `Blog comment marked ${status}` });
    },
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ["admin-blog-comments"] }); void navigate({ to: "/_admin/blog-comments" }); },
    onError: (cause: Error) => setError(userFacingDataError(cause)),
  });
  return (
    <AdminShell title="Review blog comment" description={comment.data?.blog_posts?.title ?? "Reader comment"} requires="content.write">
      <WorkspaceLayout backLink={<Link to="/_admin/blog-comments">All blog comments</Link>}>
        <WorkspaceSection title="Comment" description="Comment text is read-only. Choose whether it may appear publicly.">
          <AdminError message={error} />
          <div><Label htmlFor="comment-author">Author</Label><p id="comment-author" className="mt-2 text-sm">{comment.data?.profiles?.full_name ?? "Reader"}</p></div>
          <div><Label htmlFor="comment-content">Submitted comment</Label><Textarea id="comment-content" className="mt-2" readOnly value={comment.data?.content ?? ""} /></div>
          <div><Label htmlFor="comment-status">Moderation status</Label><Select value={status} onValueChange={(value) => setStatus(value as typeof status)}><SelectTrigger id="comment-status" className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="hidden">Hidden</SelectItem></SelectContent></Select></div>
          <StatusBadge status={status} tone={status === "approved" ? "positive" : status === "hidden" ? "critical" : "warning"} />
          <WorkspaceSaveBar busy={save.isPending} onCancel={() => navigate({ to: "/_admin/blog-comments" })} onSave={() => save.mutate()} />
        </WorkspaceSection>
      </WorkspaceLayout>
    </AdminShell>
  );
}