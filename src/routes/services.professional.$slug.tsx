import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ClipboardCheck, HeartHandshake, Stethoscope } from "lucide-react";
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
              <ContentSection>
                <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.55fr)]">
                  <div>
                    <p className="text-sm font-bold uppercase text-primary">Professional service</p>
                    <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">{data.service.title}</h1>
                    <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">{data.service.summary ?? "Further service information is being prepared."}</p>
                    <Button asChild className="mt-8"><a href="#service-enquiry">Ask about this service <ArrowDown /></a></Button>
                  </div>
                  <aside className="border-t-4 border-primary bg-secondary p-6 shadow-[var(--shadow-md)]">
                    <Stethoscope className="size-8 text-primary" />
                    <h2 className="mt-5 text-xl font-semibold">Clinician-led information</h2>
                    <p className="mt-3 leading-7 text-muted-foreground">This experience focuses on patient education, related clinicians and department context.</p>
                  </aside>
                </div>
              </ContentSection>
              <ContentSection muted>
                <div className="max-w-4xl">
                  <h2 className="text-3xl font-semibold">About this service</h2>
                  <p className="mt-5 whitespace-pre-line leading-8 text-muted-foreground">{data.service.description ?? "Detailed information has not yet been published."}</p>
                </div>
                <div className="mt-10 grid gap-5 md:grid-cols-2">
                  <div className="bg-card p-6 shadow-[var(--shadow-sm)]"><ClipboardCheck className="text-primary" /><h3 className="mt-4 text-xl font-semibold">Assessment and planning</h3><p className="mt-3 leading-7 text-muted-foreground">Approved CMS content can explain preparation, treatment pathways and follow-up.</p></div>
                  <div className="bg-card p-6 shadow-[var(--shadow-sm)]"><HeartHandshake className="text-primary" /><h3 className="mt-4 text-xl font-semibold">Informed decisions</h3><p className="mt-3 leading-7 text-muted-foreground">Information can balance potential benefits, considerations and alternatives without guarantees.</p></div>
                </div>
              </ContentSection>
              {data.departments.length ? (
                <ContentSection>
                  <h2 className="text-2xl font-semibold">Departments</h2>
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.departments.map((item) => <DepartmentCard key={item.id} department={item} />)}</div>
                </ContentSection>
              ) : null}
              {data.doctors.length ? (
                <ContentSection muted>
                  <h2 className="text-2xl font-semibold">Doctors providing this service</h2>
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.doctors.map((item) => <DoctorCard key={item.id} doctor={item} />)}</div>
                </ContentSection>
              ) : null}
              <ContentSection>
                <div id="service-enquiry" className="mx-auto max-w-2xl scroll-mt-24">
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
