import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicPage } from "@/components/layout/public-page";
import { DepartmentCard, DoctorCard } from "@/components/content/cards";
import { EnquiryForm } from "@/components/content/enquiry-form";
import { Async } from "@/components/shared/async";
import { ContentSection, EmptyState, PageIntro } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { professionalServiceQuery } from "@/lib/queries";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/services/professional/$slug")({
  head: () => ({ meta: createPageMeta("Professional service", "View a professional service at The Millennium Hospital.") }),
  component: ProfessionalServiceDetail,
});

function ProfessionalServiceDetail() {
  const { slug } = Route.useParams();
  const query = useQuery(professionalServiceQuery(slug));
  return (
    <PublicPage>
      <Async query={query}>
        {(data) =>
          !data ? (
            <ContentSection>
              <EmptyState title="We couldn't find this service" description="It may not be published yet or the address may have changed." action={<Button asChild><Link to="/services">View all services</Link></Button>} />
            </ContentSection>
          ) : (
            <>
              <PageIntro eyebrow="Professional service" title={data.service.title} description={data.service.summary ?? "Further service information is being prepared."} />
              <ContentSection>
                <div className="max-w-3xl">
                  <h2 className="text-2xl font-semibold">About this service</h2>
                  <p className="mt-4 leading-8 text-muted-foreground">{data.service.description ?? "Detailed information has not yet been published."}</p>
                </div>
              </ContentSection>
              {data.departments.length ? (
                <ContentSection muted>
                  <h2 className="text-2xl font-semibold">Departments</h2>
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.departments.map((item) => <DepartmentCard key={item.id} department={item} />)}</div>
                </ContentSection>
              ) : null}
              {data.doctors.length ? (
                <ContentSection>
                  <h2 className="text-2xl font-semibold">Doctors providing this service</h2>
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.doctors.map((item) => <DoctorCard key={item.id} doctor={item} />)}</div>
                </ContentSection>
              ) : null}
              <ContentSection muted>
                <div className="mx-auto max-w-2xl">
                  <EnquiryForm source="professional_service" title={`Ask about ${data.service.title}`} description="Share your details and the hospital team will get in touch." />
                </div>
              </ContentSection>
            </>
          )
        }
      </Async>
    </PublicPage>
  );
}
