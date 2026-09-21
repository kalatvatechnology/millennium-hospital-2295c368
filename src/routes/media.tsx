import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicPage } from "@/components/layout/public-page";
import { MediaGrid } from "@/components/content/media";
import { Async } from "@/components/shared/async";
import { ContentSection, EmptyState, PageIntro } from "@/components/shared/page";
import { mediaQuery } from "@/lib/queries";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/media")({
  head: () => ({ meta: createPageMeta("Media", "Watch videos and reels and listen to podcasts published by The Millennium Hospital.") }),
  component: MediaPage,
});

function MediaPage() {
  const media = useQuery(mediaQuery());
  return (
    <PublicPage>
      <PageIntro eyebrow="Media" title="Videos, reels and podcasts" description="Content published by the hospital team." />
      <ContentSection>
        <Async
          query={media}
          isEmpty={(data) => data.length === 0}
          empty={<EmptyState title="Media is being prepared" description="No videos, reels or podcasts have been published yet." />}
        >
          {(data) => <MediaGrid items={data} />}
        </Async>
      </ContentSection>
    </PublicPage>
  );
}
