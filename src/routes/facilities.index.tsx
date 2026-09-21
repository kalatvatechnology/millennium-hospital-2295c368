import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicPage } from "@/components/layout/public-page";
import { FacilityCard } from "@/components/content/cards";
import { Async } from "@/components/shared/async";
import { ContentSection, EmptyState, PageIntro } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { facilitiesQuery } from "@/lib/queries";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/facilities/")({
  head: () => ({ meta: createPageMeta("Facilities", "Explore verified facilities at The Millennium Hospital and prepare for your visit.") }),
  component: FacilitiesPage,
});

function FacilitiesPage() {
  const facilities = useQuery(facilitiesQuery);
  return (
    <PublicPage>
      <PageIntro eyebrow="Hospital environment" title="Facilities designed for care" description="Approved images and practical details to help patients and families prepare for a visit." />
      <ContentSection>
        <Async
          query={facilities}
          isEmpty={(data) => data.length === 0}
          empty={<EmptyState title="Facility information is being prepared" description="No facility details or approved images have been published yet." action={<Button asChild><Link to="/contact">Plan your visit</Link></Button>} />}
        >
          {(data) => <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.map((facility) => <FacilityCard key={facility.id} facility={facility} />)}</div>}
        </Async>
      </ContentSection>
    </PublicPage>
  );
}
