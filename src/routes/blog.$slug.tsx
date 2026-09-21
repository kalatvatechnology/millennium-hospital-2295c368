import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicPage } from "@/components/layout/public-page";
import { Async } from "@/components/shared/async";
import { ContentSection, EmptyState, PageIntro } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { ArticleCharts, ArticleContent } from "@/components/blog/article-content";
import { blogPostQuery } from "@/lib/queries";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/blog/$slug")({
  head: () => ({
    meta: createPageMeta(
      "Health article",
      "Read a reviewed health resource from The Millennium Hospital.",
    ),
  }),
  component: ArticleDetail,
});

function ArticleDetail() {
  const { slug } = Route.useParams();
  const query = useQuery(blogPostQuery(slug));
  return (
    <PublicPage>
      <Async query={query}>
        {(data) =>
          !data ? (
            <ContentSection>
              <EmptyState
                title="We couldn't find this article"
                description="It may be awaiting review or may no longer be published."
                action={
                  <Button asChild>
                    <Link to="/blog">View health resources</Link>
                  </Button>
                }
              />
            </ContentSection>
          ) : (
            <>
              <PageIntro
                eyebrow={data.post.category?.name ?? "Health resource"}
                title={data.post.title}
                description={data.post.excerpt ?? "Article summary not published."}
              />
              <ContentSection>
                <article className="prose-copy mx-auto max-w-3xl">
                  {data.post.cover_image_url ? (
                    <figure className="mb-8">
                      <img
                        src={data.post.cover_image_url}
                        alt={data.post.featured_image_alt ?? ""}
                        className="w-full border border-border object-cover"
                      />
                      {data.post.featured_image_caption ? (
                        <figcaption className="mt-2 text-sm text-muted-foreground">
                          {data.post.featured_image_caption}
                        </figcaption>
                      ) : null}
                    </figure>
                  ) : null}
                  <p className="text-sm text-muted-foreground">
                    {data.post.author ? `By ${data.post.author.name}` : "Author not published"}
                    {data.post.published_at
                      ? ` · ${new Date(data.post.published_at).toLocaleDateString()}`
                      : ""}
                  </p>
                  {data.post.reviewer ? (
                    <p className="text-sm text-muted-foreground">
                      Clinically reviewed by {data.post.reviewer.name}
                    </p>
                  ) : null}
                  <div className="mt-8">
                    <ArticleContent document={data.post.body_document} fallback={data.post.body} />
                  </div>
                  {data.doctors.length ? (
                    <p className="mt-10 text-sm text-muted-foreground">
                      Related doctors:{" "}
                      {data.doctors.map((doctor, index) => (
                        <span key={doctor.slug}>
                          {index ? ", " : ""}
                          <Link
                            to="/doctors/$slug"
                            params={{ slug: doctor.slug }}
                            className="text-primary"
                          >
                            {doctor.name}
                          </Link>
                        </span>
                      ))}
                    </p>
                  ) : null}
                </article>
                <ArticleCharts charts={data.post.visualizations} />
              </ContentSection>
            </>
          )
        }
      </Async>
    </PublicPage>
  );
}
