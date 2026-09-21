import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, MapPin, MessageCircle, UserRound } from "lucide-react";
import { PublicPage } from "@/components/layout/public-page";
import { Async } from "@/components/shared/async";
import { ContentSection, EmptyState, PageIntro } from "@/components/shared/page";
import { ProfessionalServiceCard, ReviewCard } from "@/components/content/cards";
import { MediaGrid } from "@/components/content/media";
import { EnquiryForm } from "@/components/content/enquiry-form";
import { Button } from "@/components/ui/button";
import { doctorQuery } from "@/lib/queries";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/doctors/$slug")({
  head: () => ({
    meta: [...createPageMeta("Doctor profile", "View a verified clinician profile at The Millennium Hospital.")],
  }),
  component: DoctorDetail,
});

function DoctorDetail() {
  const { slug } = Route.useParams();
  const query = useQuery(doctorQuery(slug));

  return (
    <PublicPage>
      <Async query={query}>
        {(data) =>
          !data ? (
            <ContentSection>
              <EmptyState
                title="We couldn't find this doctor"
                description="This profile may not be published yet or the address may have changed."
                action={<Button asChild><Link to="/doctors">View all doctors</Link></Button>}
              />
            </ContentSection>
          ) : (
            <>
              <section className="border-b border-border bg-secondary">
                <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:px-8">
                  <div className="grid aspect-[4/5] max-w-md place-items-center overflow-hidden bg-surface shadow-[var(--shadow-lg)]">
                    {data.doctor.photo_url ? (
                      <img src={data.doctor.photo_url} alt={`Portrait of ${data.doctor.name}`} className="size-full object-cover" />
                    ) : (
                      <UserRound className="size-14 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">{data.doctor.specialty ?? data.doctor.department?.name ?? "Medical team"}</p>
                    <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">{data.doctor.name}</h1>
                    <p className="mt-4 text-xl text-muted-foreground">{data.doctor.designation ?? "Designation not yet published."}</p>
                    <div className="mt-8 flex flex-wrap gap-3">
                      <Button asChild><a href="#request-appointment">Request an appointment</a></Button>
                      {data.doctor.whatsapp_number ? (
                        <Button asChild variant="outline">
                          <a href={`https://wa.me/${data.doctor.whatsapp_number.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><MessageCircle />WhatsApp</a>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>
              <ContentSection>
                <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.7fr)]">
                  <div className="max-w-3xl">
                    <p className="text-sm font-bold text-primary">Professional profile</p>
                    <h2 className="mt-3 text-3xl font-semibold">About {data.doctor.name}</h2>
                    <p className="mt-5 leading-8 text-muted-foreground">{data.doctor.bio ?? "A profile biography has not yet been published."}</p>
                    {data.doctor.consultation_info ? (
                      <div className="mt-10 border-l-4 border-brand-accent pl-5">
                        <h2 className="text-xl font-semibold">Consultation information</h2>
                        <p className="mt-3 leading-7 text-muted-foreground">{data.doctor.consultation_info}</p>
                      </div>
                    ) : null}
                    {data.doctor.expertise.length ? (
                      <>
                        <h2 className="mt-10 text-2xl font-semibold">Areas of expertise</h2>
                        <ul className="mt-4 grid gap-2 text-muted-foreground sm:grid-cols-2">
                          {data.doctor.expertise.map((item) => <li key={item}>• {item}</li>)}
                        </ul>
                      </>
                    ) : null}
                  </div>
                  <aside className="h-fit border-t-4 border-primary bg-surface p-6 shadow-[var(--shadow-md)]">
                    <h2 className="text-lg font-semibold">At a glance</h2>
                    <dl className="mt-5 grid gap-5 text-sm">
                      <div><dt className="font-semibold">Qualifications</dt><dd className="mt-1 text-muted-foreground">{data.doctor.qualifications.length ? data.doctor.qualifications.join(", ") : "Not yet published"}</dd></div>
                      <div><dt className="font-semibold">Department</dt><dd className="mt-1 text-muted-foreground">{data.doctor.department?.name ?? "Not yet published"}</dd></div>
                      <div><dt className="font-semibold">Experience</dt><dd className="mt-1 text-muted-foreground">{data.doctor.experience_years ? `${data.doctor.experience_years} years` : "Not yet published"}</dd></div>
                      <div><dt className="font-semibold">Languages</dt><dd className="mt-1 text-muted-foreground">{data.doctor.languages.length ? data.doctor.languages.join(", ") : "Not yet published"}</dd></div>
                      <div><dt className="font-semibold">Location</dt><dd className="mt-1 flex gap-2 text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0" />{data.doctor.location_info ?? data.doctor.location ?? "Not yet published"}</dd></div>
                    </dl>
                    {Object.keys(data.doctor.social_links).length ? (
                      <div className="mt-6 border-t border-border pt-5">
                        <p className="text-sm font-semibold">Professional links</p>
                        <div className="mt-3 flex flex-wrap gap-3">
                          {Object.entries(data.doctor.social_links).map(([label, url]) => (
                            <a key={label} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold capitalize text-primary hover:underline">
                              {label.replace(/_/g, " ")}<ExternalLink className="size-3.5" />
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </aside>
                </div>
              </ContentSection>

              {data.services.length ? (
                <ContentSection muted>
                  <h2 className="text-2xl font-semibold">Professional services</h2>
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {data.services.map((service) => <ProfessionalServiceCard key={service.id} service={service} />)}
                  </div>
                </ContentSection>
              ) : null}

              {data.reviews.length ? (
                <ContentSection>
                  <h2 className="text-2xl font-semibold">Patient reviews</h2>
                  <div className="mt-8 grid gap-6 md:grid-cols-2">
                    {data.reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
                  </div>
                </ContentSection>
              ) : null}

              {data.media.length ? (
                <ContentSection muted>
                  <h2 className="text-2xl font-semibold">Media</h2>
                  <div className="mt-8"><MediaGrid items={data.media} /></div>
                </ContentSection>
              ) : null}

              <ContentSection>
                <div id="request-appointment" className="mx-auto max-w-2xl scroll-mt-24">
                  <EnquiryForm
                    presetDoctorId={data.doctor.id}
                    source="doctor_profile"
                    title={`Request an appointment with ${data.doctor.name}`}
                    description="Share your details and the team will confirm availability."
                  />
                </div>
              </ContentSection>
            </>
          )
        }
      </Async>
    </PublicPage>
  );
}
