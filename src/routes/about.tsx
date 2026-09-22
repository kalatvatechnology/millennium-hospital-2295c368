import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BedDouble,
  Building2,
  Clock3,
  HeartPulse,
  Home,
  Mail,
  MapPin,
  Phone,
  Stethoscope,
  UsersRound,
} from "lucide-react";
import { Async } from "@/components/shared/async";
import { PublicPage } from "@/components/layout/public-page";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import hospitalExteriorAsset from "@/assets/millennium-hospital-exterior.png.asset.json";
import { departmentsQuery, facilitiesQuery } from "@/lib/queries";
import { createPageMeta } from "@/lib/seo";

const pageDescription =
  "Learn about The Millennium Multispeciality Hospital and Diagnostic Centre, its approach to care, specialities, facilities and Navi Mumbai location.";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: createPageMeta("About The Millennium Hospital", pageDescription) }),
  component: AboutPage,
});

const facts = [
  { value: "50", label: "Bed Hospital", icon: BedDouble },
  { value: "10", label: "ICU Beds", note: "including step-down", icon: HeartPulse },
  { value: "Navi Mumbai", label: "Our Location", icon: MapPin },
  { value: "24 Hours", label: "Hospital Availability", icon: Clock3 },
] as const;

const approaches = [
  { title: "Multispeciality Care", icon: Stethoscope },
  { title: "Integrated Healthcare", icon: Building2 },
  { title: "Patient-Centred Care", icon: UsersRound },
  { title: "Accessible Healthcare", icon: HeartPulse },
] as const;

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="flex items-center justify-center gap-3">
        <span className="h-px w-9 bg-brand-accent" aria-hidden="true" />
        <p className="text-xs font-bold uppercase tracking-wide text-primary">{eyebrow}</p>
      </div>
      <h2 className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl">{title}</h2>
      {description ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
      ) : null}
    </div>
  );
}

function AboutPage() {
  const departments = useQuery(departmentsQuery);
  const facilities = useQuery(facilitiesQuery);

  return (
    <PublicPage>
      <section className="relative overflow-hidden bg-secondary">
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-5 sm:px-6 sm:pb-20 sm:pt-7 lg:min-h-[680px] lg:px-8 lg:pb-24">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/" className="inline-flex items-center gap-1.5">
                    <Home className="size-3.5" /> Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>About Us</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="relative mt-8 grid gap-9 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-4">
            <div className="relative z-10 lg:py-8">
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-brand-accent" aria-hidden="true" />
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  About The Millennium Hospital
                </p>
              </div>
              <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.12] text-foreground sm:text-5xl lg:text-6xl">
                About The <span className="text-primary">Millennium Hospital</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                The Millennium Multispeciality Hospital and Diagnostic Centre is a multispeciality
                hospital located in Navi Mumbai, providing a range of medical, surgical, diagnostic
                and supporting healthcare services under one roof.
              </p>

              <div className="mt-7 grid grid-cols-2 border-y border-primary/15 sm:grid-cols-4 lg:max-w-2xl">
                {facts.map((fact, index) => (
                  <div
                    key={fact.label}
                    className={`min-h-28 px-2 py-4 text-center ${index % 2 ? "border-l border-primary/15" : ""} ${index > 1 ? "border-t border-primary/15 sm:border-t-0" : ""} sm:border-l sm:first:border-l-0`}
                  >
                    <fact.icon className="mx-auto size-5 text-brand-accent" strokeWidth={1.8} />
                    <p className="mt-2 text-sm font-bold text-foreground">{fact.value}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{fact.label}</p>
                    {"note" in fact ? (
                      <p className="text-[11px] text-muted-foreground">({fact.note})</p>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="mt-7 grid gap-3 sm:flex">
                <Button asChild size="lg">
                  <Link to="/services">
                    Explore Our Services <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>

            <div className="relative min-h-72 overflow-hidden rounded-md sm:min-h-96 lg:absolute lg:-right-[max(2rem,calc((100vw-80rem)/2))] lg:bottom-0 lg:top-0 lg:w-[58%] lg:rounded-none">
              <img
                src={hospitalExteriorAsset.url}
                alt="The Millennium Multispeciality Hospital at NMS Icon in Navi Mumbai"
                fetchPriority="high"
                className="absolute inset-0 size-full object-cover object-[62%_center] sm:object-center"
              />
              <div
                className="absolute inset-0 bg-gradient-to-r from-secondary/45 via-transparent to-transparent lg:from-secondary lg:via-secondary/20 lg:to-transparent"
                aria-hidden="true"
              />
              <div
                className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-secondary/80 to-transparent"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
        <div
          className="pointer-events-none absolute -bottom-px left-0 right-0 h-10 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute -bottom-8 -left-[5%] h-16 w-[110%] rounded-[50%_50%_0_0] bg-background" />
        </div>
      </section>

      <section className="bg-background px-4 pb-12 pt-8 sm:px-6 sm:pb-16 lg:px-8">
        <SectionTitle
          eyebrow="Our Story"
          title="A Commitment to Better Healthcare"
          description="Serving the people of Navi Mumbai with compassionate, comprehensive and accessible healthcare."
        />
        <div className="mx-auto mt-9 grid max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <h3 className="text-xl font-semibold">Care under one roof</h3>
            <p className="mt-3 leading-7 text-muted-foreground">
              The Millennium Multispeciality Hospital and Diagnostic Centre brings medical,
              surgical, diagnostic and supporting healthcare services together in Navi Mumbai.
            </p>
            <p className="mt-4 leading-7 text-muted-foreground">
              Our public information is designed to help patients and families find departments,
              doctors, services and practical hospital details clearly.
            </p>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-md">
            <img
              src={hospitalExteriorAsset.url}
              alt="Entrance of The Millennium Multispeciality Hospital"
              loading="lazy"
              className="size-full object-cover object-[55%_72%]"
            />
            <div
              className="absolute inset-0 ring-1 ring-inset ring-primary/10"
              aria-hidden="true"
            />
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-secondary/55">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <SectionTitle eyebrow="How We Care" title="Our Approach to Healthcare" />
          <div className="mt-8 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {approaches.map((item) => (
              <div key={item.title} className="bg-background p-5">
                <item.icon className="size-6 text-brand-accent" strokeWidth={1.7} />
                <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <SectionTitle
            eyebrow="Clinical Care"
            title="Our Specialities"
            description="Explore departments currently published by the hospital team."
          />
          <div className="mt-8">
            <Async
              query={departments}
              isEmpty={(data) => data.length === 0}
              empty={
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Specialities are being prepared for publication.
                </p>
              }
            >
              {(data) => (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {data.map((department) => (
                    <Link
                      key={department.id}
                      to="/departments/$slug"
                      params={{ slug: department.slug }}
                      className="group flex min-h-20 items-center gap-3 rounded-md border border-border bg-card p-4 shadow-[var(--shadow-sm)] hover:border-primary/35 hover:shadow-[var(--shadow-md)]"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-primary">
                        <HeartPulse className="size-4" />
                      </span>
                      <span className="text-sm font-semibold">{department.name}</span>
                      <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                    </Link>
                  ))}
                </div>
              )}
            </Async>
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-secondary/55">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <SectionTitle
            eyebrow="The Hospital"
            title="Our Hospital Infrastructure"
            description="Published hospital facilities and real images from the hospital team."
          />
          <div className="mt-8">
            <Async
              query={facilities}
              isEmpty={(data) => data.length === 0}
              empty={
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Facility information is being prepared for publication.
                </p>
              }
            >
              {(data) => {
                const pictured = data.filter((facility) => facility.images.length > 0).slice(0, 5);
                if (pictured.length === 0)
                  return (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Approved hospital photographs are being prepared.
                    </p>
                  );
                return (
                  <div className="grid auto-rows-[180px] gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {pictured.map((facility, index) => (
                      <Link
                        key={facility.id}
                        to="/facilities/$slug"
                        params={{ slug: facility.slug }}
                        className={`group relative overflow-hidden rounded-md ${index === 0 ? "sm:row-span-2 lg:col-span-2" : ""}`}
                      >
                        <img
                          src={facility.images[0]}
                          alt={facility.name}
                          loading="lazy"
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/10 to-transparent"
                          aria-hidden="true"
                        />
                        <h3 className="absolute inset-x-0 bottom-0 p-4 text-sm font-semibold text-primary-foreground">
                          {facility.name}
                        </h3>
                      </Link>
                    ))}
                  </div>
                );
              }}
            </Async>
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-9 bg-brand-accent" aria-hidden="true" />
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Our Location</p>
            </div>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Caring for Navi Mumbai</h2>
            <p className="mt-3 max-w-xl leading-7 text-muted-foreground">
              The Millennium Hospital is located at NMS Icon in Ulwe, Navi Mumbai.
            </p>
          </div>
          <address className="grid gap-px overflow-hidden rounded-md border border-border bg-border not-italic sm:grid-cols-2">
            <div className="bg-background p-5">
              <MapPin className="size-5 text-brand-accent" />
              <p className="mt-3 text-sm font-semibold">Address</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                4, 5 NMS Icon
                <br />
                Sector 19, Ulwe
                <br />
                Navi Mumbai, Maharashtra 410206
              </p>
            </div>
            <div className="bg-background p-5">
              <Phone className="size-5 text-brand-accent" />
              <p className="mt-3 text-sm font-semibold">Phone</p>
              <a
                href="tel:+919004070463"
                className="mt-1 inline-block text-sm text-primary hover:underline"
              >
                90040 70463
              </a>
            </div>
            <div className="bg-background p-5">
              <Mail className="size-5 text-brand-accent" />
              <p className="mt-3 text-sm font-semibold">Email</p>
              <a
                href="mailto:tmhulwe@gmail.com"
                className="mt-1 inline-block break-all text-sm text-primary hover:underline"
              >
                tmhulwe@gmail.com
              </a>
            </div>
            <div className="bg-background p-5">
              <Clock3 className="size-5 text-brand-accent" />
              <p className="mt-3 text-sm font-semibold">Availability</p>
              <p className="mt-1 text-sm text-muted-foreground">Mon To Sun: Open 24 Hrs</p>
            </div>
          </address>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Your Healthcare Journey Starts Here
            </h2>
            <p className="mt-3 text-sm leading-6 text-primary-foreground/80 sm:text-base">
              Explore our doctors, departments and healthcare services, or contact Millennium
              Hospital for assistance.
            </p>
          </div>
          <div className="grid shrink-0 gap-3 sm:flex">
            <Button asChild size="lg" className="bg-background text-primary hover:bg-background/90">
              <Link to="/doctors">View Our Doctors</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
            >
              <Link to="/contact">
                Make an Enquiry <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
