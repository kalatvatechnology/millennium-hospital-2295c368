import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PublicPage } from "@/components/layout/public-page";
import { ArticleCard } from "@/components/content/cards";
import { Async } from "@/components/shared/async";
import { ContentSection, EmptyState, PageIntro } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { blogPostsQuery } from "@/lib/queries";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/blog/")({
  head: () => ({ meta: createPageMeta("Health resources", "Read reviewed health articles published by The Millennium Hospital.") }),
  component: BlogPage,
});

function BlogPage() {
  const posts = useQuery(blogPostsQuery);
  const [query, setQuery] = useState("");
  return (
    <PublicPage>
      <PageIntro eyebrow="Health resources" title="Articles and guidance" description="Health information reviewed by the hospital team before publication." />
      <ContentSection>
        <div className="max-w-md">
          <Label htmlFor="article-search">Search articles</Label>
          <Input id="article-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by title" className="mt-2" />
        </div>
        <Async
          query={posts}
          isEmpty={(data) => data.length === 0}
          empty={<EmptyState title="Articles are being prepared" description="No health resources have been published yet." action={<Button asChild><Link to="/contact">Contact the hospital</Link></Button>} />}
        >
          {(data) => {
            const filtered = data.filter((post) => `${post.title} ${post.excerpt ?? ""}`.toLowerCase().includes(query.toLowerCase()));
            return filtered.length ? (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((post) => <ArticleCard key={post.id} post={post} />)}</div>
            ) : (
              <EmptyState title="No articles match your search" description="Try a different word or clear the search." />
            );
          }}
        </Async>
      </ContentSection>
    </PublicPage>
  );
}
