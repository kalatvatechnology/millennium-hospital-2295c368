import { Link } from "@tanstack/react-router";
import { ArrowRight, Building2, CalendarDays, Layers, Quote, Stethoscope, UserRound } from "lucide-react";
import type {
  BlogPost,
  Department,
  DoctorWithDepartment,
  FacilityRow,
  HospitalService,
  ProfessionalService,
  ReviewRow,
} from "@/lib/queries";

export function DoctorCard({ doctor }: { doctor: DoctorWithDepartment }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-md)]">
      <div className="grid aspect-[4/3] place-items-center overflow-hidden bg-surface">
        {doctor.photo_url ? (
          <img src={doctor.photo_url} alt={`Portrait of ${doctor.name}`} className="size-full object-cover" loading="lazy" />
        ) : (
          <UserRound className="size-12 text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold text-primary">{doctor.specialty ?? doctor.department?.name ?? "Specialty not published"}</p>
        <h3 className="mt-1.5 text-base font-semibold">{doctor.name}</h3>
        {doctor.qualifications.length ? (
          <p className="mt-1 text-sm text-muted-foreground">{doctor.qualifications.join(", ")}</p>
        ) : null}
        <p className="mt-2 text-sm text-muted-foreground">{doctor.designation ?? "Designation not published"}</p>
        {doctor.experience_years ? (
          <p className="mt-1 text-sm text-muted-foreground">{doctor.experience_years} years of experience</p>
        ) : null}
        <Link
          to="/doctors/$slug"
          params={{ slug: doctor.slug }}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"
        >
          View profile <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}

export function DepartmentCard({ department }: { department: Department }) {
  const summary = department.short_description ?? department.description;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-[var(--shadow-md)]">
      <div className="relative aspect-[3/2] overflow-hidden bg-secondary">
        {department.card_image_url ? (
          <img
            src={department.card_image_url}
            alt={department.card_image_alt ?? `${department.name} department at The Millennium Hospital`}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="grid size-full place-items-center bg-gradient-to-br from-secondary to-surface" aria-hidden="true">
            <span className="grid size-14 place-items-center rounded-full bg-background text-primary shadow-[var(--shadow-sm)]"><Layers /></span>
          </div>
        )}
        <span className="absolute inset-x-0 bottom-0 h-1 bg-accent" aria-hidden="true" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold text-foreground">{department.name}</h3>
        {summary ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{summary}</p> : null}
        <Link
          to="/departments/$slug"
          params={{ slug: department.slug }}
          className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-semibold text-primary after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Read more about ${department.name}`}
        >
          Read More <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}

export function ProfessionalServiceCard({ service }: { service: ProfessionalService }) {
  return (
    <article className="group rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-md)]">
      <span className="grid size-10 place-items-center rounded-lg bg-secondary text-primary"><Stethoscope /></span>
      <p className="mt-4 text-xs font-semibold uppercase text-muted-foreground">Professional service</p>
      <h3 className="mt-1.5 text-base font-semibold">{service.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
        {service.summary ?? "Further information has not yet been published."}
      </p>
      <Link
        to="/services/professional/$slug"
        params={{ slug: service.slug }}
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"
      >
        View service <ArrowRight className="size-4" />
      </Link>
    </article>
  );
}

export function HospitalServiceCard({ service }: { service: HospitalService }) {
  return (
    <article className="group rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-md)]">
      <span className="grid size-10 place-items-center rounded-lg bg-secondary text-primary"><Building2 /></span>
      <p className="mt-4 text-xs font-semibold uppercase text-muted-foreground">Hospital service</p>
      <h3 className="mt-1.5 text-base font-semibold">{service.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
        {service.summary ?? "Further information has not yet been published."}
      </p>
      <Link
        to="/services/hospital/$slug"
        params={{ slug: service.slug }}
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"
      >
        View service <ArrowRight className="size-4" />
      </Link>
    </article>
  );
}

export function FacilityCard({ facility }: { facility: FacilityRow }) {
  const image = facility.images[0] ?? null;
  return (
    <article className="group overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-md)]">
      <div className="grid aspect-[16/9] place-items-center overflow-hidden bg-surface">
        {image ? (
          <img src={image} alt={facility.name} className="size-full object-cover" loading="lazy" />
        ) : (
          <Building2 className="size-10 text-muted-foreground" />
        )}
      </div>
      <div className="p-4">
        <h3 className="text-base font-semibold">{facility.name}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
          {facility.description ?? "Further information has not yet been published."}
        </p>
        <Link
          to="/facilities/$slug"
          params={{ slug: facility.slug }}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"
        >
          View facility <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}

export function ReviewCard({ review }: { review: ReviewRow & { doctor?: { name: string; slug: string } | null } }) {
  return (
    <figure className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
      <Quote className="text-primary" />
      <blockquote className="mt-3 text-sm leading-6">“{review.content}”</blockquote>
      <figcaption className="mt-3 text-xs text-muted-foreground">
        {review.author_name}
        {review.doctor ? ` · about ${review.doctor.name}` : ""}
        {review.rating ? ` · ${review.rating}/5` : ""}
      </figcaption>
    </figure>
  );
}

export function ArticleCard({
  post,
}: {
  post: BlogPost & { category?: { name: string; slug: string } | null; author?: { name: string; slug: string } | null };
}) {
  return (
    <article className="flex flex-col rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-md)]">
      <CalendarDays className="text-primary" />
      {post.category ? <p className="mt-4 text-xs font-semibold uppercase text-muted-foreground">{post.category.name}</p> : null}
      <h3 className="mt-1.5 text-base font-semibold">{post.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{post.excerpt ?? "Article summary not published."}</p>
      {post.author ? <p className="mt-3 text-xs text-muted-foreground">By {post.author.name}</p> : null}
      <Link
        to="/blog/$slug"
        params={{ slug: post.slug }}
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"
      >
        Read article <ArrowRight className="size-4" />
      </Link>
    </article>
  );
}
