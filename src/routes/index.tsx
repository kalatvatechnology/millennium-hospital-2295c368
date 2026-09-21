import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, CalendarDays, MapPin, Phone, Search, Stethoscope, UserRound } from "lucide-react";
import type { ReactNode } from "react";
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

function Grid({ children }: { children: ReactNode }) {
  return <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

const patientActions = [
  { title: "Find a doctor", description: "Browse verified clinician profiles and specialties.", to: "/doctors" as const, icon: UserRound },
  { title: "Find a department", description: "Explore the hospital's clinical departments.", to: "/departments" as const, icon: Building2 },
  { title: "Explore services", description: "Understand professional and hospital services.", to: "/services" as const, icon: Stethoscope },
  { title: "Request appointment", description: "Send an enquiry for the hospital team to follow up.", to: "/contact" as const, icon: CalendarDays, accent: true },
];

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
      <section className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid items-end gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
            <div>
              <p className="inline-flex items-center gap-2 rounded-md bg-background px-3 py-1.5 text-sm font-bold text-primary shadow-[var(--shadow-sm)]"><span className="size-2 rounded-full bg-brand-accent" />{siteConfig.tagline}</p>
              <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-tight text-foreground sm:text-6xl">
                Care that listens.<br /><span className="text-primary">Expertise you can trust.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                {siteConfig.name} brings departments, specialists and support services together so patients and families always know where to turn.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"><Link to="/contact"><CalendarDays />Request appointment</Link></Button>
                <Button asChild size="lg" variant="outline"><Link to="/doctors"><Search />Find a doctor</Link></Button>
              </div>
            </div>
            <div className="rounded-lg border border-primary/15 bg-background p-6 shadow-[var(--shadow-lg)] sm:p-8">
              <p className="text-xs font-bold uppercase text-primary">Start here</p>
              <h2 className="mt-3 text-2xl font-semibold">How can we help today?</h2>
              <p className="mt-3 leading-7 text-muted-foreground">Choose a care pathway to find the right information quickly.</p>
              <div className="mt-6 grid gap-2">
                {patientActions.slice(0, 3).map((action) => <Link key={action.to} to={action.to} className="flex min-h-12 items-center gap-3 rounded-md border border-border px-3 py-2.5 font-semibold text-foreground hover:border-primary/35 hover:bg-secondary"><action.icon className="size-5 text-primary" /><span>{action.title}</span><ArrowRight className="ml-auto size-4 text-muted-foreground" /></Link>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {patientActions.map((action) => (
            <Link key={action.to} to={action.to} className={`group rounded-lg border p-5 shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] ${action.accent ? "border-brand-accent bg-brand-accent text-brand-accent-foreground" : "border-border bg-card text-foreground hover:border-primary/30"}`}>
              <action.icon className={`size-6 ${action.accent ? "text-brand-accent-foreground" : "text-primary"}`} />
              <h2 className="mt-5 text-lg font-semibold">{action.title}</h2>
              <p className={`mt-2 text-sm leading-6 ${action.accent ? "text-brand-accent-foreground/80" : "text-muted-foreground"}`}>{action.description}</p>
              <ArrowRight className="mt-4 size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
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
          {(data) => {
            const selected = [
              ...data.filter((item) => !item.doctor),
              ...data.filter((item) => item.doctor),
            ].slice(0, 4);
            return <div className="mt-8 grid gap-6 md:grid-cols-2">{selected.map((item) => <ReviewCard key={item.id} review={item} />)}</div>;
          }}
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
