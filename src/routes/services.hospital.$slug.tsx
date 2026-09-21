import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, Building2, CircleHelp, HeartHandshake, Route as RouteIcon } from "lucide-react";
import { PublicPage } from "@/components/layout/public-page";
import { EnquiryForm } from "@/components/content/enquiry-form";
import { Async } from "@/components/shared/async";
import { ContentSection, EmptyState } from "@/components/shared/page";
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
              <section className="border-b border-border bg-primary text-primary-foreground">
                <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] lg:px-8 lg:py-20">
                  <div>
                    <p className="text-sm font-bold uppercase text-primary-foreground/80">Hospital service</p>
                    <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">{service.title}</h1>
                    <p className="mt-6 max-w-3xl text-lg leading-8 text-primary-foreground/80">{service.summary ?? "Further service information is being prepared."}</p>
                    <Button asChild variant="secondary" className="mt-8"><a href="#hospital-service-enquiry">Contact the hospital <ArrowDown /></a></Button>
                  </div>
                  <aside className="border border-primary-foreground/20 bg-primary-foreground/10 p-6">
                    <Building2 className="size-8" />
                    <h2 className="mt-5 text-xl font-semibold">Hospital capability</h2>
                    <p className="mt-3 leading-7 text-primary-foreground/80">This presentation focuses on access, patient support and practical service information.</p>
                  </aside>
                </div>
              </section>
              <ContentSection muted>
                <div className="max-w-4xl">
                  <h2 className="text-3xl font-semibold">Service overview</h2>
                  <p className="mt-5 whitespace-pre-line leading-8 text-muted-foreground">{service.description ?? "Detailed information has not yet been published."}</p>
                </div>
                <div className="mt-10 grid gap-5 md:grid-cols-3">
                  <div className="bg-card p-6 shadow-[var(--shadow-sm)]"><RouteIcon className="text-primary" /><h3 className="mt-4 text-lg font-semibold">Access and arrival</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Approved information can explain how patients access the service.</p></div>
                  <div className="bg-card p-6 shadow-[var(--shadow-sm)]"><HeartHandshake className="text-primary" /><h3 className="mt-4 text-lg font-semibold">Patient support</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Practical CMS content can guide patients and families through next steps.</p></div>
                  <div className="bg-card p-6 shadow-[var(--shadow-sm)]"><CircleHelp className="text-primary" /><h3 className="mt-4 text-lg font-semibold">Clear information</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Availability and contact guidance appears only when verified by the hospital.</p></div>
                </div>
              </ContentSection>
              <ContentSection>
                <div id="hospital-service-enquiry" className="mx-auto max-w-2xl scroll-mt-24">
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
