import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, CalendarDays, Plus, UserRound } from "lucide-react";
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

const wrap = "mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-10";
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

function DepartmentView({ department, doctors }: { department: Dept; doctors: DoctorWithDepartment[] }) {
  const p = getDepartmentPresentation(department.slug);
  const heroImage = department.card_image_url ?? p?.heroImage ?? null;
  const lead = department.short_description ?? p?.lead ?? department.description ?? "";
  const about = department.description ?? p?.lead ?? null;
  let n = 0;
  const idx = () => String(++n).padStart(2, "0");

  return (
    <div className="dept-page">
      {/* 01 HERO */}
      <section className="relative overflow-hidden bg-background">
        <div className={`${wrap} grid items-center gap-8 py-10 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-20`}>
          <div className="dept-reveal">
            <Link to="/departments" className="text-xs font-semibold text-muted-foreground hover:text-primary">Departments</Link>
            <p className={`${eyebrow} mt-6 flex items-center gap-3 text-primary`}>
              <span className="h-px w-8 bg-brand-accent" aria-hidden />
              {department.name}
            </p>
            <h1 className="mt-5 text-[2.35rem] font-semibold leading-[1.08] text-foreground sm:text-5xl lg:text-[3.6rem]">
              {p ? <>{p.headline[0]}<br /><span className="text-primary">{p.headline[1]}</span></> : department.name}
            </h1>
            {lead ? <p className="mt-6 max-w-[34rem] text-lg leading-8 text-muted-foreground">{lead}</p> : null}
            <div className="mt-8 hidden flex-wrap gap-3 lg:flex"><HeroActions /></div>
          </div>
          <div className="relative dept-reveal">
            <div className="absolute -left-4 top-10 bottom-10 hidden w-1 bg-brand-accent lg:block" aria-hidden />
            <div className="relative aspect-[4/5] overflow-hidden bg-secondary sm:aspect-[16/11] lg:aspect-[5/6]">
              {heroImage ? (
                <img src={heroImage} alt={department.card_image_alt ?? `${department.name} care at The Millennium Hospital`} className="size-full object-cover object-[center_30%]" width={1280} height={1536} />
              ) : (
                <div className="grid size-full place-items-center bg-primary text-primary-foreground"><span className="font-heading text-6xl font-semibold opacity-30">{department.name.slice(0, 2)}</span></div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-foreground/35 to-transparent" aria-hidden />
              <p className="absolute bottom-5 left-5 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground">The Millennium Hospital</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:hidden"><HeroActions /></div>
        </div>
      </section>

      {/* 02 INTRODUCTION */}
      {about ? (
        <section className="border-t border-border bg-background">
          <div className={`${wrap} grid gap-8 py-14 sm:py-20 lg:grid-cols-[0.35fr_0.65fr]`}>
            <Index n={idx()} label="About the department" />
            <div className="dept-reveal">
              <h2 className="max-w-2xl text-3xl font-semibold leading-tight sm:text-[2.4rem]">{p?.introHeading ?? `About ${department.name}`}</h2>
              <p className="mt-6 max-w-[40rem] whitespace-pre-line text-base leading-8 text-muted-foreground">{about}</p>
              {p ? (
                <dl className="mt-12 grid gap-x-10 gap-y-8 border-t border-border pt-8 sm:grid-cols-2 lg:grid-cols-4">
                  {p.highlights.map((h) => (
                    <div key={h.title}>
                      <dt className="flex items-center gap-2 font-heading text-sm font-semibold text-foreground"><span className="size-1.5 bg-brand-accent" aria-hidden />{h.title}</dt>
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
          <div className={`${wrap} grid gap-10 py-14 sm:py-20 lg:grid-cols-[0.42fr_0.58fr] lg:gap-16`}>
            <div className="lg:sticky lg:top-28 lg:self-start">
              <Index n={idx()} label="Specialized care" />
              <h2 className="mt-6 text-3xl font-semibold leading-tight sm:text-[2.4rem]">Specialized {department.name} Care</h2>
              <p className="mt-5 max-w-md leading-7 text-muted-foreground">{p.careIntro}</p>
            </div>
            <ol className="border-t border-foreground/15">
              {p.careAreas.map((a, i) => (
                <li key={a.title} className="group grid grid-cols-[3rem_1fr] gap-4 border-b border-foreground/15 py-6 sm:grid-cols-[4rem_1fr_auto] sm:items-baseline">
                  <span className="font-heading text-sm font-semibold text-brand-accent">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="text-xl font-semibold transition-colors group-hover:text-primary sm:text-2xl">{a.title}</h3>
                    <p className="mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">{a.text}</p>
                  </div>
                  <ArrowUpRight className="hidden size-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary sm:block" aria-hidden />
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* 04 CONDITIONS */}
      {p ? (
        <section className="bg-background">
          <div className={`${wrap} py-12 sm:py-16`}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-16">
              <div className="lg:w-[30%]">
                <Index n={idx()} label="Conditions" />
                <h2 className="mt-5 text-2xl font-semibold sm:text-3xl">Conditions We Treat</h2>
              </div>
              <ul className="flex flex-1 flex-wrap gap-x-2 gap-y-3 text-lg leading-snug sm:text-2xl">
                {p.conditions.map((c, i) => (
                  <li key={c} className="font-heading font-medium text-foreground">
                    {c}{i < p.conditions.length - 1 ? <span className="ml-2 text-brand-accent" aria-hidden>/</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {/* 05 SPECIALISTS */}
      <section id="specialists" className="scroll-mt-24 bg-primary text-primary-foreground">
        <div className={`${wrap} py-14 sm:py-20`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Index n={idx()} label="Our specialists" dark />
              <h2 className="mt-5 max-w-xl text-3xl font-semibold leading-tight sm:text-[2.4rem]">Meet Our {department.name} Specialists</h2>
            </div>
            <Link to="/doctors" className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary-foreground/85 hover:text-primary-foreground">
              All doctors <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          {doctors.length ? (
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {doctors.slice(0, 4).map((d) => <Specialist key={d.id} doctor={d} />)}
            </div>
          ) : (
            <div className="mt-10 grid gap-6 border-t border-primary-foreground/20 pt-8 sm:grid-cols-[auto_1fr] sm:items-center">
              <span className="grid size-14 place-items-center border border-primary-foreground/30"><UserRound className="size-6" /></span>
              <div>
                <p className="font-heading text-lg font-semibold">Specialist profiles are being prepared.</p>
                <p className="mt-1 max-w-xl text-sm leading-6 text-primary-foreground/75">Our team can help you arrange a consultation with the right {department.name.toLowerCase()} specialist in the meantime.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 06 FACILITIES */}
      {p ? (
        <section className="bg-background">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="group relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[34rem]">
              <img src={p.facilityImage} alt="Hospital clinical corridor with imaging and rehabilitation areas" className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" loading="lazy" width={1600} height={1008} />
            </div>
            <div className="flex flex-col justify-center px-4 py-12 sm:px-10 lg:px-14 lg:py-16">
              <Index n={idx()} label="Facilities" />
              <h2 className="mt-5 text-3xl font-semibold leading-tight">Advanced Facilities &amp; Technology</h2>
              <p className="mt-5 max-w-md leading-7 text-muted-foreground">{p.facilityText}</p>
              <ul className="mt-8 space-y-3 border-t border-border pt-6">
                {p.facilityPoints.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm font-semibold"><span className="h-px w-5 bg-brand-accent" aria-hidden />{f}</li>
                ))}
              </ul>
              <Link to="/facilities" className="group mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary">
                Explore hospital facilities <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* 07 WHY MILLENNIUM */}
      <section className="border-t border-border bg-secondary">
        <div className={`${wrap} py-14 sm:py-20`}>
          <div className="max-w-2xl">
            <Index n={idx()} label="Why Millennium" />
            <h2 className="mt-5 text-3xl font-semibold leading-tight sm:text-[2.4rem]">Care Built Around You</h2>
          </div>
          <div className="mt-10 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Specialist-led care", "Consultations with clinicians focused on their field."],
              ["Coordinated treatment", "Departments working together across your care."],
              ["Modern clinical environment", "Care delivered within a multi-specialty hospital."],
              ["Patient-focused recovery", "Clear guidance from diagnosis through recovery."],
            ].map(([t, d]) => (
              <div key={t} className="bg-secondary p-6 sm:p-7">
                <p className="font-heading text-lg font-semibold">{t}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 08 MEDIA — no department media relationship exists yet; hidden until CMS provides it. */}

      {/* 09 FAQ */}
      <DepartmentFaqs departmentName={department.name} index={idx} />

      {/* 10 CTA */}
      <section className="bg-background">
        <div className={`${wrap} py-12 sm:py-16`}>
          <div className="relative overflow-hidden bg-primary px-6 py-12 text-primary-foreground sm:px-12 sm:py-16">
            <span className="absolute left-0 top-0 h-full w-1.5 bg-brand-accent" aria-hidden />
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className={`${eyebrow} text-primary-foreground/70`}>Appointments</p>
                <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">Ready to take the next step?</h2>
                <p className="mt-3 max-w-lg text-primary-foreground/80">Speak with our {department.name.toLowerCase()} care team.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="min-h-12 bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90">
                  <Link to="/contact"><CalendarDays /> Book an Appointment</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="min-h-12 border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                  <Link to="/contact">Contact Hospital</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroActions() {
  return (
    <>
      <Button asChild size="lg" className="min-h-12 bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90">
        <Link to="/contact"><CalendarDays /> Book an Appointment</Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="group min-h-12">
        <a href="#specialists">Meet Our Specialists <ArrowRight className="transition-transform group-hover:translate-x-1" /></a>
      </Button>
    </>
  );
}

function Index({ n, label, dark = false }: { n: string; label: string; dark?: boolean }) {
  return (
    <p className={`${eyebrow} flex items-baseline gap-3 ${dark ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
      <span className={`font-heading text-sm ${dark ? "text-primary-foreground" : "text-brand-accent"}`}>{n}</span>
      {label}
    </p>
  );
}

function Specialist({ doctor }: { doctor: DoctorWithDepartment }) {
  return (
    <Link to="/doctors/$slug" params={{ slug: doctor.slug }} className="group block focus-visible:outline-offset-4">
      <div className="aspect-[4/5] overflow-hidden bg-primary-foreground/10">
        {doctor.photo_url ? (
          <img src={doctor.photo_url} alt={doctor.profile_image_alt ?? `Portrait of ${doctor.name}`} className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" loading="lazy" />
        ) : (
          <div className="grid size-full place-items-center"><UserRound className="size-12 opacity-50" /></div>
        )}
      </div>
      <p className="mt-4 font-heading text-lg font-semibold">{doctor.name}</p>
      {doctor.designation ? <p className="mt-1 text-sm text-primary-foreground/75">{doctor.designation}</p> : null}
      {doctor.specialty ? <p className="mt-0.5 text-sm text-primary-foreground/60">{doctor.specialty}</p> : null}
      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold">View Profile <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
    </Link>
  );
}

function DepartmentFaqs({ departmentName, index }: { departmentName: string; index: () => string }) {
  const faqs = useQuery(faqQuery);
  const [open, setOpen] = useState<string | null>(null);
  const items = (faqs.data ?? []).filter((f) => f.category?.toLowerCase() === departmentName.toLowerCase());
  if (!items.length) return null;
  return (
    <section className="bg-background">
      <div className={`${wrap} grid gap-8 py-14 sm:py-20 lg:grid-cols-[0.35fr_0.65fr]`}>
        <div>
          <Index n={index()} label="Questions" />
          <h2 className="mt-5 text-3xl font-semibold">Frequently Asked Questions</h2>
        </div>
        <div className="border-t border-border">
          {items.map((f) => {
            const isOpen = open === f.id;
            return (
              <div key={f.id} className="border-b border-border">
                <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : f.id)} className="flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left font-heading font-semibold">
                  {f.question}
                  <Plus className={`size-5 shrink-0 text-primary transition-transform ${isOpen ? "rotate-45" : ""}`} />
                </button>
                {isOpen ? <p className="pb-5 pr-10 leading-7 text-muted-foreground">{f.answer}</p> : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
