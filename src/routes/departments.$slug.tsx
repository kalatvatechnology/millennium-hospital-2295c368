import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, ShieldCheck, Stethoscope } from "lucide-react";
import { PublicPage } from "@/components/layout/public-page";
import { DoctorCard, ProfessionalServiceCard } from "@/components/content/cards";
import { Async } from "@/components/shared/async";
import { ContentSection, EmptyState, UnpublishedPanel } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { departmentQuery } from "@/lib/queries";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/departments/$slug")({
  head: () => ({
    meta: createPageMeta("Department", "View a clinical department at The Millennium Hospital."),
  }),
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
              <EmptyState
                title="We couldn't find this department"
                description="It may not be published yet or the address may have changed."
                action={
                  <Button asChild>
                    <Link to="/departments">View all departments</Link>
                  </Button>
                }
              />
            </ContentSection>
          ) : (
            <>
              <ContentSection>
                <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.55fr)]">
                  <div>
                    <p className="text-sm font-bold uppercase text-primary">Clinical department</p>
                    <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
                      {data.department.name}
                    </h1>
                    <p className="mt-6 whitespace-pre-line text-lg leading-8 text-muted-foreground">
                      {data.department.description ??
                        "Further department information has not yet been published."}
                    </p>
                    <Button asChild className="mt-8">
                      <Link to="/contact">
                        Request an appointment <ArrowRight />
                      </Link>
                    </Button>
                  </div>
                  <aside className="border-t-4 border-brand-accent bg-secondary p-6 shadow-[var(--shadow-md)]">
                    <ShieldCheck className="size-8 text-primary" />
                    <h2 className="mt-5 text-xl font-semibold">Patient information</h2>
                    <p className="mt-3 leading-7 text-muted-foreground">
                      Department details, associated doctors and services are published by the
                      hospital team through the CMS.
                    </p>
                  </aside>
                </div>
              </ContentSection>
              <ContentSection muted>
                <div className="flex items-center gap-3">
                  <Stethoscope className="text-primary" />
                  <h2 className="text-2xl font-semibold">Specialists in this department</h2>
                </div>
                {data.doctors.length ? (
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {data.doctors.map((doctor) => (
                      <DoctorCard key={doctor.id} doctor={doctor} />
                    ))}
                  </div>
                ) : (
                  <UnpublishedPanel
                    title="No doctor profiles published yet"
                    description="Clinician profiles for this department are being prepared."
                  />
                )}
              </ContentSection>
              {data.services.length ? (
                <ContentSection>
                  <h2 className="text-2xl font-semibold">Professional services</h2>
                  <p className="mt-3 max-w-2xl text-muted-foreground">
                    Explore CMS-linked services associated with this department.
                  </p>
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {data.services.map((service) => (
                      <ProfessionalServiceCard key={service.id} service={service} />
                    ))}
                  </div>
                </ContentSection>
              ) : null}
              <ContentSection muted>
                <div className="mx-auto max-w-3xl text-center">
                  <CalendarDays className="mx-auto text-primary" />
                  <h2 className="mt-4 text-3xl font-semibold">Speak with the hospital team</h2>
                  <p className="mt-3 text-muted-foreground">
                    Share your details and the team will help direct your enquiry.
                  </p>
                  <Button asChild className="mt-6">
                    <Link to="/contact">Contact the hospital</Link>
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
