import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicPage } from "@/components/layout/public-page";
import { DoctorCard, ProfessionalServiceCard } from "@/components/content/cards";
import { Async } from "@/components/shared/async";
import { ContentSection, EmptyState, PageIntro, UnpublishedPanel } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { departmentQuery } from "@/lib/queries";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/departments/$slug")({
  head: () => ({ meta: createPageMeta("Department", "View a clinical department at The Millennium Hospital.") }),
  component: DepartmentDetail,
});

function DepartmentDetail() {
  const { slug } = Route.useParams();
  const query = useQuery(departmentQuery(slug));
  return (
    <PublicPage>
      <Async query={query}>
        {(data) =>
          !data ? (
            <ContentSection>
              <EmptyState title="We couldn't find this department" description="It may not be published yet or the address may have changed." action={<Button asChild><Link to="/departments">View all departments</Link></Button>} />
            </ContentSection>
          ) : (
            <>
              <PageIntro eyebrow="Department" title={data.department.name} description={data.department.description ?? "Further department information has not yet been published."} />
              <ContentSection>
                <h2 className="text-2xl font-semibold">Specialists in this department</h2>
                {data.doctors.length ? (
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {data.doctors.map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} />)}
                  </div>
                ) : (
                  <UnpublishedPanel title="No doctor profiles published yet" description="Clinician profiles for this department are being prepared." />
                )}
              </ContentSection>
              {data.services.length ? (
                <ContentSection muted>
                  <h2 className="text-2xl font-semibold">Related professional services</h2>
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {data.services.map((service) => <ProfessionalServiceCard key={service.id} service={service} />)}
                  </div>
                </ContentSection>
              ) : null}
            </>
          )
        }
      </Async>
    </PublicPage>
  );
}
