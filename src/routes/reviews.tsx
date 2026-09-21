import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicPage } from "@/components/layout/public-page";
import { ReviewCard } from "@/components/content/cards";
import { Async } from "@/components/shared/async";
import { ContentSection, EmptyState, PageIntro } from "@/components/shared/page";
import { reviewsQuery } from "@/lib/queries";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/reviews")({
  head: () => ({ meta: createPageMeta("Patient reviews", "Read verified patient experiences from The Millennium Hospital.") }),
  component: ReviewsPage,
});

function ReviewsPage() {
  const reviews = useQuery(reviewsQuery);
  return (
    <PublicPage>
      <PageIntro eyebrow="Patient voices" title="Patient reviews" description="Only reviewed and approved patient experiences are shown here." />
      <ContentSection>
        <Async
          query={reviews}
          isEmpty={(data) => data.length === 0}
          empty={<EmptyState title="No reviews are published yet" description="Verified patient feedback will appear here once it is approved." />}
        >
          {(data) => {
            const hospitalReviews = data.filter((review) => !review.doctor);
            const doctorReviews = data.filter((review) => review.doctor);
            return (
              <div className="grid gap-14">
                {hospitalReviews.length ? (
                  <section aria-labelledby="hospital-reviews-title">
                    <h2 id="hospital-reviews-title" className="text-2xl font-semibold">Hospital reviews</h2>
                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                      {hospitalReviews.map((review) => <ReviewCard key={review.id} review={review} />)}
                    </div>
                  </section>
                ) : null}
                {doctorReviews.length ? (
                  <section aria-labelledby="doctor-reviews-title">
                    <h2 id="doctor-reviews-title" className="text-2xl font-semibold">Doctor reviews</h2>
                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                      {doctorReviews.map((review) => <ReviewCard key={review.id} review={review} />)}
                    </div>
                  </section>
                ) : null}
              </div>
            );
          }}
        </Async>
      </ContentSection>
    </PublicPage>
  );
}
