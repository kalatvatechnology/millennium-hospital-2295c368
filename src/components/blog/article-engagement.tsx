import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { userFacingDataError } from "@/lib/data/errors";

export function ArticleEngagement({
  postId,
  engagementEnabled,
  commentsEnabled,
}: {
  postId: string;
  engagementEnabled: boolean;
  commentsEnabled: boolean;
}) {
  const client = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
  }, []);
  const engagement = useQuery({
    queryKey: ["article-engagement", postId, userId],
    enabled: engagementEnabled || commentsEnabled,
    queryFn: async () => {
      const [likes, comments] = await Promise.all([
        supabase.from("blog_likes").select("user_id").eq("post_id", postId),
        supabase
          .from("blog_comments")
          .select("id,content,created_at,profiles!blog_comments_author_id_fkey(full_name)")
          .eq("post_id", postId)
          .eq("status", "approved")
          .order("created_at", { ascending: false }),
      ]);
      if (likes.error) throw likes.error;
      if (comments.error) throw comments.error;
      return { likes: likes.data ?? [], comments: comments.data ?? [] };
    },
  });
  const liked = Boolean(userId && engagement.data?.likes.some((like) => like.user_id === userId));
  const like = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Sign in is required to like an article.");
      const command = liked
        ? supabase.from("blog_likes").delete().eq("post_id", postId).eq("user_id", userId)
        : supabase.from("blog_likes").insert({ post_id: postId, user_id: userId });
      const { error } = await command;
      if (error) throw error;
    },
    onSuccess: () => void client.invalidateQueries({ queryKey: ["article-engagement", postId] }),
    onError: (error) => setNotice(userFacingDataError(error)),
  });
  const submit = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Sign in is required to comment.");
      const content = comment.trim();
      if (!content) throw new Error("Enter a comment before submitting.");
      const { error } = await supabase
        .from("blog_comments")
        .insert({ post_id: postId, author_id: userId, content });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      setNotice("Your comment was submitted for moderation.");
    },
    onError: (error) => setNotice(userFacingDataError(error)),
  });
  if (!engagementEnabled && !commentsEnabled) return null;
  return (
    <section className="mx-auto mt-12 max-w-3xl border-t border-border pt-8" aria-labelledby="discussion-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="discussion-title" className="text-2xl font-semibold">Article discussion</h2>
        {engagementEnabled ? (
          <Button type="button" variant={liked ? "default" : "outline"} onClick={() => like.mutate()} disabled={like.isPending}>
            <Heart className="size-4" aria-hidden="true" /> {liked ? "Liked" : "Like"} ({engagement.data?.likes.length ?? 0})
          </Button>
        ) : null}
      </div>
      {notice ? <p className="mt-4 text-sm text-muted-foreground" role="status">{notice}</p> : null}
      {commentsEnabled ? (
        <>
          <div className="mt-6 grid gap-3">
            <label htmlFor="article-comment" className="font-medium">Add a comment</label>
            <Textarea id="article-comment" maxLength={2000} value={comment} onChange={(event) => setComment(event.target.value)} disabled={!userId} placeholder={userId ? "Your comment will appear after moderation." : "Sign in to submit a comment."} />
            <Button className="justify-self-start" disabled={!userId || submit.isPending} onClick={() => submit.mutate()}>Submit for moderation</Button>
          </div>
          <div className="mt-8 grid gap-4">
            {engagement.data?.comments.map((item) => (
              <article key={item.id} className="border-l-2 border-primary pl-4">
                <p>{item.content}</p>
                <p className="mt-2 text-sm text-muted-foreground">{item.profiles?.full_name ?? "Reader"} · {new Date(item.created_at).toLocaleDateString()}</p>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}