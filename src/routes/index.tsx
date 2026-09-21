import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPin, Phone } from "lucide-react";
import { PublicPage } from "@/components/layout/public-page";
import { ContentSection, SectionHeading, UnpublishedPanel } from "@/components/shared/page";
import { Async } from "@/components/shared/async";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  ArticleCard,
  DepartmentCard,
  DoctorCard,
  FacilityCard,
  HospitalServiceCard,
  ProfessionalServiceCard,
  ReviewCard,
} from "@/components/content/cards";
import { MediaGrid } from "@/components/content/media";
import { EnquiryForm } from "@/components/content/enquiry-form";
import { siteConfig } from "@/config/site";
import {
  blogPostsQuery,
  departmentsQuery,
  doctorsQuery,
  facilitiesQuery,
  faqQuery,
  hospitalServicesQuery,
  mediaQuery,
  professionalServicesQuery,
  reviewsQuery,
} from "@/lib/queries";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: createPageMeta(
      "The Millennium Hospital",
      "Find doctors, departments, services, facilities and health resources at The Millennium Hospital, and send an enquiry to the care team.",
    ),
  }),
  component: HomePage,
});

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function HomePage() {
  const departments = useQuery(departmentsQuery);
  const doctors = useQuery(doctorsQuery);
  const professional = useQuery(professionalServicesQuery);
  const hospital = useQuery(hospitalServicesQuery);
  const facilities = useQuery(facilitiesQuery);
  const reviews = useQuery(reviewsQuery);
  const faq = useQuery(faqQuery);
  const media = useQuery(mediaQuery({ homeOnly: true }));
  const posts = useQuery(blogPostsQuery);

  return (
    <PublicPage>
      {/* 1. Hero */}
      <section className="border-b border-border bg-hero">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <p className="text-sm font-semibold text-primary">{siteConfig.tagline}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
            Care that listens. Expertise you can trust.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            {siteConfig.name} brings departments, specialists and support services together so patients and families always
            know where to turn.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Button asChild size="lg"><Link to="/doctors">Find a doctor</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/contact">Make an enquiry</Link></Button>
          </div>
        </div>
      </section>

      {/* 2. Hospital introduction */}
      <ContentSection>
        <SectionHeading
          eyebrow="About the hospital"
          title="A hospital organised around the people it serves"
          description="Clear departments, verified clinician profiles and practical visit information, kept accurate by the hospital team."
          link={{ label: "About us", to: "/about" }}
        />
      </ContentSection>

      {/* 3. Departments */}
      <ContentSection muted>
        <SectionHeading eyebrow="Specialties" title="Departments and specialties" description="Explore the clinical areas of the hospital." link={{ label: "All departments", to: "/departments" }} />
        <Async
          query={departments}
          isEmpty={(data) => data.length === 0}
          empty={<UnpublishedPanel title="Departments are being prepared" description="No departments have been published yet." />}
        >
          {(data) => <Grid>{data.slice(0, 6).map((item) => <DepartmentCard key={item.id} department={item} />)}</Grid>}
        </Async>
      </ContentSection>

      {/* 4. Professional services */}
      <ContentSection>
        <SectionHeading eyebrow="Specialist support" title="Professional services" description="Specialist clinical and professional support for individual care needs." link={{ label: "All services", to: "/services" }} />
        <Async
          query={professional}
          isEmpty={(data) => data.length === 0}
          empty={<UnpublishedPanel title="Professional services are being prepared" description="No professional services have been published yet." />}
        >
          {(data) => <Grid>{data.slice(0, 6).map((item) => <ProfessionalServiceCard key={item.id} service={item} />)}</Grid>}
        </Async>
      </ContentSection>

      {/* 5. Hospital services */}
      <ContentSection muted>
        <SectionHeading eyebrow="Hospital care" title="Hospital services" description="Clinical, diagnostic and support services available across the hospital." link={{ label: "All services", to: "/services" }} />
        <Async
          query={hospital}
          isEmpty={(data) => data.length === 0}
          empty={<UnpublishedPanel title="Hospital services are being prepared" description="No hospital services have been published yet." />}
        >
          {(data) => <Grid>{data.slice(0, 6).map((item) => <HospitalServiceCard key={item.id} service={item} />)}</Grid>}
        </Async>
      </ContentSection>

      {/* 6. Doctors */}
      <ContentSection>
        <SectionHeading eyebrow="Medical team" title="Meet our doctors" description="Verified clinician profiles with qualifications, specialties and availability." link={{ label: "All doctors", to: "/doctors" }} />
        <Async
          query={doctors}
          isEmpty={(data) => data.length === 0}
          empty={<UnpublishedPanel title="Doctor profiles are being prepared" description="No clinician profiles have been published yet." />}
        >
          {(data) => <Grid>{data.slice(0, 6).map((item) => <DoctorCard key={item.id} doctor={item} />)}</Grid>}
        </Async>
      </ContentSection>

      {/* 7. Facilities */}
      <ContentSection muted>
        <SectionHeading eyebrow="Hospital environment" title="Facilities" description="Practical details and approved images to help you prepare for a visit." link={{ label: "All facilities", to: "/facilities" }} />
        <Async
          query={facilities}
          isEmpty={(data) => data.length === 0}
          empty={<UnpublishedPanel title="Facility information is being prepared" description="No facilities have been published yet." />}
        >
          {(data) => <Grid>{data.slice(0, 6).map((item) => <FacilityCard key={item.id} facility={item} />)}</Grid>}
        </Async>
      </ContentSection>

      {/* 8. Reviews */}
      <ContentSection>
        <SectionHeading eyebrow="Patient voices" title="Patient reviews" description="Only reviewed and approved patient experiences appear here." link={{ label: "All reviews", to: "/reviews" }} />
        <Async
          query={reviews}
          isEmpty={(data) => data.length === 0}
          empty={<UnpublishedPanel title="No reviews are published yet" description="Verified patient feedback will appear here once approved." />}
        >
          {(data) => <div className="mt-8 grid gap-6 md:grid-cols-2">{data.slice(0, 4).map((item) => <ReviewCard key={item.id} review={item} />)}</div>}
        </Async>
      </ContentSection>

      {/* 9. FAQ */}
      <ContentSection muted>
        <SectionHeading eyebrow="Help centre" title="Frequently asked questions" description="Practical answers for patients, families and visitors." link={{ label: "All questions", to: "/faq" }} />
        <Async
          query={faq}
          isEmpty={(data) => data.faqs.length === 0}
          empty={<UnpublishedPanel title="Answers are being prepared" description="No questions have been published yet." />}
        >
          {(data) => (
            <Accordion type="single" collapsible className="mt-8 max-w-3xl">
              {data.faqs.slice(0, 6).map((item) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </Async>
      </ContentSection>

      {/* 10. Media and content */}
      <ContentSection>
        <SectionHeading eyebrow="Media" title="Videos, reels and podcasts" description="Watch and listen to content published by the hospital team." link={{ label: "All media", to: "/media" }} />
        <Async
          query={media}
          isEmpty={(data) => data.length === 0}
          empty={<UnpublishedPanel title="Media is being prepared" description="No media has been published yet." />}
        >
          {(data) => <div className="mt-8"><MediaGrid items={data} /></div>}
        </Async>
        <div className="mt-14">
          <SectionHeading eyebrow="Health resources" title="Latest articles" description="Health information reviewed before publication." link={{ label: "All articles", to: "/blog" }} />
          <Async
            query={posts}
            isEmpty={(data) => data.length === 0}
            empty={<UnpublishedPanel title="Articles are being prepared" description="No articles have been published yet." />}
          >
            {(data) => <Grid>{data.slice(0, 3).map((item) => <ArticleCard key={item.id} post={item} />)}</Grid>}
          </Async>
        </div>
      </ContentSection>

      {/* 11. Location and contact */}
      <ContentSection muted>
        <SectionHeading eyebrow="Visit us" title="Location and contact" description="Verified contact details for the hospital." link={{ label: "Contact page", to: "/contact" }} />
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="border border-border bg-background p-6">
            <MapPin className="text-primary" />
            <p className="mt-5 font-semibold">Address</p>
            <p className="mt-2 text-sm text-muted-foreground">{siteConfig.contact.address ?? "Not yet published"}</p>
          </div>
          <div className="border border-border bg-background p-6">
            <Phone className="text-primary" />
            <p className="mt-5 font-semibold">Phone</p>
            <p className="mt-2 text-sm text-muted-foreground">{siteConfig.contact.phone ?? "Not yet published"}</p>
          </div>
        </div>
      </ContentSection>

      {/* 12. Final enquiry CTA */}
      <ContentSection>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold sm:text-4xl">Request an appointment or ask a question</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Send your details and the hospital team will follow up on the number you share.
            </p>
            <Link to="/doctors" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              Browse doctors first <ArrowRight className="size-4" />
            </Link>
          </div>
          <EnquiryForm source="home" />
        </div>
      </ContentSection>
    </PublicPage>
  );
}
