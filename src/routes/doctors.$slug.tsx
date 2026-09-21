import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
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
              <PageIntro
                eyebrow={data.doctor.specialty ?? data.doctor.department?.name ?? "Medical team"}
                title={data.doctor.name}
                description={data.doctor.designation ?? "Designation not yet published."}
              />
              <ContentSection>
                <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
                  <div>
                    <div className="grid aspect-[16/9] max-w-xl place-items-center overflow-hidden bg-surface">
                      {data.doctor.photo_url ? (
                        <img src={data.doctor.photo_url} alt={`Portrait of ${data.doctor.name}`} className="size-full object-cover" />
                      ) : (
                        <UserRound className="size-12 text-muted-foreground" />
                      )}
                    </div>
                    <h2 className="mt-10 text-2xl font-semibold">About</h2>
                    <p className="mt-4 leading-8 text-muted-foreground">{data.doctor.bio ?? "A profile biography has not yet been published."}</p>
                    {data.doctor.expertise.length ? (
                      <>
                        <h2 className="mt-10 text-2xl font-semibold">Areas of expertise</h2>
                        <ul className="mt-4 grid gap-2 text-muted-foreground sm:grid-cols-2">
                          {data.doctor.expertise.map((item) => <li key={item}>• {item}</li>)}
                        </ul>
                      </>
                    ) : null}
                  </div>
                  <aside className="h-fit border border-border bg-surface p-6">
                    <h2 className="text-lg font-semibold">Profile details</h2>
                    <dl className="mt-5 grid gap-4 text-sm">
                      <div><dt className="font-semibold">Qualifications</dt><dd className="text-muted-foreground">{data.doctor.qualifications.length ? data.doctor.qualifications.join(", ") : "Not yet published"}</dd></div>
                      <div><dt className="font-semibold">Department</dt><dd className="text-muted-foreground">{data.doctor.department?.name ?? "Not yet published"}</dd></div>
                      <div><dt className="font-semibold">Experience</dt><dd className="text-muted-foreground">{data.doctor.experience_years ? `${data.doctor.experience_years} years` : "Not yet published"}</dd></div>
                      <div><dt className="font-semibold">Languages</dt><dd className="text-muted-foreground">{data.doctor.languages.length ? data.doctor.languages.join(", ") : "Not yet published"}</dd></div>
                      <div><dt className="font-semibold">Location</dt><dd className="text-muted-foreground">{data.doctor.location ?? "Not yet published"}</dd></div>
                    </dl>
                    <Button asChild className="mt-6 w-full"><a href="#request-appointment">Request an appointment</a></Button>
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
