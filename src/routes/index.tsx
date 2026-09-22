import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  HeartPulse,
  Layers,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { PublicPage } from "@/components/layout/public-page";
import { ContentSection, SectionHeading, UnpublishedPanel } from "@/components/shared/page";
import { Async } from "@/components/shared/async";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

function Grid({ children, cols = 3 }: { children: ReactNode; cols?: 2 | 3 }) {
  return (
    <div
      className={`mt-5 grid gap-4 sm:grid-cols-2 ${cols === 3 ? "lg:grid-cols-3" : ""}`}
    >
      {children}
    </div>
  );
}

const patientActions = [
  {
    title: "Find a doctor",
    description: "Verified clinician profiles",
    to: "/doctors" as const,
    icon: UserRound,
  },
  {
    title: "Departments",
    description: "Clinical specialties",
    to: "/departments" as const,
    icon: Building2,
  },
  {
    title: "Services",
    description: "Professional & hospital care",
    to: "/services" as const,
    icon: Stethoscope,
  },
  {
    title: "Facilities",
    description: "Prepare for your visit",
    to: "/facilities" as const,
    icon: Layers,
  },
  {
    title: "Contact us",
    description: "Enquiries & appointments",
    to: "/contact" as const,
    icon: CalendarDays,
  },
];

const trustPoints = [
  { label: "Multi-speciality departments", icon: Building2 },
  { label: "Verified clinician profiles", icon: ShieldCheck },
  { label: "Patient-first information", icon: HeartPulse },
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
      {/* 1. Hero — compact */}
      <section className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Compassion · Expertise · Care
              </p>
              <h1 className="mt-2 max-w-2xl text-3xl font-semibold leading-[1.15] text-foreground sm:text-4xl lg:text-5xl">
                Your health,
                <br />
                <span className="text-primary">our commitment.</span>
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                {siteConfig.name} brings departments, specialists and support services together so
                patients and families always know where to turn.
              </p>
              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                <Button
                  asChild
                  className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
                >
                  <Link to="/contact">
                    <CalendarDays />
                    Request appointment
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/doctors">
                    <Search />
                    Find a doctor
                  </Link>
                </Button>
              </div>
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                {trustPoints.map((point) => (
                  <li
                    key={point.label}
                    className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"
                  >
                    <point.icon className="size-4 text-primary" />
                    {point.label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-primary/15 bg-background p-4 shadow-[var(--shadow-md)] sm:p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                Find the right care
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Quick links to help you.</p>
              <div className="mt-3 grid gap-1.5">
                {patientActions.slice(0, 4).map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground hover:border-primary/35 hover:bg-secondary"
                  >
                    <action.icon className="size-4 text-primary" />
                    <span>{action.title}</span>
                    <ArrowRight className="ml-auto size-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quick action strip */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden bg-border px-0 sm:grid-cols-3 lg:grid-cols-5">
          {patientActions.map((action) => (
            <Link
              key={`strip-${action.to}`}
              to={action.to}
              className="group flex flex-col items-center gap-1 bg-background px-3 py-4 text-center hover:bg-secondary"
            >
              <action.icon className="size-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">{action.title}</span>
              <span className="text-xs text-muted-foreground">{action.description}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Departments */}
      <ContentSection muted>
        <SectionHeading
          eyebrow="Our departments"
          title="Comprehensive care under one roof"
          description="Explore the clinical areas of the hospital."
          link={{ label: "All departments", to: "/departments" }}
        />
        <Async
          query={departments}
          isEmpty={(data) => data.length === 0}
          empty={
            <UnpublishedPanel
              title="Departments are being prepared"
              description="No departments have been published yet."
            />
          }
        >
          {(data) => (
            <Grid>
              {data.slice(0, 6).map((item) => (
                <DepartmentCard key={item.id} department={item} />
              ))}
            </Grid>
          )}
        </Async>
      </ContentSection>

      {/* 4. Doctors */}
      <ContentSection>
        <SectionHeading
          eyebrow="Our doctors"
          title="Meet our expert doctors"
          description="Verified clinician profiles with qualifications and specialties."
          link={{ label: "All doctors", to: "/doctors" }}
        />
        <Async
          query={doctors}
          isEmpty={(data) => data.length === 0}
          empty={
            <UnpublishedPanel
              title="Doctor profiles are being prepared"
              description="No clinician profiles have been published yet."
            />
          }
        >
          {(data) => (
            <div className="mt-5 grid gap-4 grid-cols-2 lg:grid-cols-4">
              {data.slice(0, 4).map((item) => (
                <DoctorCard key={item.id} doctor={item} />
              ))}
            </div>
          )}
        </Async>
      </ContentSection>

      {/* 5. Services — professional and hospital side by side */}
      <ContentSection muted>
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Specialist support"
              title="Professional services"
              description="Specialist clinical and professional support for individual care needs."
              link={{ label: "All services", to: "/services" }}
            />
            <Async
              query={professional}
              isEmpty={(data) => data.length === 0}
              empty={
                <UnpublishedPanel
                  title="Professional services are being prepared"
                  description="No professional services have been published yet."
                />
              }
            >
              {(data) => (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {data.slice(0, 4).map((item) => (
                    <ProfessionalServiceCard key={item.id} service={item} />
                  ))}
                </div>
              )}
            </Async>
          </div>
          <div>
            <SectionHeading
              eyebrow="Hospital care"
              title="Hospital services"
              description="Clinical, diagnostic and support services across the hospital."
              link={{ label: "All services", to: "/services" }}
            />
            <Async
              query={hospital}
              isEmpty={(data) => data.length === 0}
              empty={
                <UnpublishedPanel
                  title="Hospital services are being prepared"
                  description="No hospital services have been published yet."
                />
              }
            >
              {(data) => (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {data.slice(0, 4).map((item) => (
                    <HospitalServiceCard key={item.id} service={item} />
                  ))}
                </div>
              )}
            </Async>
          </div>
        </div>
      </ContentSection>

      {/* 6. Facilities */}
      <ContentSection>
        <SectionHeading
          eyebrow="Hospital environment"
          title="Facilities"
          description="Practical details and approved images to help you prepare for a visit."
          link={{ label: "All facilities", to: "/facilities" }}
        />
        <Async
          query={facilities}
          isEmpty={(data) => data.length === 0}
          empty={
            <UnpublishedPanel
              title="Facility information is being prepared"
              description="No facilities have been published yet."
            />
          }
        >
          {(data) => (
            <Grid>
              {data.slice(0, 3).map((item) => (
                <FacilityCard key={item.id} facility={item} />
              ))}
            </Grid>
          )}
        </Async>
      </ContentSection>

      {/* 7. Media and reviews */}
      <ContentSection muted>
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Media"
              title="Videos, reels and podcasts"
              description="Watch and listen to content published by the hospital team."
              link={{ label: "All media", to: "/media" }}
            />
            <Async
              query={media}
              isEmpty={(data) => data.length === 0}
              empty={
                <UnpublishedPanel
                  title="Media is being prepared"
                  description="No media has been published yet."
                />
              }
            >
              {(data) => (
                <div className="mt-5">
                  <MediaGrid items={data.slice(0, 4)} />
                </div>
              )}
            </Async>
          </div>
          <div>
            <SectionHeading
              eyebrow="Patient voices"
              title="What our patients say"
              description="Only reviewed and approved patient experiences appear here."
              link={{ label: "All reviews", to: "/reviews" }}
            />
            <Async
              query={reviews}
              isEmpty={(data) => data.length === 0}
              empty={
                <UnpublishedPanel
                  title="No reviews are published yet"
                  description="Verified patient feedback will appear here once approved."
                />
              }
            >
              {(data) => {
                const selected = [
                  ...data.filter((item) => !item.doctor),
                  ...data.filter((item) => item.doctor),
                ].slice(0, 2);
                return (
                  <div className="mt-5 grid gap-4">
                    {selected.map((item) => (
                      <ReviewCard key={item.id} review={item} />
                    ))}
                  </div>
                );
              }}
            </Async>
          </div>
        </div>
      </ContentSection>

      {/* 8. Health resources */}
      <ContentSection>
        <SectionHeading
          eyebrow="Health resources"
          title="Latest articles"
          description="Health information reviewed before publication."
          link={{ label: "All articles", to: "/blog" }}
        />
        <Async
          query={posts}
          isEmpty={(data) => data.length === 0}
          empty={
            <UnpublishedPanel
              title="Articles are being prepared"
              description="No articles have been published yet."
            />
          }
        >
          {(data) => (
            <Grid>
              {data.slice(0, 3).map((item) => (
                <ArticleCard key={item.id} post={item} />
              ))}
            </Grid>
          )}
        </Async>
      </ContentSection>

      {/* 9. FAQ and visit details */}
      <ContentSection muted>
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <SectionHeading
              eyebrow="Help centre"
              title="Frequently asked questions"
              description="Practical answers for patients, families and visitors."
              link={{ label: "All questions", to: "/faq" }}
            />
            <Async
              query={faq}
              isEmpty={(data) => data.faqs.length === 0}
              empty={
                <UnpublishedPanel
                  title="Answers are being prepared"
                  description="No questions have been published yet."
                />
              }
            >
              {(data) => (
                <Accordion type="single" collapsible className="mt-4">
                  {data.faqs.slice(0, 5).map((item) => (
                    <AccordionItem key={item.id} value={item.id}>
                      <AccordionTrigger className="text-left text-sm">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm">{item.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </Async>
          </div>
          <div className="grid content-start gap-3">
            <div className="rounded-lg border border-border bg-background p-4">
              <MapPin className="size-5 text-primary" />
              <p className="mt-2 text-sm font-semibold">Address</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {siteConfig.contact.address ?? "Not yet published"}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <Phone className="size-5 text-primary" />
              <p className="mt-2 text-sm font-semibold">Phone</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {siteConfig.contact.phone ?? "Not yet published"}
              </p>
            </div>
            <Link
              to="/contact"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Contact the hospital <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </ContentSection>

      {/* 10. Enquiry CTA */}
      <ContentSection>
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Request an appointment or ask a question
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Send your details and the hospital team will follow up on the number you share.
            </p>
            <Link
              to="/doctors"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              Browse doctors first <ArrowRight className="size-4" />
            </Link>
          </div>
          <EnquiryForm source="home" />
        </div>
      </ContentSection>
    </PublicPage>
  );
}
