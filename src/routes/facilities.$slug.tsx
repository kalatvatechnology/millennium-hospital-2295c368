import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicPage } from "@/components/layout/public-page";
import {
  DepartmentCard,
  DoctorCard,
  HospitalServiceCard,
  ProfessionalServiceCard,
} from "@/components/content/cards";
import { Async } from "@/components/shared/async";
import { ContentSection, EmptyState, PageIntro } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { facilityQuery } from "@/lib/queries";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/facilities/$slug")({
  head: () => ({ meta: createPageMeta("Facility", "View a facility at The Millennium Hospital.") }),
  component: FacilityDetail,
});

function FacilityDetail() {
  const { slug } = Route.useParams();
  const query = useQuery(facilityQuery(slug));
  return (
    <PublicPage>
      <Async query={query}>
        {(data) =>
          !data ? (
            <ContentSection>
              <EmptyState
                title="We couldn't find this facility"
                description="It may not be published yet or the address may have changed."
                action={
                  <Button asChild>
                    <Link to="/facilities">View all facilities</Link>
                  </Button>
                }
              />
            </ContentSection>
          ) : (
            <>
              <PageIntro
                eyebrow="Facility"
                title={data.facility.name}
                description={
                  data.facility.description ?? "Further information has not yet been published."
                }
              />
              {data.facility.images.length ? (
                <ContentSection>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {data.facility.images.map((image, index) => (
                      <img
                        key={image}
                        src={image}
                        alt={`${data.facility.name} — view ${index + 1}`}
                        className="aspect-[4/3] w-full border border-border object-cover"
                        loading="lazy"
                      />
                    ))}
                  </div>
                </ContentSection>
              ) : null}
              {data.departments.length ? (
                <ContentSection muted>
                  <h2 className="text-2xl font-semibold">Departments here</h2>
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {data.departments.map((item) => (
                      <DepartmentCard key={item.id} department={item} />
                    ))}
                  </div>
                </ContentSection>
              ) : null}
              {data.doctors.length ? (
                <ContentSection>
                  <h2 className="text-2xl font-semibold">Doctors here</h2>
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {data.doctors.map((item) => (
                      <DoctorCard key={item.id} doctor={item} />
                    ))}
                  </div>
                </ContentSection>
              ) : null}
              {data.professionalServices.length || data.hospitalServices.length ? (
                <ContentSection muted>
                  <h2 className="text-2xl font-semibold">Services here</h2>
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {data.professionalServices.map((item) => (
                      <ProfessionalServiceCard key={item.id} service={item} />
                    ))}
                    {data.hospitalServices.map((item) => (
                      <HospitalServiceCard key={item.id} service={item} />
                    ))}
                  </div>
                </ContentSection>
              ) : null}
              <ContentSection>
                <div className="text-center">
                  <Button asChild>
                    <Link to="/contact">Plan your visit</Link>
                  </Button>
                </div>
              </ContentSection>
            </>
          )
        }
      </Async>
    </PublicPage>
  );
}
