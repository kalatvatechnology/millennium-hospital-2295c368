import { Link } from "@tanstack/react-router";
import { ArrowRight, Building2, CalendarDays, Quote, Stethoscope, UserRound } from "lucide-react";
import type { Article, Doctor, Facility, Review, Service } from "@/content/placeholders";

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  return <article className="border border-border bg-background"><div className="grid aspect-[4/3] place-items-center bg-surface">{doctor.photo ? <img src={doctor.photo} alt="" className="size-full object-cover" /> : <UserRound className="size-12 text-muted-foreground" />}</div><div className="p-5"><p className="text-xs font-semibold text-primary">{doctor.specialty ?? "Specialty not published"}</p><h3 className="mt-2 text-xl font-semibold">{doctor.name}</h3><p className="mt-2 text-sm text-muted-foreground">{doctor.designation ?? "Designation not published"}</p><Link to="/doctors/$slug" params={{ slug: doctor.slug }} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">View profile <ArrowRight className="size-4" /></Link></div></article>;
}

export function ServiceCard({ service }: { service: Service }) {
  return <article className="border border-border bg-background p-6"><Stethoscope className="text-primary" /><p className="mt-6 text-xs font-semibold uppercase text-muted-foreground">{service.type === "professional" ? "Professional service" : "Hospital service"}</p><h3 className="mt-2 text-xl font-semibold">{service.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{service.summary ?? "Further information has not yet been published."}</p><Link to="/services/$slug" params={{ slug: service.slug }} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">View service <ArrowRight className="size-4" /></Link></article>;
}

export function FacilityCard({ facility }: { facility: Facility }) {
  return <article className="border border-border bg-background"><div className="grid aspect-[16/9] place-items-center bg-surface">{facility.image ? <img src={facility.image} alt="" className="size-full object-cover" /> : <Building2 className="size-10 text-muted-foreground" />}</div><div className="p-5"><h3 className="text-xl font-semibold">{facility.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{facility.description ?? "Further information has not yet been published."}</p></div></article>;
}

export function ReviewCard({ review }: { review: Review }) {
  return <figure className="border border-border bg-background p-6"><Quote className="text-primary" /><blockquote className="mt-5 leading-7">“{review.quote}”</blockquote><figcaption className="mt-5 text-sm text-muted-foreground">{review.author ?? "Verified patient"}</figcaption></figure>;
}

export function ArticleCard({ article }: { article: Article }) {
  return <article className="border border-border bg-background p-6"><CalendarDays className="text-primary" /><h3 className="mt-6 text-xl font-semibold">{article.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{article.summary ?? "Article summary not published."}</p><Link to="/blog/$slug" params={{ slug: article.slug }} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Read article <ArrowRight className="size-4" /></Link></article>;
}