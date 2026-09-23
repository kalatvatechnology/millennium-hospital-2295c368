import { isGoogleMapsEmbedUrl } from "@/lib/admin-content";
import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, Clock, MapPin, Navigation, Phone, Star, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewCard } from "@/components/content/cards";
import { MediaGrid } from "@/components/content/media";
import { groupSchedule } from "@/lib/schedule-groups";
import type { DoctorLocation, MediaItem, Review, Service } from "@/lib/data/models";

/** Shared page container: ~1200px, responsive gutters. */
export const container = "mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-10";

export function ProfileSection({
  id,
  title,
  eyebrow,
  muted = false,
  action,
  children,
}: {
  id: string;
  title: string;
  eyebrow?: string;
  muted?: boolean;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={`scroll-mt-36 py-8 sm:py-10 lg:py-12 ${muted ? "bg-surface/60" : "bg-background"}`}
    >
      <div className={container}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-xs font-bold uppercase tracking-[.16em] text-brand-accent">
                {eyebrow}
              </p>
            ) : null}
            <h2 id={`${id}-title`} className="mt-1 text-2xl font-semibold leading-tight sm:text-[1.75rem]">
              {title}
            </h2>
          </div>
          {action}
        </div>
        <div className="mt-5 sm:mt-6">{children}</div>
      </div>
    </section>
  );
}

export function DoctorSectionNav({ items }: { items: { id: string; label: string }[] }) {
  if (items.length < 2) return null;
  return (
    <nav
      aria-label="Profile sections"
      className="sticky top-20 z-30 border-b border-border bg-background/95 backdrop-blur"
    >
      <div className={`${container} overflow-x-auto [scrollbar-width:none]`}>
        <ul className="flex min-w-max gap-1 py-1.5">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="inline-flex min-h-10 items-center whitespace-nowrap rounded-md px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export function DoctorQuickStats({
  items,
}: {
  items: { id: string; value: string; label: string; icon: string | null; meaning: string | null }[];
}) {
  return (
    <section aria-label="Profile highlights" className="border-b border-border bg-background">
      <div className={container}>
        <dl className="grid grid-cols-2 divide-border md:grid-cols-4 md:divide-x">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-3 py-4 sm:py-5 md:justify-center ${index % 2 === 1 ? "border-l border-border md:border-l-0" : ""} ${index >= 2 ? "border-t border-border md:border-t-0" : ""}`}
            >
              {item.icon ? (
                <img src={item.icon} alt="" className="size-9 shrink-0 object-contain" loading="lazy" />
              ) : null}
              <div className="min-w-0">
                <dd className="text-2xl font-semibold leading-none text-primary sm:text-[1.7rem]">
                  {item.value}
                </dd>
                <dt
                  className="mt-1 text-xs font-medium leading-snug text-muted-foreground sm:text-sm"
                  title={item.meaning ?? undefined}
                >
                  {item.label}
                </dt>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** Grouped weekly hours; falls back to the stored text summary for older records. */
export function ConsultationHours({
  location,
  limit,
  showClosed = true,
}: {
  location: Pick<DoctorLocation, "consultation_availability" | "consultation_schedule">;
  limit?: number;
  showClosed?: boolean;
}) {
  const groups = groupSchedule(location.consultation_schedule)?.filter(
    (g) => showClosed || !g.closed,
  );
  if (!groups?.length) {
    return location.consultation_availability ? (
      <p className="text-sm leading-6 text-muted-foreground">{location.consultation_availability}</p>
    ) : null;
  }
  const shown = limit ? groups.slice(0, limit) : groups;
  return (
    <dl className="grid gap-1.5 text-sm">
      {shown.map((g) => (
        <div key={g.days} className="grid grid-cols-[minmax(5.5rem,auto)_1fr] gap-3">
          <dt className={`font-semibold ${g.closed ? "text-muted-foreground" : "text-foreground"}`}>
            {g.days}
          </dt>
          <dd className={g.closed ? "text-muted-foreground" : "text-foreground"}>{g.value}</dd>
        </div>
      ))}
      {limit && groups.length > limit ? (
        <p className="text-xs text-muted-foreground">+ more hours below</p>
      ) : null}
    </dl>
  );
}

export const locationAddress = (l: DoctorLocation) =>
  [l.address_line, l.city, l.state, l.postal_code].filter(Boolean).join(", ");

export function DoctorLocationCard({ location, primary }: { location: DoctorLocation; primary: boolean }) {
  const embed = isGoogleMapsEmbedUrl(location.map_embed_url) ? location.map_embed_url!.trim() : null;
  return (
    <article className="rounded-xl border border-border bg-background p-5 shadow-[var(--shadow-sm)]">
      <div className={embed ? "grid gap-5 md:grid-cols-2" : ""}>
      <div className="flex min-w-0 flex-col">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
          <MapPin className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-snug">{location.public_name || location.name}</h3>
          {primary ? (
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent">Main hospital</p>
          ) : null}
          {locationAddress(location) ? (
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{locationAddress(location)}</p>
          ) : null}
        </div>
      </div>
      {location.consultation_schedule || location.consultation_availability ? (
        <div className="mt-4 rounded-lg bg-surface/70 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <Clock className="size-3.5" aria-hidden="true" /> Consultation hours
          </p>
          <ConsultationHours location={location} />
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2 pt-0 sm:mt-auto sm:pt-4">
        <Button asChild size="sm">
          <a href="#request-appointment">Book appointment</a>
        </Button>
        {location.map_url ? (
          <Button asChild size="sm" variant="outline">
            <a href={location.map_url} target="_blank" rel="noreferrer">
              <Navigation className="size-4" aria-hidden="true" /> Get directions
            </a>
          </Button>
        ) : null}
        {location.phone ? (
          <Button asChild size="sm" variant="ghost">
            <a href={`tel:${location.phone.replace(/[^+\d]/g, "")}`}>
              <Phone className="size-4" aria-hidden="true" /> Call
            </a>
          </Button>
        ) : null}
      </div>
      </div>
      {embed ? (
        <div className="aspect-video w-full min-w-0 overflow-hidden rounded-lg border border-border bg-surface">
          <iframe
            src={embed}
            title={`Map showing ${location.public_name || location.name}`}
            className="size-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      ) : null}
      </div>
    </article>
  );
}

export function SpecializationCard({
  item,
}: {
  item: { title: string; description: string | null; icon: string | null };
}) {
  return (
    <article className="rounded-xl border border-border bg-background p-4 shadow-[var(--shadow-sm)] sm:p-5">
      <div className="flex min-w-0 items-center gap-3">
        <SpecializationIcon src={item.icon} />
        <h3 className="min-w-0 font-semibold leading-snug">{item.title}</h3>
      </div>
      {item.description ? (
        <p className="mt-2.5 line-clamp-2 text-sm leading-6 text-muted-foreground" title={item.description}>
          {item.description}
        </p>
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
      className="size-9 shrink-0 object-contain"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <Stethoscope className="size-7 shrink-0 text-muted-foreground" aria-hidden="true" />
  );
}

const PREVIEW_ITEMS = 5;

function ServiceOverviewCard({
  service,
  items,
}: {
  service: Service;
  items: { id: string; title: string }[];
}) {
  const [open, setOpen] = useState(false);
  const shown = open ? items : items.slice(0, PREVIEW_ITEMS);
  const listId = `service-items-${service.id}`;
  return (
    <article className="flex flex-col rounded-xl border border-border bg-background p-5 shadow-[var(--shadow-sm)]">
      <h3 className="font-semibold leading-snug">{service.title}</h3>
      {service.summary ? (
        <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">{service.summary}</p>
      ) : null}
      {items.length ? (
        <ul id={listId} className="mt-3 grid gap-1 text-sm">
          {shown.map((item) => (
            <li key={item.id} className="flex gap-2 leading-6">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary/50" aria-hidden="true" />
              {item.title}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-3">
        {items.length > PREVIEW_ITEMS ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={listId}
            className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            {open ? "Show fewer" : `Show all ${items.length} services`}
            <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
        ) : null}
        <Link
          to="/services/professional/$slug"
          params={{ slug: service.slug }}
          className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary"
        >
          View service <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export function ServicesOverview({
  services,
  serviceItems,
}: {
  services: Service[];
  serviceItems: { serviceId: string; id: string; title: string }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <ServiceOverviewCard
          key={service.id}
          service={service}
          items={serviceItems.filter((item) => item.serviceId === service.id)}
        />
      ))}
    </div>
  );
}

/** Reveals the first `initial` children and a toggle for the rest. */
export function ShowMore<T>({
  items,
  initial,
  render,
  label,
  className,
}: {
  items: T[];
  initial: number;
  render: (items: T[]) => ReactNode;
  label: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={className}>
      {render(open ? items : items.slice(0, initial))}
      {items.length > initial ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? "Show fewer" : `${label} (${items.length})`}
        </Button>
      ) : null}
    </div>
  );
}

export function ReviewsPreview({ reviews }: { reviews: Review[] }) {
  const rated = reviews.filter((r) => typeof r.rating === "number" && r.rating > 0);
  const average = rated.length ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length : null;
  return (
    <div className="grid gap-5 lg:grid-cols-[14rem_minmax(0,1fr)]">
      {average ? (
        <div className="h-fit rounded-xl border border-border bg-background p-5 text-center shadow-[var(--shadow-sm)]">
          <p className="text-4xl font-semibold text-primary">{average.toFixed(1)}</p>
          <p className="mt-1 flex justify-center gap-0.5 text-brand-accent" aria-label={`${average.toFixed(1)} out of 5`}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={`size-4 ${i < Math.round(average) ? "fill-current" : ""}`} aria-hidden="true" />
            ))}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            From {rated.length} approved {rated.length === 1 ? "review" : "reviews"}
          </p>
        </div>
      ) : null}
      <ShowMore
        items={reviews}
        initial={3}
        label="Read all reviews"
        className={average ? "" : "lg:col-span-2"}
        render={(list) => (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      />
    </div>
  );
}

export function MediaPreview({ items }: { items: MediaItem[] }) {
  return (
    <ShowMore items={items} initial={3} label="View all media" render={(list) => <MediaGrid items={list} />} />
  );
}

export function ReadMore({ text, limit = 520 }: { text: string; limit?: number }) {
  const [open, setOpen] = useState(false);
  const long = text.length > limit;
  return (
    <div>
      <div
        id="doctor-bio"
        className={`whitespace-pre-line leading-7 text-muted-foreground ${long && !open ? "line-clamp-6" : ""}`}
      >
        {text}
      </div>
      {long ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="doctor-bio"
          className="mt-2 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          {open ? "Show less" : "Read more"}
          <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
