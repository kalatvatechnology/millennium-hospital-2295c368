import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { resolveEnquiryWhatsappTarget } from "@/lib/whatsapp";
import {
  ArrowRight,
  Award,
  BriefcaseMedical,
  CalendarDays,
  ExternalLink,
  GraduationCap,
  MapPin,
  MessageCircle,
  Phone,
  UserRound,
} from "lucide-react";
import { PublicPage } from "@/components/layout/public-page";
import { ContentSection, EmptyState } from "@/components/shared/page";
import { EnquiryForm } from "@/components/content/enquiry-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  ConsultationHours,
  DoctorLocationCard,
  DoctorQuickStats,
  DoctorSectionNav,
  MediaPreview,
  ProfileSection,
  ReadMore,
  ReviewsPreview,
  ServicesOverview,
  SpecializationCard,
  container,
  locationAddress,
} from "@/components/doctor-profile/sections";
import { siteConfig } from "@/config/site";
import { doctorQuery } from "@/lib/queries";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/doctors/$slug")({
  validateSearch: (search: Record<string, unknown>): { preview?: boolean } =>
    search["preview"] === true || search["preview"] === "1" ? { preview: true } : {},
  loaderDeps: ({ search }) => ({ preview: search.preview === true }),
  // Preview data is fetched in the browser with the signed-in staff session,
  // so it is never rendered on the server for anonymous visitors.
  loader: ({ context, params, deps }) =>
    deps.preview ? null : context.queryClient.ensureQueryData(doctorQuery(params.slug, false)),

  head: ({ loaderData }) => {
    const doctor = loaderData?.doctor;
    const title = doctor?.seo_title ?? doctor?.name ?? "Doctor profile";
    const description =
      doctor?.seo_description ??
      doctor?.short_introduction ??
      doctor?.bio ??
      "View a clinician profile at The Millennium Hospital.";
    const unpublished = !doctor || doctor.status !== "published";
    return {
      meta: [
        ...createPageMeta(title, description),
        ...(doctor?.og_image_url ? [{ property: "og:image", content: doctor.og_image_url }] : []),
        ...(unpublished ? [{ name: "robots", content: "noindex, nofollow" }] : []),
      ],
      links: doctor?.canonical_url ? [{ rel: "canonical", href: doctor.canonical_url }] : [],
    };
  },
  component: DoctorDetail,
});

const visible = (values: Record<string, boolean>, key: string) => values[key] !== false;
const years = (start: number | null, end: number | null, present: boolean) =>
  [start, present ? "Present" : end].filter(Boolean).join(" – ");

function DoctorDetail() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const preview = Boolean(search.preview);
  const loaded = Route.useLoaderData();
  const previewQuery = useQuery({ ...doctorQuery(slug, true), enabled: preview });
  const data = preview ? (previewQuery.data ?? null) : loaded;

  if (preview && previewQuery.isPending)
    return (
      <PublicPage>
        <ContentSection>
          <p className="text-muted-foreground">Loading profile preview…</p>
        </ContentSection>
      </PublicPage>
    );

  if (!data)
    return (
      <PublicPage>
        <ContentSection>
          <EmptyState
            title="We couldn't find this doctor"
            description="This profile may not be published yet or the address may have changed."
            action={
              <Button asChild>
                <Link to="/doctors">View all doctors</Link>
              </Button>
            }
          />
        </ContentSection>
      </PublicPage>
    );


  const { doctor } = data;
  const sv = doctor.section_visibility;
  const phone = doctor.phone_number?.replace(/[^+\d]/g, "");
  const whatsapp = resolveEnquiryWhatsappTarget("doctor_profile", doctor);
  const heroEnabled = visible(sv, "hero");
  const portrait = doctor.photo_url;
  const portraitAlt = doctor.profile_image_alt ?? `Portrait of ${doctor.name}`;
  const heroBackground = heroEnabled ? doctor.hero_background_image_url : null;
  const heroBackgroundPosition =
    doctor.hero_background_position === "left"
      ? "object-left"
      : doctor.hero_background_position === "right"
        ? "object-right"
        : "object-center";
  const qualifications = doctor.qualifications.length > 0;
  const socialLinks = data.socialLinks?.length
    ? data.socialLinks.map(({ platform, url }) => [platform, url] as const)
    : Object.entries(doctor.social_links);
  const showStatistics = visible(sv, "statistics") && data.statistics.length > 0;
  const showQuote = heroEnabled && Boolean(doctor.quote);
  const showAbout =
    Boolean(doctor.bio) ||
    qualifications ||
    doctor.languages.length > 0 ||
    doctor.departments.length > 0 ||
    Boolean(doctor.experience_years) ||
    Boolean(doctor.professional_registration_no) ||
    socialLinks.length > 0;
  const showSpecializations =
    visible(sv, "specializations") && (data.specializations.length > 0 || doctor.expertise.length > 0);
  const showServices = visible(sv, "services") && data.services.length > 0;
  const showExperience = visible(sv, "experience") && data.experience.length > 0;
  const showEducation = visible(sv, "education") && data.education.length > 0;
  const showAchievements = visible(sv, "achievements") && data.achievements.length > 0;
  const showLocations = visible(sv, "locations") && data.locations.length > 0;
  const showReviews = visible(sv, "reviews") && data.reviews.length > 0;
  const showMedia = visible(sv, "media") && data.media.length > 0;
  const showFaqs = visible(sv, "faqs") && data.faqs.length > 0;

  const navItems = [
    showAbout ? { id: "overview", label: "Overview" } : null,
    showSpecializations ? { id: "specializations", label: "Specializations" } : null,
    showServices ? { id: "services", label: "Services" } : null,
    showExperience ? { id: "experience", label: "Experience" } : null,
    showEducation ? { id: "education", label: "Education" } : null,
    showLocations ? { id: "locations", label: "Locations" } : null,
    showAchievements ? { id: "achievements", label: "Achievements" } : null,
    showMedia ? { id: "media", label: "Media" } : null,
    showReviews ? { id: "reviews", label: "Reviews" } : null,
    showFaqs ? { id: "faqs", label: "FAQs" } : null,
    { id: "request-appointment", label: "Book" },
  ].filter((item): item is { id: string; label: string } => item !== null);

  const primaryLocation = showLocations ? (data.locations[0] ?? null) : null;
  const eyebrow = data.specializations.length
    ? data.specializations
        .slice(0, 3)
        .map((s) => s.title)
        .join(" · ")
    : (doctor.specialty ?? doctor.department?.name ?? null);
  const departments = doctor.departments.map((d) => d.name).join(" · ");

  // Muted backgrounds alternate across whichever sections are actually rendered.
  let tone = 0;
  const nextMuted = () => tone++ % 2 === 1;

  const actions = (
    <>
      <Button asChild size="lg" className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90">
        <a href="#request-appointment">
          <CalendarDays className="size-4" aria-hidden="true" /> Book appointment
        </a>
      </Button>
      {whatsapp ? (
        <Button asChild size="lg" variant="outline">
          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
            <MessageCircle className="size-4" aria-hidden="true" /> WhatsApp
          </a>
        </Button>
      ) : null}
      {phone ? (
        <Button asChild size="lg" variant="outline">
          <a href={`tel:${phone}`}>
            <Phone className="size-4" aria-hidden="true" /> Call
          </a>
        </Button>
      ) : null}
    </>
  );

  return (
    <PublicPage>
      {doctor.status !== "published" ? (
        <div className="bg-primary px-4 py-1.5 text-center text-xs font-semibold text-primary-foreground">
          Staff preview — not published, hidden from search engines.
        </div>
      ) : null}

      {/* HERO */}
      <section className="relative isolate overflow-hidden border-b border-border bg-surface/70">
        {heroBackground ? (
          <>
            <img
              src={heroBackground}
              alt={doctor.hero_background_image_alt ?? ""}
              className={`absolute inset-0 -z-20 size-full object-cover ${heroBackgroundPosition}`}
              loading="eager"
            />
            <div className="absolute inset-0 -z-10 bg-background/80" aria-hidden="true" />
          </>
        ) : null}
        <div className={`${container} pb-8 pt-4 sm:pb-10 lg:pb-12`}>
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
              <li>
                <Link to="/" className="hover:text-primary hover:underline">Home</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link to="/doctors" className="hover:text-primary hover:underline">Doctors</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="truncate font-semibold text-foreground">{doctor.name}</li>
            </ol>
          </nav>

          <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:grid-cols-[minmax(0,16.5rem)_minmax(0,1fr)_minmax(0,20rem)] lg:items-start lg:gap-8">
            <div className="mx-auto w-full max-w-[14rem] md:mx-0 md:max-w-none">
              <div className="grid aspect-[4/5] max-h-[21rem] place-items-center overflow-hidden rounded-2xl bg-background shadow-[var(--shadow-lg)]">
                {portrait ? (
                  <img src={portrait} alt={portraitAlt} className="size-full object-cover object-center" loading="eager" />
                ) : (
                  <div className="grid place-items-center gap-2 p-6 text-center">
                    <UserRound className="size-12 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm text-muted-foreground">Photograph not yet provided</span>
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 text-center md:text-left">
              {eyebrow ? (
                <p className="text-xs font-bold uppercase leading-5 tracking-[.14em] text-brand-accent">{eyebrow}</p>
              ) : null}
              <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">{doctor.name}</h1>
              {qualifications ? (
                <p className="mt-2 font-semibold text-foreground">{doctor.qualifications.join(", ")}</p>
              ) : null}
              {doctor.designation || departments ? (
                <p className="mt-1 text-muted-foreground">
                  {[doctor.designation, departments].filter(Boolean).join(" · ")}
                </p>
              ) : null}
              <ul className="mt-4 flex flex-wrap justify-center gap-2 text-sm md:justify-start">
                {doctor.experience_years ? (
                  <li className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 font-medium shadow-[var(--shadow-sm)]">
                    <BriefcaseMedical className="size-4 text-primary" aria-hidden="true" />
                    {doctor.experience_years}+ years experience
                  </li>
                ) : null}
                {primaryLocation ? (
                  <li className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 font-medium shadow-[var(--shadow-sm)]">
                    <MapPin className="size-4 text-primary" aria-hidden="true" />
                    {primaryLocation.public_name || primaryLocation.name}
                    {primaryLocation.city ? `, ${primaryLocation.city}` : ""}
                  </li>
                ) : null}
              </ul>
              {doctor.short_introduction ? (
                <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-foreground md:mx-0">
                  {doctor.short_introduction}
                </p>
              ) : null}
              {showQuote ? (
                <figure className="mt-4 max-w-2xl border-l-4 border-brand-accent pl-4 text-left">
                  <blockquote className="font-medium italic leading-7">“{doctor.quote}”</blockquote>
                  {doctor.quote_attribution ? (
                    <figcaption className="mt-1 text-sm text-muted-foreground">— {doctor.quote_attribution}</figcaption>
                  ) : null}
                </figure>
              ) : null}
              <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start lg:hidden">{actions}</div>
            </div>

            <aside
              aria-label={`Consult ${doctor.name}`}
              className="rounded-2xl border border-border bg-background p-5 shadow-[var(--shadow-lg)] md:col-span-2 lg:col-span-1"
            >
              <p className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">Consult</p>
              <h2 className="mt-0.5 text-lg font-semibold">{doctor.name}</h2>
              <div className="mt-4 hidden gap-2 lg:grid">{actions}</div>
              {primaryLocation ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:mt-5 lg:grid-cols-1 lg:border-t lg:border-border lg:pt-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">Location</p>
                    <p className="mt-1 text-sm font-semibold">{primaryLocation.public_name || primaryLocation.name}</p>
                    {locationAddress(primaryLocation) ? (
                      <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{locationAddress(primaryLocation)}</p>
                    ) : null}
                  </div>
                  {primaryLocation.consultation_schedule || primaryLocation.consultation_availability ? (
                    <div>
                      <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-primary">Consultation</p>
                      <ConsultationHours location={primaryLocation} limit={3} showClosed={false} />
                    </div>
                  ) : null}
                  <a
                    href="#locations"
                    className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-primary hover:underline"
                  >
                    {data.locations.length > 1 ? `View all ${data.locations.length} locations` : "View location"}
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </a>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground lg:mt-4">
                  Share your details and our team will confirm a consultation time.
                </p>
              )}
            </aside>
          </div>
        </div>
      </section>

      {showStatistics ? <DoctorQuickStats items={data.statistics} /> : null}
      <DoctorSectionNav items={navItems} />

      {showAbout ? (
        <ProfileSection id="overview" eyebrow="Professional profile" title={`About ${doctor.name}`} muted={nextMuted()}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
            <div className="min-w-0">
              {doctor.bio ? (
                <ReadMore text={doctor.bio} />
              ) : doctor.short_introduction ? (
                <p className="leading-7 text-muted-foreground">{doctor.short_introduction}</p>
              ) : null}
            </div>
            <aside className="h-fit rounded-xl border border-border bg-surface/60 p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">At a glance</h3>
              <dl className="mt-3 divide-y divide-border text-sm">
                {(
                  [
                    ["Qualifications", doctor.qualifications.join(", ")],
                    [doctor.departments.length > 1 ? "Departments" : "Department", doctor.departments.map((d) => d.name).join(", ")],
                    ["Specialization", data.specializations[0]?.title ?? doctor.specialty],
                    ["Experience", doctor.experience_years ? `${doctor.experience_years}+ years` : null],
                    ["Languages", doctor.languages.join(", ")],
                    ["Registration", doctor.professional_registration_no],
                  ] as const
                )
                  .filter(([, value]) => Boolean(value))
                  .map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[7.5rem_1fr] gap-3 py-2">
                      <dt className="font-semibold">{label}</dt>
                      <dd className="text-muted-foreground">{value}</dd>
                    </div>
                  ))}
              </dl>
              {socialLinks.length ? (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3">
                  {socialLinks.map(([label, url]) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-8 items-center gap-1 text-sm font-semibold capitalize text-primary hover:underline"
                    >
                      {label.replace(/_/g, " ")}
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              ) : null}
            </aside>
          </div>
        </ProfileSection>
      ) : null}

      {showSpecializations ? (
        <ProfileSection id="specializations" eyebrow="Clinical focus" title="Specializations" muted={nextMuted()}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            {data.specializations.map((item) => (
              <SpecializationCard key={item.id} item={item} />
            ))}
            {doctor.expertise.map((item) => (
              <SpecializationCard key={item} item={{ title: item, description: null, icon: null }} />
            ))}
          </div>
        </ProfileSection>
      ) : null}

      {showServices ? (
        <ProfileSection id="services" eyebrow="Care offered" title="Professional services" muted={nextMuted()}>
          <ServicesOverview services={data.services} serviceItems={data.serviceItems} />
        </ProfileSection>
      ) : null}

      {showExperience || showEducation ? (
        (() => {
          const muted = nextMuted();
          return (
            <div className={`grid ${showExperience && showEducation ? "" : ""}`}>
              {showExperience ? (
                <ProfileSection id="experience" eyebrow="Career" title="Experience" muted={muted}>
                  <ol className="relative grid gap-4 border-l-2 border-primary/20 pl-5 sm:grid-cols-2 sm:gap-x-8 sm:border-l-0 sm:pl-0 lg:grid-cols-3">
                    {data.experience.map((item) => (
                      <li key={item.id} className="relative sm:border-l-2 sm:border-primary/20 sm:pl-4">
                        <span className="absolute -left-[1.6rem] top-1.5 size-2.5 rounded-full bg-primary sm:-left-[0.4rem]" aria-hidden="true" />
                        <p className="text-xs font-bold text-primary">
                          {years(item.start_year, item.end_year, item.is_present)}
                        </p>
                        <h3 className="mt-0.5 font-semibold leading-snug">{item.position ?? item.organization}</h3>
                        {item.position ? <p className="text-sm text-muted-foreground">{item.organization}</p> : null}
                        {item.description ? (
                          <p className="mt-1 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </ProfileSection>
              ) : null}
              {showEducation ? (
                <ProfileSection id="education" eyebrow="Training" title="Education" muted={muted}>
                  <div className="grid gap-3 md:grid-cols-2">
                    {data.education.map((item) => (
                      <article key={item.id} className="flex gap-4 rounded-xl border border-border bg-background p-4">
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                          <GraduationCap className="size-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-semibold leading-snug">
                            {item.qualification}
                            {item.year ? <span className="ml-2 text-sm font-semibold text-primary">{item.year}</span> : null}
                          </h3>
                          {item.institution ? <p className="text-sm text-muted-foreground">{item.institution}</p> : null}
                          {item.description ? (
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                </ProfileSection>
              ) : null}
            </div>
          );
        })()
      ) : null}

      {showLocations ? (
        <ProfileSection id="locations" eyebrow="Where to consult" title="Locations & consultation hours" muted={nextMuted()}>
          <div className="grid gap-4 md:grid-cols-2">
            {data.locations.map((location) => (
              <DoctorLocationCard
                key={location.id}
                location={location}
                primary={location.id === siteConfig.contact.primaryLocationId}
              />
            ))}
          </div>
        </ProfileSection>
      ) : null}

      {showAchievements ? (
        <ProfileSection id="achievements" eyebrow="Recognition" title="Achievements & memberships" muted={nextMuted()}>
          <div className="grid gap-5 md:grid-cols-2">
            {Object.entries(
              data.achievements.reduce<Record<string, typeof data.achievements>>((acc, item) => {
                (acc[item.achievement_type] ??= []).push(item);
                return acc;
              }, {}),
            ).map(([type, items]) => (
              <div key={type} className="rounded-xl border border-border bg-background p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                  <Award className="size-4" aria-hidden="true" /> {type.replace(/_/g, " ")}
                </h3>
                <ul className="mt-3 grid gap-3">
                  {items.map((item) => (
                    <li key={item.id} className="flex gap-3">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.image_alt ?? ""} className="size-12 shrink-0 rounded-md object-cover" loading="lazy" />
                      ) : null}
                      <div className="min-w-0">
                        <p className="font-semibold leading-snug">{item.title}</p>
                        {item.organization || item.year ? (
                          <p className="text-sm text-muted-foreground">
                            {[item.organization, item.year].filter(Boolean).join(" · ")}
                          </p>
                        ) : null}
                        {item.description ? (
                          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ProfileSection>
      ) : null}

      {showMedia ? (
        <ProfileSection id="media" eyebrow="Watch & read" title="Media" muted={nextMuted()}>
          <MediaPreview items={data.media} />
        </ProfileSection>
      ) : null}

      {showReviews ? (
        <ProfileSection id="reviews" eyebrow="Approved feedback" title="Patient reviews" muted={nextMuted()}>
          <ReviewsPreview reviews={data.reviews} />
        </ProfileSection>
      ) : null}

      {showFaqs ? (
        <ProfileSection id="faqs" eyebrow="Helpful information" title="Frequently asked questions" muted={nextMuted()}>
          <Accordion type="single" collapsible className="max-w-4xl rounded-xl border border-border bg-background px-5">
            {data.faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id} className="last:border-b-0">
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent>
                  <p className="leading-7 text-muted-foreground">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ProfileSection>
      ) : null}

      <section id="request-appointment" aria-labelledby="appointment-title" className="scroll-mt-36 border-t border-border bg-surface/70 py-8 sm:py-10 lg:py-12">
        <div className={container}>
          <div className="grid gap-6 rounded-2xl border border-border bg-background p-5 shadow-[var(--shadow-lg)] sm:p-7 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-brand-accent">Appointments</p>
              <h2 id="appointment-title" className="mt-1 text-2xl font-semibold leading-tight">
                Request an appointment
                <span className="block text-lg font-medium text-muted-foreground">with {doctor.name}</span>
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Share your details and our team will contact you to confirm availability.
              </p>
              {primaryLocation?.consultation_schedule || primaryLocation?.consultation_availability ? (
                <div className="mt-4 hidden border-t border-border pt-4 lg:block">
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-primary">Consultation hours</p>
                  <ConsultationHours location={primaryLocation} showClosed={false} />
                </div>
              ) : null}
            </div>
            <EnquiryForm compact presetDoctorId={doctor.id} source="doctor_profile" />
          </div>
        </div>
      </section>

      <div className="h-20 lg:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <Button asChild className="flex-1 bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90">
            <a href="#request-appointment">Book appointment</a>
          </Button>
          {whatsapp ? (
            <Button asChild variant="outline" className="flex-1">
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" aria-hidden="true" /> WhatsApp
              </a>
            </Button>
          ) : null}
          {phone ? (
            <Button asChild variant="outline" size="icon" aria-label={`Call ${doctor.name}`}>
              <a href={`tel:${phone}`}>
                <Phone className="size-5" aria-hidden="true" />
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </PublicPage>
  );
}
