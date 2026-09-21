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
    <article className="flex flex-col border border-border bg-background">
      <div className="grid aspect-[4/3] place-items-center overflow-hidden bg-surface">
        {doctor.photo_url ? (
          <img src={doctor.photo_url} alt={`Portrait of ${doctor.name}`} className="size-full object-cover" loading="lazy" />
        ) : (
          <UserRound className="size-12 text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold text-primary">{doctor.specialty ?? doctor.department?.name ?? "Specialty not published"}</p>
        <h3 className="mt-2 text-xl font-semibold">{doctor.name}</h3>
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
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"
        >
          View profile <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}

export function DepartmentCard({ department }: { department: Department }) {
  return (
    <article className="border border-border bg-background p-6">
      <Layers className="text-primary" />
      <h3 className="mt-6 text-xl font-semibold">{department.name}</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {department.description ?? "Further department information has not yet been published."}
      </p>
      <Link
        to="/departments/$slug"
        params={{ slug: department.slug }}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"
      >
        View department <ArrowRight className="size-4" />
      </Link>
    </article>
  );
}

export function ProfessionalServiceCard({ service }: { service: ProfessionalService }) {
  return (
    <article className="border border-border bg-background p-6">
      <Stethoscope className="text-primary" />
      <p className="mt-6 text-xs font-semibold uppercase text-muted-foreground">Professional service</p>
      <h3 className="mt-2 text-xl font-semibold">{service.title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {service.summary ?? "Further information has not yet been published."}
      </p>
      <Link
        to="/services/professional/$slug"
        params={{ slug: service.slug }}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"
      >
        View service <ArrowRight className="size-4" />
      </Link>
    </article>
  );
}

export function HospitalServiceCard({ service }: { service: HospitalService }) {
  return (
    <article className="border border-border bg-background p-6">
      <Building2 className="text-primary" />
      <p className="mt-6 text-xs font-semibold uppercase text-muted-foreground">Hospital service</p>
      <h3 className="mt-2 text-xl font-semibold">{service.title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {service.summary ?? "Further information has not yet been published."}
      </p>
      <Link
        to="/services/hospital/$slug"
        params={{ slug: service.slug }}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"
      >
        View service <ArrowRight className="size-4" />
      </Link>
    </article>
  );
}

export function FacilityCard({ facility }: { facility: FacilityRow }) {
  const image = facility.images[0] ?? null;
  return (
    <article className="border border-border bg-background">
      <div className="grid aspect-[16/9] place-items-center overflow-hidden bg-surface">
        {image ? (
          <img src={image} alt={facility.name} className="size-full object-cover" loading="lazy" />
        ) : (
          <Building2 className="size-10 text-muted-foreground" />
        )}
      </div>
      <div className="p-5">
        <h3 className="text-xl font-semibold">{facility.name}</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {facility.description ?? "Further information has not yet been published."}
        </p>
        <Link
          to="/facilities/$slug"
          params={{ slug: facility.slug }}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"
        >
          View facility <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}

export function ReviewCard({ review }: { review: ReviewRow & { doctor?: { name: string; slug: string } | null } }) {
  return (
    <figure className="border border-border bg-background p-6">
      <Quote className="text-primary" />
      <blockquote className="mt-5 leading-7">“{review.content}”</blockquote>
      <figcaption className="mt-5 text-sm text-muted-foreground">
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
    <article className="flex flex-col border border-border bg-background p-6">
      <CalendarDays className="text-primary" />
      {post.category ? <p className="mt-6 text-xs font-semibold uppercase text-muted-foreground">{post.category.name}</p> : null}
      <h3 className="mt-2 text-xl font-semibold">{post.title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{post.excerpt ?? "Article summary not published."}</p>
      {post.author ? <p className="mt-3 text-xs text-muted-foreground">By {post.author.name}</p> : null}
      <Link
        to="/blog/$slug"
        params={{ slug: post.slug }}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"
      >
        Read article <ArrowRight className="size-4" />
      </Link>
    </article>
  );
}
