import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  Award,
  BookOpen,
  BriefcaseMedical,
  ExternalLink,
  GraduationCap,
  MapPin,
  MessageCircle,
  Phone,
  Quote,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { PublicPage } from "@/components/layout/public-page";
import { ContentSection, EmptyState } from "@/components/shared/page";
import { ProfessionalServiceCard, ReviewCard } from "@/components/content/cards";
import { MediaGrid } from "@/components/content/media";
import { EnquiryForm } from "@/components/content/enquiry-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
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
  const phone = doctor.phone_number?.replace(/[^+\d]/g, "");
  const whatsapp = doctor.whatsapp_number?.replace(/\D/g, "");
  const heroEnabled = visible(doctor.section_visibility, "hero");
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
  const showStatistics =
    visible(doctor.section_visibility, "statistics") && data.statistics.length > 0;
  const showQuote = heroEnabled && Boolean(doctor.quote);
  const showAbout =
    Boolean(doctor.bio) ||
    qualifications ||
    doctor.languages.length > 0 ||
    doctor.departments.length > 0 ||
    Boolean(doctor.experience_years) ||
    (data.socialLinks?.length ?? 0) > 0 ||
    Object.keys(doctor.social_links).length > 0;
  const showSpecializations =
    visible(doctor.section_visibility, "specializations") &&
    (data.specializations.length > 0 || doctor.expertise.length > 0);
  const showServices = visible(doctor.section_visibility, "services") && data.services.length > 0;
  const showExperience =
    visible(doctor.section_visibility, "experience") && data.experience.length > 0;
  const showEducation =
    visible(doctor.section_visibility, "education") && data.education.length > 0;
  const showAchievements =
    visible(doctor.section_visibility, "achievements") && data.achievements.length > 0;
  const showLocations =
    visible(doctor.section_visibility, "locations") && data.locations.length > 0;
  const showReviews = visible(doctor.section_visibility, "reviews") && data.reviews.length > 0;
  const showMedia = visible(doctor.section_visibility, "media") && data.media.length > 0;
  const showFaqs = visible(doctor.section_visibility, "faqs") && data.faqs.length > 0;

  const navItems = [
    showAbout ? { id: "about", label: "About" } : null,
    showSpecializations ? { id: "specializations", label: "Specializations" } : null,
    showServices ? { id: "services", label: "Services" } : null,
    showExperience ? { id: "experience", label: "Experience" } : null,
    showEducation ? { id: "education", label: "Education" } : null,
    showAchievements ? { id: "achievements", label: "Achievements" } : null,
    showLocations ? { id: "locations", label: "Locations" } : null,
    showMedia ? { id: "media", label: "Media" } : null,
    showReviews ? { id: "reviews", label: "Reviews" } : null,
    showFaqs ? { id: "faqs", label: "FAQs" } : null,
  ].filter((item): item is { id: string; label: string } => item !== null);

  const primaryLocation = data.locations[0] ?? null;

  return (
    <PublicPage>
      {doctor.status !== "published" ? (
        <div className="bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground">
          Staff preview — this profile is not published and is hidden from search engines.
        </div>
      ) : null}

      <section className="relative isolate overflow-hidden border-b border-border bg-secondary">
        {heroBackground ? (
          <>
            <img
              src={heroBackground}
              alt={doctor.hero_background_image_alt ?? ""}
              className={`absolute inset-0 -z-20 size-full object-cover ${heroBackgroundPosition}`}
              loading="eager"
            />
            <div className="absolute inset-0 -z-10 bg-background/75" aria-hidden="true" />
          </>
        ) : null}
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:pb-14 lg:px-8 lg:pb-16">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-primary hover:underline">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link to="/doctors" className="hover:text-primary hover:underline">
                  Doctors
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="font-semibold text-foreground">
                {doctor.name}
              </li>
            </ol>
          </nav>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)_minmax(0,19rem)] lg:items-start lg:gap-10">
            <div className="mx-auto w-full max-w-xs lg:mx-0">
              <div className="grid aspect-[4/5] place-items-center overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-lg)]">
                {portrait ? (
                  <img
                    src={portrait}
                    alt={portraitAlt}
                    className="size-full object-cover object-center"
                    loading="eager"
                  />
                ) : (
                  <div className="grid place-items-center gap-2 p-6 text-center">
                    <UserRound className="size-14 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm text-muted-foreground">
                      Photograph not yet provided
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              {(doctor.specialty ?? doctor.department) ? (
                <p className="text-sm font-bold uppercase tracking-[.18em] text-primary">
                  {doctor.specialty ?? doctor.department?.name}
                </p>
              ) : null}
              <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                {doctor.name}
              </h1>
              {qualifications ? (
                <p className="mt-3 text-base font-medium text-foreground">
                  {doctor.qualifications.join(", ")}
                </p>
              ) : null}
              {doctor.designation ? (
                <p className="mt-2 text-lg text-muted-foreground">{doctor.designation}</p>
              ) : null}
              {doctor.short_introduction ? (
                <p className="mt-5 max-w-2xl leading-8 text-muted-foreground">
                  {doctor.short_introduction}
                </p>
              ) : null}
              {showQuote ? (
                <figure className="mt-6 max-w-2xl border-l-4 border-brand-accent pl-4">
                  <blockquote className="text-lg font-medium italic leading-8">
                    “{doctor.quote}”
                  </blockquote>
                  {doctor.quote_attribution ? (
                    <figcaption className="mt-2 text-sm text-muted-foreground">
                      — {doctor.quote_attribution}
                    </figcaption>
                  ) : null}
                </figure>
              ) : null}
            </div>

            <aside className="rounded-2xl border border-border bg-background p-6 shadow-[var(--shadow-sm)]">
              <h2 className="text-lg font-semibold">Consult {doctor.name}</h2>
              <div className="mt-5 grid gap-3">
                <Button asChild size="lg">
                  <a href="#request-appointment">Book appointment</a>
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
              </div>
              {primaryLocation ? (
                <div className="mt-6 border-t border-border pt-5">
                  <p className="flex items-start gap-2 text-sm font-semibold">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    {primaryLocation.name}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {[
                      primaryLocation.address_line,
                      primaryLocation.city,
                      primaryLocation.state,
                      primaryLocation.postal_code,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {primaryLocation.consultation_availability ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {primaryLocation.consultation_availability}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </section>

      {navItems.length > 1 ? (
        <nav
          aria-label="Profile sections"
          className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur"
        >
          <div className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6 lg:px-8">
            <ul className="flex min-w-max gap-1 py-2">
              {navItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="inline-block rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      ) : null}

      {showStatistics ? (
        <section aria-label="Profile highlights" className="border-b border-border bg-background">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-border px-4 sm:px-6 md:grid-cols-4 lg:px-8">
            {data.statistics.map((item) => (
              <div key={item.id} className="bg-background px-4 py-8 text-center">
                {item.icon ? (
                  <img src={item.icon} alt="" className="mx-auto mb-3 size-10 object-contain" />
                ) : null}
                <strong className="block text-3xl font-semibold text-primary">{item.value}</strong>
                <span
                  className="mt-1 block text-sm text-muted-foreground"
                  title={item.meaning ?? undefined}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {showAbout ? (
        <ContentSection>
          <div id="about" className="scroll-mt-24" />
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,.7fr)]">
            {doctor.bio ? (
              <div className="max-w-3xl">
                <p className="text-sm font-bold uppercase tracking-wider text-primary">
                  Professional profile
                </p>
                <h2 className="mt-3 text-3xl font-semibold">About {doctor.name}</h2>
                <div className="mt-5 whitespace-pre-line leading-8 text-muted-foreground">
                  {doctor.bio}
                </div>
              </div>
            ) : (
              <div />
            )}
            <aside className="h-fit rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-sm)]">
              <h2 className="text-lg font-semibold">At a glance</h2>
              <dl className="mt-5 grid gap-5 text-sm">
                {qualifications ? (
                  <div>
                    <dt className="font-semibold">Qualifications</dt>
                    <dd className="mt-1 text-muted-foreground">
                      {doctor.qualifications.join(", ")}
                    </dd>
                  </div>
                ) : null}
                {doctor.departments.length ? (
                  <div>
                    <dt className="font-semibold">
                      {doctor.departments.length === 1 ? "Department" : "Departments"}
                    </dt>
                    <dd className="mt-1 text-muted-foreground">
                      {doctor.departments.map((item) => item.name).join(", ")}
                    </dd>
                  </div>
                ) : null}
                {doctor.experience_years ? (
                  <div>
                    <dt className="font-semibold">Experience</dt>
                    <dd className="mt-1 text-muted-foreground">{doctor.experience_years} years</dd>
                  </div>
                ) : null}
                {doctor.languages.length ? (
                  <div>
                    <dt className="font-semibold">Languages</dt>
                    <dd className="mt-1 text-muted-foreground">{doctor.languages.join(", ")}</dd>
                  </div>
                ) : null}
                {doctor.location ? (
                  <div>
                    <dt className="font-semibold">Location</dt>
                    <dd className="mt-1 flex gap-2 text-muted-foreground">
                      <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      {doctor.location}
                    </dd>
                  </div>
                ) : null}
              </dl>
              {(data.socialLinks?.length ?? 0) > 0 || Object.keys(doctor.social_links).length ? (
                <div className="mt-6 border-t border-border pt-5">
                  <p className="text-sm font-semibold">Professional links</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {(data.socialLinks?.length
                      ? data.socialLinks.map(({ platform, url }) => [platform, url] as const)
                      : Object.entries(doctor.social_links)
                    ).map(([label, url]) => (
                      <a
                        key={label}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-semibold capitalize text-primary hover:underline"
                      >
                        {label.replace(/_/g, " ")}
                        <ExternalLink className="size-3.5" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </ContentSection>
      ) : null}

      {showSpecializations ? (
        <ContentSection muted>
          <div id="specializations" className="scroll-mt-24" />
          <SectionTitle icon={<Stethoscope />} eyebrow="Clinical focus" title="Specializations" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.specializations.map((item) => (
              <SpecializationCard key={item.id} item={item} />
            ))}
            {doctor.expertise.map((item) => (
              <article
                key={item}
                className="rounded-xl border border-border bg-background p-6 shadow-[var(--shadow-sm)]"
              >
                <h3 className="font-semibold">{item}</h3>
              </article>
            ))}
          </div>
        </ContentSection>
      ) : null}

      {showServices ? (
        <ContentSection>
          <div id="services" className="scroll-mt-24" />
          <SectionTitle
            icon={<BriefcaseMedical />}
            eyebrow="Care offered"
            title="Professional services"
          />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.services.map((service) => {
              const items = data.serviceItems.filter((item) => item.serviceId === service.id);
              return (
                <div key={service.id} className="grid gap-3">
                  <ProfessionalServiceCard service={service} />
                  {items.length ? (
                    <ul className="flex flex-wrap gap-2">
                      {items.map((item) => (
                        <li
                          key={item.id}
                          className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
                        >
                          {item.title}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </ContentSection>
      ) : null}

      {showExperience ? (
        <ContentSection muted>
          <div id="experience" className="scroll-mt-24" />
          <SectionTitle icon={<BriefcaseMedical />} eyebrow="Career" title="Experience" />
          <div className="mt-8 max-w-4xl border-l-2 border-primary/25 pl-6">
            {data.experience.map((item) => (
              <article key={item.id} className="relative pb-8 last:pb-0">
                <span className="absolute -left-[1.95rem] top-1 size-3 rounded-full bg-primary" />
                <p className="text-sm font-semibold text-primary">
                  {years(item.start_year, item.end_year, item.is_present)}
                </p>
                <h3 className="mt-1 text-xl font-semibold">{item.position ?? item.organization}</h3>
                {item.position ? (
                  <p className="mt-1 text-muted-foreground">{item.organization}</p>
                ) : null}
                {item.description ? (
                  <p className="mt-3 leading-7 text-muted-foreground">{item.description}</p>
                ) : null}
              </article>
            ))}
          </div>
        </ContentSection>
      ) : null}

      {showEducation ? (
        <ContentSection>
          <div id="education" className="scroll-mt-24" />
          <SectionTitle icon={<GraduationCap />} eyebrow="Training" title="Education" />
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {data.education.map((item) => (
              <article key={item.id} className="rounded-xl border border-border p-6">
                <p className="text-sm font-semibold text-primary">{item.year ?? ""}</p>
                <h3 className="mt-1 text-lg font-semibold">{item.qualification}</h3>
                {item.institution ? (
                  <p className="mt-2 text-muted-foreground">{item.institution}</p>
                ) : null}
                {item.description ? (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
                ) : null}
              </article>
            ))}
          </div>
        </ContentSection>
      ) : null}

      {showAchievements ? (
        <ContentSection muted>
          <div id="achievements" className="scroll-mt-24" />
          <SectionTitle icon={<Award />} eyebrow="Recognition" title="Achievements & memberships" />
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {data.achievements.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-border bg-background p-6 shadow-[var(--shadow-sm)]"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  {item.achievement_type}
                </p>
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.image_alt ?? ""}
                    className="mb-4 aspect-video w-full rounded-md object-cover"
                  />
                ) : null}
                <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                {item.organization || item.year ? (
                  <p className="mt-2 text-muted-foreground">
                    {[item.organization, item.year].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
                {item.description ? (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
                ) : null}
              </article>
            ))}
          </div>
        </ContentSection>
      ) : null}

      {showLocations ? (
        <ContentSection>
          <div id="locations" className="scroll-mt-24" />
          <SectionTitle icon={<MapPin />} eyebrow="Consultation" title="Locations" />
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {data.locations.map((location) => (
              <article key={location.id} className="rounded-xl border border-border p-6">
                <h3 className="text-xl font-semibold">{location.public_name || location.name}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">
                  {[location.address_line, location.city, location.state, location.postal_code]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {location.consultation_availability ? (
                  <p className="mt-3 text-sm">
                    <strong>Consultation:</strong> {location.consultation_availability}
                  </p>
                ) : null}
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button asChild size="sm">
                    <a href="#request-appointment">Book appointment</a>
                  </Button>
                  {location.phone ? (
                    <Button asChild size="sm" variant="outline">
                      <a href={`tel:${location.phone.replace(/[^+\d]/g, "")}`}>Call location</a>
                    </Button>
                  ) : null}
                  {location.map_url ? (
                    <Button asChild size="sm" variant="outline">
                      <a href={location.map_url} target="_blank" rel="noreferrer">
                        View map
                      </a>
                    </Button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </ContentSection>
      ) : null}

      {showMedia ? (
        <ContentSection muted>
          <div id="media" className="scroll-mt-24" />
          <SectionTitle icon={<BookOpen />} eyebrow="Watch & read" title="Media" />
          <div className="mt-8">
            <MediaGrid items={data.media} />
          </div>
        </ContentSection>
      ) : null}

      {showReviews ? (
        <ContentSection>
          <div id="reviews" className="scroll-mt-24" />
          <SectionTitle icon={<Quote />} eyebrow="Approved feedback" title="Patient reviews" />
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {data.reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </ContentSection>
      ) : null}

      {showFaqs ? (
        <ContentSection muted>
          <div id="faqs" className="scroll-mt-24" />
          <SectionTitle
            icon={<BookOpen />}
            eyebrow="Helpful information"
            title="Frequently asked questions"
          />
          <Accordion type="single" collapsible className="mt-8 max-w-4xl">
            {data.faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>
                  <p className="leading-7 text-muted-foreground">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ContentSection>
      ) : null}

      <ContentSection>
        <div id="request-appointment" className="mx-auto max-w-2xl scroll-mt-24">
          <EnquiryForm
            presetDoctorId={doctor.id}
            source="doctor_profile"
            title={`Request an appointment with ${doctor.name}`}
            description="Share your details and the team will confirm availability."
          />
        </div>
      </ContentSection>

      <div className="h-20 lg:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <Button asChild className="flex-1">
            <a href="#request-appointment">Book appointment</a>
          </Button>
          {whatsapp ? (
            <Button asChild variant="outline" size="icon" aria-label="Chat on WhatsApp">
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">
                <MessageCircle className="size-5" aria-hidden="true" />
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

function SpecializationCard({
  item,
}: {
  item: { title: string; description: string | null; icon: string | null };
}) {
  return (
    <article className="rounded-xl border border-border bg-background p-6 shadow-[var(--shadow-sm)]">
      <div className="flex min-w-0 items-center gap-3">
        <SpecializationIcon src={item.icon} />
        <h3 className="min-w-0 text-lg font-semibold leading-snug">{item.title}</h3>
      </div>
      {item.description ? (
        <p className="mt-4 leading-7 text-muted-foreground">{item.description}</p>
      ) : null}
    </article>
  );
}

function SpecializationIcon({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false);

  return src && !failed ? (
    <img
      src={src}
      alt=""
      className="size-10 shrink-0 object-contain"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <Stethoscope className="size-8 shrink-0 text-muted-foreground" aria-hidden="true" />
  );
}

function SectionTitle({
  icon,
  eyebrow,
  title,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
        {icon}
      </span>
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-primary">{eyebrow}</p>
        <h2 className="mt-1 text-3xl font-semibold">{title}</h2>
      </div>
    </div>
  );
}
