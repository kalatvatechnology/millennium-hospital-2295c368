import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Plus, UserRound } from "lucide-react";
import { useState } from "react";
import { PublicPage } from "@/components/layout/public-page";
import { Async } from "@/components/shared/async";
import { ContentSection, EmptyState } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { departmentQuery, faqQuery, type DoctorWithDepartment } from "@/lib/queries";
import { getDepartmentPresentation } from "@/lib/department-presentation";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/departments/$slug")({
  head: () => ({
    meta: createPageMeta("Department", "Specialist departments and clinical care at The Millennium Hospital."),
  }),
  validateSearch: (search: Record<string, unknown>): { preview?: boolean } =>
    search["preview"] === true || search["preview"] === "1" ? { preview: true } : {},
  component: DepartmentDetail,
});

// Master grid: same container as the site header, so every section shares its edges.
const wrap = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";
const eyebrow = "text-xs font-bold uppercase tracking-[0.18em]";

function DepartmentDetail() {
  const { slug } = Route.useParams();
  const { preview } = Route.useSearch();
  const query = useQuery(departmentQuery(slug, Boolean(preview)));
  return (
    <PublicPage>
      <Async query={query}>
        {(data) =>
          !data ? (
            <ContentSection>
              <EmptyState
                title="We couldn't find this department"
                description="It may not be published yet or the address may have changed."
                action={<Button asChild><Link to="/departments">View all departments</Link></Button>}
              />
            </ContentSection>
          ) : (
            <DepartmentView department={data.department} doctors={data.doctors} />
          )
        }
      </Async>
    </PublicPage>
  );
}

type Dept = { name: string; slug: string; description: string | null; short_description?: string | null; card_image_url?: string | null; card_image_alt?: string | null };

const APPROACH = [
  ["Specialist-led care", "Consultations with clinicians focused on their field."],
  ["Coordinated treatment", "Departments working together across your care."],
  ["Modern clinical environment", "Care delivered within a multi-specialty hospital."],
  ["Patient-focused recovery", "Clear guidance from diagnosis through recovery."],
] as const;

function DepartmentView({ department, doctors }: { department: Dept; doctors: DoctorWithDepartment[] }) {
  const p = getDepartmentPresentation(department.slug);
  // A CMS card image always wins; the presentation image is a replaceable design placeholder.
  const heroImage = department.card_image_url ?? p?.heroImage ?? null;
  const heroAlt = department.card_image_alt ?? `${department.name} care at The Millennium Hospital`;
  const lead = department.short_description ?? p?.lead ?? department.description ?? "";
  const about = department.description ?? p?.lead ?? null;
  const lower = department.name.toLowerCase();

  return (
    <div className="dept-page overflow-x-clip">
      {/* 01 HERO */}
      <section className="relative bg-background">
        <div className={`${wrap} grid lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] lg:min-h-[36rem]`}>
          <div className="dept-reveal flex flex-col justify-center pb-6 pt-8 sm:pt-10 lg:py-14 lg:pr-10">
            <nav aria-label="Breadcrumb" className={`${eyebrow} flex items-center gap-3 text-muted-foreground`}>
              <Link to="/departments" className="hover:text-primary">Departments</Link>
              <span className="h-px w-6 bg-brand-accent" aria-hidden />
              <span className="text-primary">{department.name}</span>
            </nav>
            <h1 className="mt-6 min-w-0 break-normal font-heading text-[2.35rem] font-semibold uppercase leading-[1] tracking-[-0.02em] text-foreground [hyphens:none] min-[380px]:text-[2.6rem] sm:text-[3.4rem] lg:text-[2.6rem] xl:text-[3.5rem] 2xl:text-[3.9rem]">
              {p ? p.heroLines.map((l, i) => (
                <span key={l} className={`block sm:whitespace-nowrap ${i === p.heroLines.length - 1 ? "text-primary" : ""}`}>{l}</span>
              )) : department.name}
            </h1>
            {lead ? <p className="mt-6 max-w-[30rem] border-l-2 border-brand-accent pl-5 text-lg leading-8 text-muted-foreground">{lead}</p> : null}
            <div className="mt-8 hidden flex-wrap gap-3 lg:flex"><HeroActions /></div>
          </div>
          <figure className="dept-reveal relative lg:my-0">
            <div className="group relative aspect-[6/7] overflow-hidden bg-secondary sm:aspect-[16/12] lg:absolute lg:inset-0 lg:aspect-auto">
              {heroImage ? (
                <img src={heroImage} alt={heroAlt} className="size-full object-cover object-[center_28%] transition-transform duration-[1200ms] group-hover:scale-[1.02]" width={1280} height={1536} />
              ) : (
                <div className="grid size-full place-items-center bg-primary text-primary-foreground"><span className="font-heading text-8xl font-semibold opacity-20">{department.name.slice(0, 2)}</span></div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-foreground/55 to-transparent" aria-hidden />
            </div>
            <span className="absolute left-0 top-12 z-10 h-28 w-1.5 bg-brand-accent lg:-left-[3px] lg:top-24 lg:h-40" aria-hidden />
            <figcaption className="absolute bottom-5 left-5 right-5 z-10 flex items-end justify-between gap-4 text-primary-foreground sm:bottom-8 sm:left-8 sm:right-8">
              <span className={`${eyebrow} opacity-90`}>The Millennium Hospital</span>
              <span className="font-heading text-sm font-semibold">Dept. / {department.name}</span>
            </figcaption>
          </figure>
          <div className="flex flex-col gap-3 pb-8 pt-5 sm:flex-row lg:hidden"><HeroActions /></div>
        </div>
      </section>

      {/* 02 ABOUT */}
      {about ? (
        <section className="bg-background">
          <div className={`${wrap} grid gap-6 py-12 sm:py-16 lg:grid-cols-[0.3fr_0.7fr] lg:gap-10`}>
            <div className="flex items-start gap-5 lg:flex-col lg:gap-4">
              <BigNumber n="01" />
              <p className={`${eyebrow} pt-3 text-muted-foreground lg:pt-0`}>About the<br className="hidden lg:block" /> department</p>
            </div>
            <div className="dept-reveal">
              <h2 className="max-w-3xl text-3xl font-semibold leading-[1.15] sm:text-[2.75rem]">{p?.introHeading ?? `About ${department.name}`}</h2>
              <p className="mt-5 max-w-[40rem] whitespace-pre-line text-lg leading-8 text-muted-foreground">{about}</p>
              {p ? (
                <dl className="mt-8 grid sm:grid-cols-2 xl:grid-cols-4">
                  {p.highlights.map((h, i) => (
                    <div key={h.title} className={`border-t border-border py-5 sm:pr-6 xl:border-l xl:border-t-0 xl:py-1 xl:pl-6 ${i === 0 ? "xl:border-l-0 xl:pl-0" : ""}`}>
                      <span className="block h-0.5 w-6 bg-brand-accent" aria-hidden />
                      <dt className="mt-4 font-heading text-base font-semibold text-foreground">{h.title}</dt>
                      <dd className="mt-2 text-sm leading-6 text-muted-foreground">{h.text}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* 03 SPECIALIZED CARE */}
      {p ? (
        <section className="bg-secondary">
          <div className={`${wrap} grid gap-8 py-12 sm:py-16 lg:grid-cols-[0.4fr_0.6fr] lg:gap-16`}>
            <div className="lg:sticky lg:top-28 lg:self-start">
              <Label n="02" text="Specialized care" />
              <h2 className="mt-4 text-3xl font-semibold leading-[1.1] sm:text-[2.75rem]">Specialized<br />{department.name} Care</h2>
              <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground">{p.careIntro}</p>
            </div>
            <ol className="border-t border-foreground/20">
              {p.careAreas.map((a, i) => (
                <li key={a.title} className="group relative grid grid-cols-[2.75rem_1fr_auto] items-center gap-3 border-b border-foreground/20 py-5 transition-colors hover:bg-background/70 sm:grid-cols-[4.5rem_1fr_auto] sm:py-5">
                  <span className="absolute left-0 top-0 h-full w-0.5 origin-top scale-y-0 bg-brand-accent transition-transform duration-300 group-hover:scale-y-100" aria-hidden />
                  <span className="pl-2 font-heading text-sm font-semibold tabular-nums text-brand-accent sm:pl-4">{String(i + 1).padStart(2, "0")}</span>
                  <div className="transition-transform duration-300 group-hover:translate-x-1.5">
                    <h3 className="text-xl font-semibold sm:text-[1.65rem]">{a.title}</h3>
                    <p className="mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">{a.text}</p>
                  </div>
                  <ArrowRight className="mr-2 size-5 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-accent sm:mr-4" aria-hidden />
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* 04 CONDITIONS — signature typographic spread */}
      {p ? (
        <section className="bg-background">
          <div className={`${wrap} py-12 sm:py-16`}>
            <div className="grid gap-6 lg:grid-cols-[0.28fr_0.72fr] lg:gap-12">
              <div>
                <Label n="03" text="Conditions" />
                <h2 className="mt-4 font-heading text-2xl font-semibold uppercase leading-tight tracking-[0.04em] text-primary sm:text-3xl">Conditions<br />we treat</h2>
              </div>
              <ul className="flex flex-wrap items-baseline gap-x-3 gap-y-1 sm:gap-x-4" aria-label={`Conditions treated by ${department.name}`}>
                {p.conditions.map((c, i) => (
                  <li key={c} className="font-heading text-[1.9rem] font-medium leading-[1.25] tracking-[-0.02em] text-foreground transition-colors hover:text-primary sm:text-5xl xl:text-[3.6rem]">
                    {c}{i < p.conditions.length - 1 ? <span className="ml-3 font-light text-brand-accent sm:ml-4" aria-hidden>/</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {/* 05 SPECIALISTS */}
      <section id="specialists" className="scroll-mt-24 bg-primary text-primary-foreground">
        <div className={`${wrap} ${doctors.length ? "py-16 sm:py-24" : "py-12 sm:py-16"}`}>
          <div className={`grid lg:grid-cols-[0.4fr_0.6fr] ${doctors.length ? "gap-10 lg:gap-16" : "gap-6 lg:items-end lg:gap-16"}`}>
            <div>
              <Label n="04" text="Our specialists" dark />
              <h2 className="mt-4 font-heading text-3xl font-semibold uppercase leading-[1.02] tracking-[-0.01em] sm:text-5xl">Meet our<br />{department.name}<br />specialists</h2>
              <p className="mt-4 max-w-sm leading-7 text-primary-foreground/75">Clinicians in this department, connected to their full Millennium Hospital profiles.</p>
              <Link to="/doctors" className="group mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
                View all doctors <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            {doctors.length ? <SpecialistShowcase doctors={doctors} /> : (
              <div className="border-t border-primary-foreground/25 pt-6">
                <div className="flex items-start gap-5">
                  <UserRound className="mt-1 size-6 shrink-0 text-primary-foreground/60" aria-hidden />
                  <div>
                    <p className="font-heading text-xl font-semibold">Specialist profiles are being prepared.</p>
                    <p className="mt-2 max-w-md text-sm leading-6 text-primary-foreground/70">Our team can help you arrange a consultation with the right {lower} specialist in the meantime.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 06 FACILITIES — cinematic */}
      {p ? (
        <section className="bg-foreground">
          <div className="relative">
            <div className="group relative aspect-[4/3] overflow-hidden sm:aspect-[16/9] lg:aspect-[21/8.5]">
              <img src={p.facilityImage} alt="Hospital clinical corridor with imaging and rehabilitation areas" className="size-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03]" loading="lazy" width={1600} height={1008} />
              <div className="absolute inset-0 hidden bg-gradient-to-r from-foreground/85 via-foreground/40 to-transparent lg:block" aria-hidden />
            </div>
            <div className="bg-background lg:absolute lg:inset-0 lg:bg-transparent"><div className={`${wrap} py-10 lg:flex lg:h-full lg:flex-col lg:justify-center lg:py-0 lg:text-primary-foreground`}><div className="lg:max-w-md">
              <Label n="05" text="Facilities" darkLg />
              <h2 className="mt-4 font-heading text-3xl font-semibold uppercase leading-[1.05] sm:text-[2.6rem]">Advanced facilities<br />&amp; technology</h2>
              <p className="mt-4 leading-7 text-muted-foreground lg:text-primary-foreground/80">{p.facilityText}</p>
              <ul className="mt-6 space-y-2.5">
                {p.facilityPoints.map((f) => (
                  <li key={f} className="flex items-center gap-4 text-sm font-semibold"><span className="h-px w-6 bg-brand-accent" aria-hidden />{f}</li>
                ))}
              </ul>
              <Link to="/facilities" className="group mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary lg:text-primary-foreground">
                Explore hospital facilities <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div></div></div>
          </div>
        </section>
      ) : null}

      {/* 07 THE MILLENNIUM APPROACH */}
      <section className="bg-secondary">
        <div className={`${wrap} py-12 sm:py-16`}>
          <div className="grid gap-6 lg:grid-cols-[0.5fr_0.5fr] lg:items-end">
            <div>
              <Label n="06" text="The Millennium approach" />
              <h2 className="mt-4 font-heading text-4xl font-semibold uppercase leading-[1] tracking-[-0.01em] sm:text-[3.4rem]">Care,<br />coordinated<br /><span className="text-primary">around you.</span></h2>
            </div>
            <p className="max-w-md leading-7 text-muted-foreground lg:justify-self-end">{department.name} is part of a wider multi-specialty hospital, so care can draw on colleagues across departments when you need it.</p>
          </div>
          <ol className="mt-8 grid border-t border-foreground/20 sm:grid-cols-2 lg:grid-cols-4">
            {APPROACH.map(([t, d], i) => (
              <li key={t} className="border-b border-foreground/20 py-6 sm:pr-8 lg:border-b-0 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0">
                <span className="font-heading text-sm font-semibold text-brand-accent">{String(i + 1).padStart(2, "0")}</span>
                <p className="mt-4 font-heading text-xl font-semibold">{t}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 08 FAQ — only when department FAQs exist; media is hidden until the CMS links it. */}
      <DepartmentFaqs departmentName={department.name} />

      {/* 09 CTA */}
      <section className="relative bg-sidebar text-sidebar-foreground">
        <span className="absolute left-1/2 top-0 h-10 w-px -translate-x-1/2 bg-brand-accent" aria-hidden />
        <div className={`${wrap} py-14 text-center sm:py-20`}>
          <p className={`${eyebrow} text-sidebar-foreground/65`}>Appointments</p>
          <h2 className="mx-auto mt-4 max-w-3xl font-heading text-4xl font-semibold uppercase leading-[1.02] sm:text-6xl">Ready to take<br />the next step?</h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-sidebar-foreground/80">Speak with our {lower} care team.</p>
          <div className="mx-auto mt-8 flex max-w-md flex-col justify-center gap-3 sm:max-w-none sm:flex-row">
            <Button asChild size="lg" className="min-h-12 bg-brand-accent px-7 text-brand-accent-foreground hover:bg-brand-accent/90">
              <Link to="/contact"><CalendarDays /> Book an Appointment</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-h-12 border-sidebar-foreground/40 bg-transparent px-7 text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground">
              <Link to="/contact">Contact Hospital</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroActions() {
  return (
    <>
      <Button asChild size="lg" className="min-h-12 bg-brand-accent px-7 text-brand-accent-foreground hover:bg-brand-accent/90">
        <Link to="/contact"><CalendarDays /> Book an Appointment</Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="group min-h-12 px-7">
        <a href="#specialists">Meet Our Specialists <ArrowRight className="transition-transform group-hover:translate-x-1" /></a>
      </Button>
    </>
  );
}

function BigNumber({ n }: { n: string }) {
  return <span className="font-heading text-6xl font-semibold leading-none tracking-[-0.04em] text-primary/15 sm:text-7xl lg:text-[6.5rem]" aria-hidden>{n}</span>;
}

function Label({ n, text, dark = false, darkLg = false }: { n: string; text: string; dark?: boolean; darkLg?: boolean }) {
  const tone = dark ? "text-primary-foreground/70" : darkLg ? "text-muted-foreground lg:text-primary-foreground/70" : "text-muted-foreground";
  return (
    <p className={`${eyebrow} flex items-center gap-3 ${tone}`}>
      <span className={`font-heading text-sm ${dark ? "text-primary-foreground" : "text-brand-accent"}`}>{n}</span>
      <span className="h-px w-6 bg-current opacity-40" aria-hidden />
      {text}
    </p>
  );
}

function SpecialistShowcase({ doctors }: { doctors: DoctorWithDepartment[] }) {
  const [active, setActive] = useState(0);
  const d = doctors[Math.min(active, doctors.length - 1)]!;
  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-[0.9fr_1.1fr] sm:items-end">
        <div className="aspect-[4/5] overflow-hidden bg-primary-foreground/10">
          {d.photo_url ? <img key={d.id} src={d.photo_url} alt={d.profile_image_alt ?? `Portrait of ${d.name}`} className="dept-reveal size-full object-cover" loading="lazy" /> : <div className="grid size-full place-items-center"><UserRound className="size-14 opacity-50" /></div>}
        </div>
        <div className="border-l-2 border-brand-accent pl-5">
          <p className="font-heading text-3xl font-semibold leading-tight">{d.name}</p>
          {d.designation ? <p className="mt-2 text-primary-foreground/80">{d.designation}</p> : null}
          {d.specialty ? <p className="mt-1 text-sm text-primary-foreground/60">{d.specialty}</p> : null}
          <Link to="/doctors/$slug" params={{ slug: d.slug }} className="group mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
            View Profile <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
      {doctors.length > 1 ? (
        <ul className="mt-8 flex gap-2 overflow-x-auto border-t border-primary-foreground/20 pt-5" aria-label="More specialists">
          {doctors.map((doc, i) => (
            <li key={doc.id}>
              <button type="button" aria-pressed={i === active} onClick={() => setActive(i)} className={`min-h-11 whitespace-nowrap px-3 text-sm font-semibold transition-colors ${i === active ? "border-b-2 border-brand-accent text-primary-foreground" : "text-primary-foreground/60 hover:text-primary-foreground"}`}>
                {doc.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function DepartmentFaqs({ departmentName }: { departmentName: string }) {
  const faqs = useQuery(faqQuery);
  const [open, setOpen] = useState<string | null>(null);
  const items = (faqs.data?.faqs ?? []).filter((f) => f.category?.toLowerCase() === departmentName.toLowerCase());
  if (!items.length) return null;
  return (
    <section className="bg-background">
      <div className={`${wrap} grid gap-6 py-14 sm:py-20 lg:grid-cols-[0.34fr_0.66fr] lg:gap-10`}>
        <div>
          <Label n="07" text="Questions" />
          <h2 className="mt-6 text-3xl font-semibold sm:text-4xl">Frequently asked questions</h2>
        </div>
        <div className="border-t border-border">
          {items.map((f) => {
            const isOpen = open === f.id;
            return (
              <div key={f.id} className="border-b border-border">
                <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : f.id)} className="flex min-h-16 w-full items-center justify-between gap-4 py-5 text-left font-heading text-lg font-semibold">
                  {f.question}
                  <Plus className={`size-5 shrink-0 text-brand-accent transition-transform ${isOpen ? "rotate-45" : ""}`} aria-hidden />
                </button>
                {isOpen ? <p className="pb-6 pr-10 leading-7 text-muted-foreground">{f.answer}</p> : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
