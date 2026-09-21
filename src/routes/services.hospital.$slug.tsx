import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicPage } from "@/components/layout/public-page";
import { EnquiryForm } from "@/components/content/enquiry-form";
import { Async } from "@/components/shared/async";
import { ContentSection, EmptyState, PageIntro } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { hospitalServiceQuery } from "@/lib/queries";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/services/hospital/$slug")({
  head: () => ({ meta: createPageMeta("Hospital service", "View a hospital service at The Millennium Hospital.") }),
  component: HospitalServiceDetail,
});

function HospitalServiceDetail() {
  const { slug } = Route.useParams();
  const query = useQuery(hospitalServiceQuery(slug));
  return (
    <PublicPage>
      <Async query={query}>
        {(service) =>
          !service ? (
            <ContentSection>
              <EmptyState title="We couldn't find this service" description="It may not be published yet or the address may have changed." action={<Button asChild><Link to="/services">View all services</Link></Button>} />
            </ContentSection>
          ) : (
            <>
              <PageIntro eyebrow="Hospital service" title={service.title} description={service.summary ?? "Further service information is being prepared."} />
              <ContentSection>
                <div className="max-w-3xl">
                  <h2 className="text-2xl font-semibold">About this service</h2>
                  <p className="mt-4 leading-8 text-muted-foreground">{service.description ?? "Detailed information has not yet been published."}</p>
                </div>
              </ContentSection>
              <ContentSection muted>
                <div className="mx-auto max-w-2xl">
                  <EnquiryForm source="hospital_service" title={`Ask about ${service.title}`} description="Share your details and the hospital team will get in touch." />
                </div>
              </ContentSection>
            </>
          )
        }
      </Async>
    </PublicPage>
  );
}
