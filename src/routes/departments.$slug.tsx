import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Plus, UserRound } from "lucide-react";
import { useState } from "react";
import { PublicPage } from "@/components/layout/public-page";
import { Async } from "@/components/shared/async";
import { ContentSection, EmptyState } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import { departmentQuery, faqQuery, type DoctorWithDepartment, type FaqRow, type MediaItem } from "@/lib/queries";
import { getDepartmentPresentation } from "@/lib/department-presentation";
import { enabledItems, type DepartmentPage } from "@/lib/department-page";
import { MediaGrid } from "@/components/content/media";
import { createPageMeta } from "@/lib/seo";
import { siteConfig } from "@/config/site";

export const Route = createFileRoute("/departments/$slug")({
  validateSearch: (search: Record<string, unknown>): { preview?: boolean } =>
    search["preview"] === true || search["preview"] === "1" ? { preview: true } : {},
  loaderDeps: ({ search }) => ({ preview: Boolean(search.preview) }),
  loader: async ({ context, params, deps }) => {
    // Preview depends on the staff session, which only exists in the browser.
    if (deps.preview) return null;
    try {
      return await context.queryClient.ensureQueryData(departmentQuery(params.slug, false));
    } catch {
      return null;
    }
  },
  head: ({ loaderData }) => {
    const fallback = createPageMeta("Department", "Specialist departments and clinical care at The Millennium Hospital.");
    if (!loaderData) return { meta: fallback };
    const { department, page } = loaderData;
    const seo = page?.seo;
    const title = seo?.title || `${department.name} | ${siteConfig.name}`;
    const description =
      seo?.description || department.short_description || department.description || `${department.name} at ${siteConfig.name}.`;
    const image = seo?.og_image_url || page?.hero.image_url || department.card_image_url || "";
    const meta: Record<string, string>[] = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (/^https:\/\//.test(image)) meta.push({ property: "og:image", content: image }, { name: "twitter:image", content: image });
    if (seo && !seo.index) meta.push({ name: "robots", content: "noindex, nofollow" });
    return { meta, links: seo?.canonical_url ? [{ rel: "canonical", href: seo.canonical_url }] : [] };
  },
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
            <DepartmentView department={data.department} doctors={data.doctors} page={data.page} faqs={data.faqs} media={data.media} />
          )
        }
      </Async>
    </PublicPage>
  );
}

type Dept = { name: string; slug: string; description: string | null; short_description?: string | null; card_image_url?: string | null; card_image_alt?: string | null };


const lines = (t: string) => t.split("\n").map((l) => l.trim()).filter(Boolean);

/** Published CMS content when present; otherwise the approved V1 presentation fallback. */
function resolveView(department: Dept, page: DepartmentPage | null) {
  if (page) {
    const about = enabledItems(page.about);
    const care = enabledItems(page.care);
    const conditions = enabledItems(page.conditions);
    const facilityPoints = enabledItems(page.facilities);
    const approach = enabledItems(page.approach);
    const aboutIntro = page.about.intro || department.description || "";
    const h = page.hero;
    return {
      hero: {
        enabled: h.enabled,
        lines: lines(h.headline),
        lead: h.intro || department.short_description || "",
        image: h.image_url || department.card_image_url || null,
        alt: h.image_alt || department.card_image_alt || `${department.name} care at The Millennium Hospital`,
        book: h.show_book,
        contact: h.show_contact,
        specialists: h.show_specialists,
        hasActions: h.show_book || h.show_contact || h.show_specialists,
      },
      about: page.about.enabled && (aboutIntro || about.length)
        ? { label: page.about.label, title: page.about.title, intro: aboutIntro, items: about }
        : null,
      care: page.care.enabled && care.length ? { label: page.care.label, title: page.care.title, intro: page.care.intro, items: care } : null,
      conditions: page.conditions.enabled && conditions.length
        ? { label: page.conditions.label, title: page.conditions.title, intro: page.conditions.intro, items: conditions.map((c) => c.title) }
        : null,
      specialists: page.specialists.enabled,
      facilities: page.facilities.enabled && (facilityPoints.length || page.facilities.intro)
        ? {
            label: page.facilities.label,
            title: page.facilities.title || "Advanced facilities\n& technology",
            text: page.facilities.intro,
            image: page.facilities.image_url || null,
            alt: page.facilities.image_alt || `${department.name} facilities`,
            points: facilityPoints.map((f) => f.title),
          }
        : null,
      approach: page.approach.enabled && approach.length
        ? { label: page.approach.label, title: page.approach.title || "The Millennium\napproach", intro: page.approach.intro, items: approach }
        : null,
      faqsEnabled: page.faqs.enabled,
      mediaEnabled: page.media.enabled,
    };
  }
  const p = getDepartmentPresentation(department.slug);
  const about = department.description ?? p?.lead ?? null;
  return {
    hero: {
      enabled: true,
      lines: p?.heroLines ?? [],
      lead: department.short_description ?? p?.lead ?? department.description ?? "",
      image: department.card_image_url ?? p?.heroImage ?? null,
      alt: department.card_image_alt ?? `${department.name} care at The Millennium Hospital`,
      book: true,
      contact: false,
      specialists: true,
      hasActions: true,
    },
    about: about ? { label: "About the department", title: p?.introHeading ?? "", intro: about, items: p?.highlights ?? [] } : null,
    care: p ? { label: "Specialized care", title: "", intro: p.careIntro, items: p.careAreas } : null,
    conditions: p ? { label: "Conditions", title: "", intro: "", items: p.conditions } : null,
    specialists: true,
    facilities: p
      ? { label: "Facilities", title: "Advanced facilities\n& technology", text: p.facilityText, image: p.facilityImage, alt: "Hospital clinical corridor with imaging and rehabilitation areas", points: p.facilityPoints }
      : null,
    approach: {
      label: "The Millennium approach",
      title: "Care,\ncoordinated\naround you.",
      intro: `${department.name} is part of a wider multi-specialty hospital, so care can draw on colleagues across departments when you need it.`,
      items: [
        { title: "Specialist-led care", text: "Consultations with clinicians focused on their field." },
        { title: "Coordinated treatment", text: "Departments working together across your care." },
        { title: "Modern clinical environment", text: "Care delivered within a multi-specialty hospital." },
        { title: "Patient-focused recovery", text: "Clear guidance from diagnosis through recovery." },
      ],
    },
    faqsEnabled: true,
    mediaEnabled: false,
  };
}

function DepartmentView({ department, doctors, page, faqs, media }: { department: Dept; doctors: DoctorWithDepartment[]; page: DepartmentPage | null; faqs: FaqRow[]; media: MediaItem[] }) {
  const v = resolveView(department, page);
  const lower = department.name.toLowerCase();
  const heroImage = v.hero.image;
  const heroAlt = v.hero.alt;
  const lead = v.hero.lead;
  let n = 0;
  const num = () => String(++n).padStart(2, "0");

  return (
    <div className="dept-page overflow-x-clip">
      {/* 01 HERO */}
      {v.hero.enabled ? <section className="relative bg-background">
        <div className={`${wrap} grid lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] lg:min-h-[36rem]`}>
          <div className="dept-reveal flex flex-col justify-center pb-6 pt-8 sm:pt-10 lg:py-14 lg:pr-10">
            <nav aria-label="Breadcrumb" className={`${eyebrow} text-[0.8rem] flex items-center gap-3 text-muted-foreground`}>
              <Link to="/departments" className="hover:text-primary">Departments</Link>
              <span className="h-px w-6 bg-brand-accent" aria-hidden />
              <span className="text-primary">{department.name}</span>
            </nav>
            <h1 className="mt-6 min-w-0 break-normal font-heading text-[2.35rem] font-semibold uppercase leading-[1] tracking-[-0.02em] text-foreground [hyphens:none] min-[380px]:text-[2.6rem] sm:text-[3.4rem] lg:text-[2.6rem] xl:text-[3.5rem] 2xl:text-[3.9rem]">
              {v.hero.lines.length ? v.hero.lines.map((l, i) => (
                <span key={`${l}-${i}`} className={`block sm:whitespace-nowrap ${i === v.hero.lines.length - 1 && v.hero.lines.length > 1 ? "text-primary" : ""}`}>{l}</span>
              )) : department.name}
            </h1>
            {lead ? <p className="mt-7 max-w-[30rem] border-l-2 border-brand-accent pl-5 text-lg leading-[1.85rem] text-muted-foreground">{lead}</p> : null}
            {v.hero.hasActions ? <div className="mt-9 hidden flex-wrap gap-3 lg:flex"><HeroActions {...v.hero} specialists={v.hero.specialists && v.specialists} /></div> : null}
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
          <div className="flex flex-col gap-3 pb-8 pt-5 sm:flex-row lg:hidden">{v.hero.hasActions ? <HeroActions {...v.hero} specialists={v.hero.specialists && v.specialists} /> : null}</div>
        </div>
      </section> : null}

      {/* 02 ABOUT */}
      {v.about ? (
        <section className="bg-background">
          <div className={`${wrap} grid gap-6 py-12 sm:py-16 lg:grid-cols-[0.3fr_0.7fr] lg:gap-10`}>
            <div className="flex items-start gap-5 lg:flex-col lg:gap-4">
              <BigNumber n={num()} />
              <p className={`${eyebrow} pt-3 text-muted-foreground lg:pt-0`}>{v.about.label === "About the department" ? <>About the<br className="hidden lg:block" /> department</> : v.about.label}</p>
            </div>
            <div className="dept-reveal">
              <h2 className="max-w-3xl text-3xl font-semibold leading-[1.15] sm:text-[2.75rem]">{v.about.title || `About ${department.name}`}</h2>
              {v.about.intro ? <p className="mt-5 max-w-[40rem] whitespace-pre-line text-lg leading-8 text-muted-foreground">{v.about.intro}</p> : null}
              {v.about.items.length ? (
                <dl className="mt-8 grid sm:grid-cols-2 xl:grid-cols-4">
                  {v.about.items.map((h, i) => (
                    <div key={`${h.title}-${i}`} className={`border-t border-border py-5 sm:pr-6 xl:border-l xl:border-t-0 xl:py-1 xl:pl-6 ${i === 0 ? "xl:border-l-0 xl:pl-0" : ""}`}>
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
      {v.care ? (
        <section className="bg-secondary">
          <div className={`${wrap} grid gap-8 py-12 sm:py-16 lg:grid-cols-[0.4fr_0.6fr] lg:gap-16`}>
            <div className="lg:sticky lg:top-28 lg:self-start">
              <Label n={num()} text={v.care.label} />
              <h2 className="mt-4 text-3xl font-semibold leading-[1.1] sm:text-[2.75rem]">{v.care.title ? <Lines text={v.care.title} /> : <>Specialized<br />{department.name} Care</>}</h2>
              {v.care.intro ? <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground">{v.care.intro}</p> : null}
            </div>
            <ol className="border-t border-foreground/20">
              {v.care.items.map((a, i) => (
                <li key={`${a.title}-${i}`} className="group relative grid grid-cols-[2.75rem_1fr_auto] items-center gap-3 border-b border-foreground/20 py-5 transition-colors hover:bg-background/70 sm:grid-cols-[4.5rem_1fr_auto] sm:py-5">
                  <span className="absolute left-0 top-0 h-full w-0.5 origin-top scale-y-0 bg-brand-accent transition-transform duration-300 group-hover:scale-y-100" aria-hidden />
                  <span className="pl-2 font-heading text-sm font-semibold tabular-nums text-brand-accent sm:pl-4">{String(i + 1).padStart(2, "0")}</span>
                  <div className="transition-transform duration-300 group-hover:translate-x-1.5">
                    <h3 className="text-xl font-semibold sm:text-[1.65rem]">{a.title}</h3>
                    {a.text ? <p className="mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">{a.text}</p> : null}
                  </div>
                  <ArrowRight className="mr-2 size-5 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-accent sm:mr-4" aria-hidden />
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* 04 CONDITIONS — signature typographic spread */}
      {v.conditions ? (
        <section className="bg-background">
          <div className={`${wrap} py-12 sm:py-16`}>
            <div className="grid gap-6 lg:grid-cols-[0.28fr_0.72fr] lg:gap-12">
              <div>
                <Label n={num()} text={v.conditions.label} />
                <h2 className="mt-4 font-heading text-2xl font-semibold uppercase leading-tight tracking-[0.04em] text-primary sm:text-3xl">{v.conditions.title ? <Lines text={v.conditions.title} /> : <>Conditions<br />we treat</>}</h2>
                {v.conditions.intro ? <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">{v.conditions.intro}</p> : null}
              </div>
              <ul className="flex flex-wrap items-baseline gap-x-3 gap-y-1 sm:gap-x-4" aria-label={`Conditions treated by ${department.name}`}>
                {v.conditions.items.map((c, i, all) => (
                  <li key={`${c}-${i}`} className="font-heading text-[1.9rem] font-medium leading-[1.25] tracking-[-0.02em] text-foreground transition-colors hover:text-primary sm:text-5xl xl:text-[3.6rem]">
                    {c}{i < all.length - 1 ? <span className="ml-3 font-light text-brand-accent sm:ml-4" aria-hidden>/</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {/* 05 SPECIALISTS */}
      {v.specialists ? <section id="specialists" className="scroll-mt-24 bg-primary text-primary-foreground">
        <div className={`${wrap} ${doctors.length ? "py-16 sm:py-24" : "py-12 sm:py-16"}`}>
          <div className={`grid lg:grid-cols-[0.4fr_0.6fr] ${doctors.length ? "gap-10 lg:gap-16" : "gap-6 lg:items-end lg:gap-16"}`}>
            <div>
              <Label n={num()} text="Our specialists" dark />
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
      </section> : null}

      {/* 06 FACILITIES — cinematic */}
      {v.facilities ? (
        <section className="bg-foreground">
          <div className="relative">
            <div className="group relative aspect-[4/3] overflow-hidden sm:aspect-[16/9] lg:aspect-auto lg:h-[max(32rem,40.48vw)]">
              {v.facilities.image ? <img src={v.facilities.image} alt={v.facilities.alt} className="size-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03]" loading="lazy" width={1600} height={1008} /> : <div className="size-full bg-primary" aria-hidden />}
              <div className="absolute inset-0 hidden bg-gradient-to-r from-foreground/85 via-foreground/40 to-transparent lg:block" aria-hidden />
            </div>
            <div className="bg-background lg:absolute lg:inset-0 lg:bg-transparent"><div className={`${wrap} py-10 lg:flex lg:h-full lg:flex-col lg:justify-center lg:py-0 lg:text-primary-foreground`}><div className="lg:max-w-md">
              <Label n={num()} text={v.facilities.label} darkLg />
              <h2 className="mt-4 font-heading text-3xl font-semibold uppercase leading-[1.05] sm:text-[2.6rem]"><Lines text={v.facilities.title} /></h2>
              {v.facilities.text ? <p className="mt-4 text-[1.1rem] leading-8 text-muted-foreground lg:text-primary-foreground/85">{v.facilities.text}</p> : null}
              <ul className="mt-6 space-y-2.5">
                {v.facilities.points.map((f, i) => (
                  <li key={`${f}-${i}`} className="flex items-center gap-4 text-[0.95rem] font-semibold"><span className="h-px w-6 bg-brand-accent" aria-hidden />{f}</li>
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
      {v.approach ? <section className="bg-secondary">
        <div className={`${wrap} py-12 sm:py-16`}>
          <div className="grid gap-6 lg:grid-cols-[0.5fr_0.5fr] lg:items-end">
            <div>
              <Label n={num()} text={v.approach.label} />
              <h2 className="mt-4 font-heading text-4xl font-semibold uppercase leading-[1] tracking-[-0.01em] sm:text-[3.4rem]"><Lines text={v.approach.title} accentLast /></h2>
            </div>
            {v.approach.intro ? <p className="max-w-md leading-7 text-muted-foreground lg:justify-self-end">{v.approach.intro}</p> : null}
          </div>
          <ol className="mt-8 grid border-t border-foreground/20 sm:grid-cols-2 lg:grid-cols-4">
            {v.approach.items.map(({ title: t, text: d }, i) => (
              <li key={`${t}-${i}`} className="border-b border-foreground/20 py-6 sm:pr-8 lg:border-b-0 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0">
                <span className="font-heading text-sm font-semibold text-brand-accent">{String(i + 1).padStart(2, "0")}</span>
                <p className="mt-4 font-heading text-xl font-semibold">{t}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section> : null}

      {/* 08 FAQ — only when department FAQs exist. */}
      {(() => { const faqNum = v.faqsEnabled && (faqs.length || !page) ? num() : ""; return faqNum ? <DepartmentFaqs departmentName={department.name} linked={faqs} legacy={!page} n={faqNum} /> : null; })()}

      {/* 09 MEDIA — only when media is linked to the department. */}
      {v.mediaEnabled && media.length ? (
        <section className="bg-secondary">
          <div className={`${wrap} py-12 sm:py-16`}>
            <Label n={num()} text="Media" />
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Watch &amp; listen</h2>
            <div className="mt-8"><MediaGrid items={media} /></div>
          </div>
        </section>
      ) : null}

      {/* 09 CTA */}
      <section className="relative bg-sidebar text-sidebar-foreground">
        <span className="absolute left-1/2 top-0 h-10 w-px -translate-x-1/2 bg-brand-accent" aria-hidden />
        <div className={`${wrap} py-12 text-center sm:py-[4.25rem]`}>
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

function HeroActions({ book, contact, specialists }: { book: boolean; contact: boolean; specialists: boolean }) {
  return (
    <>
      {book ? (
        <Button asChild size="lg" className="min-h-12 bg-brand-accent px-7 text-brand-accent-foreground hover:bg-brand-accent/90 sm:min-w-[15rem]">
          <Link to="/contact"><CalendarDays /> Book an Appointment</Link>
        </Button>
      ) : null}
      {contact ? (
        <Button asChild size="lg" variant="outline" className="min-h-12 px-7 sm:min-w-[15rem]">
          <Link to="/contact">Contact Hospital</Link>
        </Button>
      ) : null}
      {specialists ? (
        <Button asChild size="lg" variant="outline" className="group min-h-12 px-7 sm:min-w-[15rem]">
          <a href="#specialists">Meet Our Specialists <ArrowRight className="transition-transform group-hover:translate-x-1" /></a>
        </Button>
      ) : null}
    </>
  );
}

function Lines({ text, accentLast = false }: { text: string; accentLast?: boolean }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <>
      {lines.map((l, i) => (
        <span key={`${l}-${i}`} className={`block ${accentLast && i === lines.length - 1 && lines.length > 1 ? "text-primary" : ""}`}>{l}</span>
      ))}
    </>
  );
}

function BigNumber({ n }: { n: string }) {
  return <span className="font-heading text-6xl font-semibold leading-none tracking-[-0.04em] text-primary/25 sm:text-[4.75rem] lg:text-[7rem]" aria-hidden>{n}</span>;
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

function DepartmentFaqs({ departmentName, linked, legacy, n }: { departmentName: string; linked: FaqRow[]; legacy: boolean; n: string }) {
  const faqs = useQuery({ ...faqQuery, enabled: legacy && !linked.length });
  const [open, setOpen] = useState<string | null>(null);
  // Linked FAQs win. Before a department's CMS page is published, the earlier category match still applies.
  const items = linked.length
    ? linked
    : legacy
      ? (faqs.data?.faqs ?? []).filter((f) => f.category?.toLowerCase() === departmentName.toLowerCase())
      : [];
  if (!items.length) return null;
  return (
    <section className="bg-background">
      <div className={`${wrap} grid gap-6 py-14 sm:py-20 lg:grid-cols-[0.34fr_0.66fr] lg:gap-10`}>
        <div>
          <Label n={n} text="Questions" />
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
