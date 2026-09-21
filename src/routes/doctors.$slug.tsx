import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Award, BookOpen, BriefcaseMedical, ExternalLink, GraduationCap, MapPin, MessageCircle, Phone, Quote, Stethoscope, UserRound } from "lucide-react";
import { PublicPage } from "@/components/layout/public-page";
import { ContentSection, EmptyState } from "@/components/shared/page";
import { ProfessionalServiceCard, ReviewCard } from "@/components/content/cards";
import { MediaGrid } from "@/components/content/media";
import { EnquiryForm } from "@/components/content/enquiry-form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { doctorQuery } from "@/lib/queries";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/doctors/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(doctorQuery(params.slug)),
  head: ({ loaderData }) => {
    const doctor = loaderData?.doctor;
    const title = doctor?.seo_title ?? doctor?.name ?? "Doctor profile";
    const description = doctor?.seo_description ?? doctor?.short_introduction ?? doctor?.bio ?? "View a clinician profile at The Millennium Hospital.";
    return {
      meta: [
        ...createPageMeta(title, description),
        ...(doctor?.og_image_url ? [{ property: "og:image", content: doctor.og_image_url }] : []),
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
  const data = Route.useLoaderData();
  if (!data) return <PublicPage><ContentSection><EmptyState title="We couldn't find this doctor" description="This profile may not be published yet or the address may have changed." action={<Button asChild><Link to="/doctors">View all doctors</Link></Button>} /></ContentSection></PublicPage>;
  const { doctor } = data;
  const phone = doctor.phone_number?.replace(/[^+\d]/g, "");
  const whatsapp = doctor.whatsapp_number?.replace(/\D/g, "");
  const heroImage = doctor.hero_image_url ?? doctor.photo_url;
  const qualifications = doctor.qualifications.length > 0;

  return <PublicPage>
    <section className="relative overflow-hidden border-b border-border bg-secondary">
      <div className="absolute inset-y-0 right-0 hidden w-2/5 bg-primary/5 lg:block" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,.9fr)] lg:px-8 lg:py-20">
        <div className="order-2 lg:order-1">
          <Link to="/doctors" className="text-sm font-semibold text-primary hover:underline">Our doctors</Link>
          <p className="mt-6 text-sm font-bold uppercase tracking-[.18em] text-primary">{doctor.specialty ?? doctor.department?.name ?? "Medical team"}</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">{doctor.name}</h1>
          {doctor.designation ? <p className="mt-4 text-xl text-muted-foreground">{doctor.designation}</p> : null}
          {doctor.short_introduction ? <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{doctor.short_introduction}</p> : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild><a href="#request-appointment">Request an appointment</a></Button>
            {phone ? <Button asChild variant="outline"><a href={`tel:${phone}`}><Phone className="size-4" /> Call</a></Button> : null}
            {whatsapp ? <Button asChild variant="outline"><a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /> WhatsApp</a></Button> : null}
          </div>
        </div>
        <div className="order-1 mx-auto w-full max-w-md lg:order-2">
          <div className="grid aspect-[4/5] place-items-center overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-lg)]">
            {heroImage ? <img src={heroImage} alt={doctor.hero_image_alt ?? doctor.profile_image_alt ?? `Portrait of ${doctor.name}`} className="size-full object-cover" /> : <UserRound className="size-16 text-muted-foreground" />}
          </div>
        </div>
      </div>
    </section>

    {visible(doctor.section_visibility, "statistics") && data.statistics.length ? <section aria-label="Profile highlights" className="border-b border-border bg-background"><div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-border px-4 sm:px-6 md:grid-cols-4 lg:px-8">{data.statistics.map((item) => <div key={item.id} className="bg-background px-4 py-8 text-center"><strong className="block text-3xl font-semibold text-primary">{item.value}</strong><span className="mt-1 block text-sm text-muted-foreground">{item.label}</span></div>)}</div></section> : null}

    {(doctor.bio || qualifications || doctor.languages.length || doctor.department || doctor.experience_years || Object.keys(doctor.social_links).length) ? <ContentSection>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,.7fr)]">
        {doctor.bio ? <div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-wider text-primary">Professional profile</p><h2 className="mt-3 text-3xl font-semibold">About {doctor.name}</h2><div className="mt-5 whitespace-pre-line leading-8 text-muted-foreground">{doctor.bio}</div></div> : <div />}
        <aside className="h-fit rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-sm)]">
          <h2 className="text-lg font-semibold">At a glance</h2><dl className="mt-5 grid gap-5 text-sm">
            {qualifications ? <div><dt className="font-semibold">Qualifications</dt><dd className="mt-1 text-muted-foreground">{doctor.qualifications.join(", ")}</dd></div> : null}
            {doctor.department ? <div><dt className="font-semibold">Department</dt><dd className="mt-1 text-muted-foreground">{doctor.department.name}</dd></div> : null}
            {doctor.experience_years ? <div><dt className="font-semibold">Experience</dt><dd className="mt-1 text-muted-foreground">{doctor.experience_years} years</dd></div> : null}
            {doctor.languages.length ? <div><dt className="font-semibold">Languages</dt><dd className="mt-1 text-muted-foreground">{doctor.languages.join(", ")}</dd></div> : null}
          </dl>
          {Object.keys(doctor.social_links).length ? <div className="mt-6 border-t border-border pt-5"><p className="text-sm font-semibold">Professional links</p><div className="mt-3 flex flex-wrap gap-3">{Object.entries(doctor.social_links).map(([label, url]) => <a key={label} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold capitalize text-primary hover:underline">{label.replace(/_/g, " ")}<ExternalLink className="size-3.5" /></a>)}</div></div> : null}
        </aside>
      </div>
    </ContentSection> : null}

    {visible(doctor.section_visibility, "quote") && doctor.quote ? <ContentSection muted><figure className="mx-auto max-w-4xl text-center"><Quote className="mx-auto size-10 text-primary" /><blockquote className="mt-6 text-2xl font-medium leading-10 sm:text-3xl">“{doctor.quote}”</blockquote>{doctor.quote_attribution ? <figcaption className="mt-5 text-sm font-semibold text-muted-foreground">— {doctor.quote_attribution}</figcaption> : null}</figure></ContentSection> : null}

    {visible(doctor.section_visibility, "specializations") && (data.specializations.length || doctor.expertise.length) ? <ContentSection><SectionTitle icon={<Stethoscope />} eyebrow="Clinical focus" title="Specializations" /><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.specializations.map((item) => <article key={item.id} className="rounded-xl border border-border p-6"><h3 className="text-lg font-semibold">{item.title}</h3>{item.description ? <p className="mt-3 leading-7 text-muted-foreground">{item.description}</p> : null}</article>)}{doctor.expertise.map((item) => <article key={item} className="rounded-xl border border-border p-6"><h3 className="font-semibold">{item}</h3></article>)}</div></ContentSection> : null}

    {visible(doctor.section_visibility, "services") && data.services.length ? <ContentSection muted><SectionTitle icon={<BriefcaseMedical />} eyebrow="Care offered" title="Professional services" /><div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.services.map((service) => <ProfessionalServiceCard key={service.id} service={service} />)}</div></ContentSection> : null}

    {visible(doctor.section_visibility, "experience") && data.experience.length ? <ContentSection><SectionTitle icon={<BriefcaseMedical />} eyebrow="Career" title="Experience" /><div className="mt-8 max-w-4xl border-l-2 border-primary/25 pl-6">{data.experience.map((item) => <article key={item.id} className="relative pb-8 last:pb-0"><span className="absolute -left-[1.95rem] top-1 size-3 rounded-full bg-primary" /><p className="text-sm font-semibold text-primary">{years(item.start_year, item.end_year, item.is_present)}</p><h3 className="mt-1 text-xl font-semibold">{item.position ?? item.organization}</h3>{item.position ? <p className="mt-1 text-muted-foreground">{item.organization}</p> : null}{item.description ? <p className="mt-3 leading-7 text-muted-foreground">{item.description}</p> : null}</article>)}</div></ContentSection> : null}

    {visible(doctor.section_visibility, "education") && data.education.length ? <ContentSection muted><SectionTitle icon={<GraduationCap />} eyebrow="Training" title="Education" /><div className="mt-8 grid gap-5 md:grid-cols-2">{data.education.map((item) => <article key={item.id} className="rounded-xl border border-border bg-background p-6"><p className="text-sm font-semibold text-primary">{item.year ?? ""}</p><h3 className="mt-1 text-lg font-semibold">{item.qualification}</h3>{item.institution ? <p className="mt-2 text-muted-foreground">{item.institution}</p> : null}{item.description ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p> : null}</article>)}</div></ContentSection> : null}

    {visible(doctor.section_visibility, "achievements") && data.achievements.length ? <ContentSection><SectionTitle icon={<Award />} eyebrow="Recognition" title="Achievements & memberships" /><div className="mt-8 grid gap-5 md:grid-cols-2">{data.achievements.map((item) => <article key={item.id} className="rounded-xl border border-border p-6"><p className="text-xs font-bold uppercase tracking-wider text-primary">{item.achievement_type}</p><h3 className="mt-2 text-lg font-semibold">{item.title}</h3>{item.organization || item.year ? <p className="mt-2 text-muted-foreground">{[item.organization, item.year].filter(Boolean).join(" · ")}</p> : null}</article>)}</div></ContentSection> : null}

    {visible(doctor.section_visibility, "locations") && data.locations.length ? <ContentSection muted><SectionTitle icon={<MapPin />} eyebrow="Consultation" title="Locations" /><div className="mt-8 grid gap-5 md:grid-cols-2">{data.locations.map((location) => <article key={location.id} className="rounded-xl border border-border bg-background p-6"><h3 className="text-xl font-semibold">{location.name}</h3><p className="mt-3 leading-7 text-muted-foreground">{[location.address_line, location.city, location.state, location.postal_code].filter(Boolean).join(", ")}</p>{location.consultation_availability ? <p className="mt-3 text-sm"><strong>Consultation:</strong> {location.consultation_availability}</p> : null}<div className="mt-5 flex flex-wrap gap-3">{location.phone ? <Button asChild size="sm" variant="outline"><a href={`tel:${location.phone.replace(/[^+\d]/g, "")}`}>Call location</a></Button> : null}{location.map_url ? <Button asChild size="sm" variant="outline"><a href={location.map_url} target="_blank" rel="noreferrer">View map</a></Button> : null}</div></article>)}</div></ContentSection> : null}

    {visible(doctor.section_visibility, "reviews") && data.reviews.length ? <ContentSection><SectionTitle icon={<Quote />} eyebrow="Approved feedback" title="Patient reviews" /><div className="mt-8 grid gap-6 md:grid-cols-2">{data.reviews.map((review) => <ReviewCard key={review.id} review={review} />)}</div></ContentSection> : null}
    {visible(doctor.section_visibility, "media") && data.media.length ? <ContentSection muted><SectionTitle icon={<BookOpen />} eyebrow="Watch & read" title="Media" /><div className="mt-8"><MediaGrid items={data.media} /></div></ContentSection> : null}
    {visible(doctor.section_visibility, "faqs") && data.faqs.length ? <ContentSection><SectionTitle icon={<BookOpen />} eyebrow="Helpful information" title="Frequently asked questions" /><Accordion type="single" collapsible className="mt-8 max-w-4xl">{data.faqs.map((faq) => <AccordionItem key={faq.id} value={faq.id}><AccordionTrigger>{faq.question}</AccordionTrigger><AccordionContent><p className="leading-7 text-muted-foreground">{faq.answer}</p></AccordionContent></AccordionItem>)}</Accordion></ContentSection> : null}

    <ContentSection muted><div id="request-appointment" className="mx-auto max-w-2xl scroll-mt-24"><EnquiryForm presetDoctorId={doctor.id} source="doctor_profile" title={`Request an appointment with ${doctor.name}`} description="Share your details and the team will confirm availability." /></div></ContentSection>
  </PublicPage>;
}

function SectionTitle({ icon, eyebrow, title }: { icon: ReactNode; eyebrow: string; title: string }) {
  return <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-lg bg-secondary text-primary">{icon}</span><div><p className="text-sm font-bold uppercase tracking-wider text-primary">{eyebrow}</p><h2 className="mt-1 text-3xl font-semibold">{title}</h2></div></div>;
}