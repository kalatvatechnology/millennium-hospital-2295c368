import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicPage } from "@/components/layout/public-page";
import { HospitalServiceCard, ProfessionalServiceCard } from "@/components/content/cards";
import { Async } from "@/components/shared/async";
import { ContentSection, PageIntro, SectionHeading, UnpublishedPanel } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { hospitalServicesQuery, professionalServicesQuery } from "@/lib/queries";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/services/")({
  head: () => ({ meta: createPageMeta("Services", "Explore professional and hospital services at The Millennium Hospital.") }),
  component: ServicesPage,
});

function ServicesPage() {
  const professional = useQuery(professionalServicesQuery);
  const hospital = useQuery(hospitalServicesQuery);
  return (
    <PublicPage>
      <PageIntro eyebrow="Care and treatment" title="Services for patients and families" description="Professional services are listed separately from wider hospital services." />
      <ContentSection>
        <SectionHeading eyebrow="Specialist support" title="Professional services" description="Specialist clinical and professional support for individual care needs." />
        <Async query={professional} isEmpty={(data) => data.length === 0} empty={<UnpublishedPanel title="Professional services are being prepared" description="No professional services have been published yet." />}>
          {(data) => <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.map((service) => <ProfessionalServiceCard key={service.id} service={service} />)}</div>}
        </Async>
      </ContentSection>
      <ContentSection muted>
        <SectionHeading eyebrow="Hospital care" title="Hospital services" description="Clinical, diagnostic and support services available across the hospital." />
        <Async query={hospital} isEmpty={(data) => data.length === 0} empty={<UnpublishedPanel title="Hospital services are being prepared" description="No hospital services have been published yet." />}>
          {(data) => <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.map((service) => <HospitalServiceCard key={service.id} service={service} />)}</div>}
        </Async>
        <div className="mt-12 text-center"><Button asChild><Link to="/contact">Ask about a service</Link></Button></div>
      </ContentSection>
    </PublicPage>
  );
}
