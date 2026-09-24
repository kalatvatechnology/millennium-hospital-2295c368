import type { ReactNode } from "react";
import {
  CalendarCheck,
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Star,
  UserPlus,
} from "lucide-react";
import { MillenniumLogo } from "@/components/shared/millennium-logo";
import { cn } from "@/lib/utils";
import { hospitalName, type DigitalCardData } from "@/lib/digital-card/data";
import { downloadVCard } from "@/lib/digital-card/vcard";
import type { DigitalCardTheme } from "@/lib/digital-card/themes";

type Variant = {
  root: string;
  header: string;
  logoPlate: string;
  photo: string;
  photoWrap: string;
  name: string;
  meta: string;
  accentRule: string;
  label: string;
  chip: string;
  body: string;
  primary: string;
  secondary: string;
  support: string;
  panel: string;
};

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent";

/** Theme variants only change presentation; content and actions are shared. */
const VARIANTS: Record<DigitalCardTheme, Variant> = {
  millennium_signature: {
    root: "bg-background text-foreground border border-border",
    header: "bg-primary pb-16 pt-5",
    logoPlate: "bg-background rounded-md px-3 py-1.5",
    photoWrap: "-mt-14 flex justify-center",
    photo: "size-28 rounded-full ring-4 ring-background",
    name: "text-center text-primary",
    meta: "text-center",
    accentRule: "mx-auto bg-brand-accent",
    label: "text-brand-accent",
    chip: "bg-accent text-accent-foreground rounded-full",
    body: "",
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-accent text-accent-foreground hover:bg-accent/70",
    support: "text-primary",
    panel: "bg-surface/70",
  },
  clinical_elegance: {
    root: "bg-background text-foreground border border-border",
    header: "pt-6 pb-2",
    logoPlate: "",
    photoWrap: "mt-4 flex justify-start px-6",
    photo: "h-32 w-28 rounded-xl",
    name: "text-left text-primary",
    meta: "text-left",
    accentRule: "bg-brand-accent",
    label: "text-primary",
    chip: "border border-border text-primary rounded-md",
    body: "",
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "border border-primary/30 text-primary hover:bg-accent",
    support: "text-primary",
    panel: "border-l-2 border-brand-accent pl-3",
  },
  modern_executive: {
    root: "bg-surface text-foreground",
    header: "bg-primary pt-5 pb-5 [clip-path:polygon(0_0,100%_0,100%_85%,0_100%)]",
    logoPlate: "bg-background rounded-sm px-3 py-1.5",
    photoWrap: "-mt-2 flex justify-start px-6",
    photo: "size-28 rounded-sm border-4 border-background",
    name: "text-left text-primary uppercase tracking-wide",
    meta: "text-left",
    accentRule: "bg-brand-accent h-1 w-12",
    label: "text-foreground uppercase tracking-[.18em]",
    chip: "bg-background text-primary rounded-sm border-l-2 border-brand-accent",
    body: "",
    primary: "bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90 rounded-sm",
    secondary: "bg-background text-primary hover:bg-accent rounded-sm",
    support: "text-primary",
    panel: "bg-background rounded-sm",
  },
  premium_medical: {
    root: "bg-primary text-primary-foreground",
    header: "pt-6 pb-2",
    logoPlate: "bg-background rounded-md px-3 py-1.5",
    photoWrap: "mt-5 flex justify-center",
    photo: "size-32 rounded-full ring-2 ring-brand-accent ring-offset-4 ring-offset-primary",
    name: "text-center text-primary-foreground",
    meta: "text-center text-primary-foreground/80",
    accentRule: "mx-auto bg-brand-accent",
    label: "text-primary-foreground/70",
    chip: "bg-primary-foreground/10 text-primary-foreground rounded-full",
    body: "text-primary-foreground/85",
    primary: "bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90",
    secondary: "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20",
    support: "text-primary-foreground",
    panel: "bg-primary-foreground/5",
  },
  minimal_luxe: {
    root: "bg-background text-foreground border border-border",
    header: "hidden",
    logoPlate: "",
    photoWrap: "",
    photo: "aspect-[4/3.4] w-full",
    name: "text-left text-foreground font-medium",
    meta: "text-left",
    accentRule: "bg-brand-accent w-6",
    label: "text-muted-foreground",
    chip: "text-foreground border-b border-border rounded-none px-0",
    body: "",
    primary: "bg-foreground text-background hover:bg-foreground/90",
    secondary: "border border-border text-foreground hover:bg-surface",
    support: "text-foreground",
    panel: "",
  },
};

function Photo({ card, className }: { card: DigitalCardData; className: string }) {
  const initials = card.name
    .replace(/^dr\.?\s*/i, "")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return card.photoUrl ? (
    <img src={card.photoUrl} alt={card.photoAlt} className={cn("object-cover object-top bg-surface", className)} />
  ) : (
    <div
      role="img"
      aria-label={card.photoAlt}
      className={cn("grid place-items-center bg-accent text-2xl font-semibold text-accent-foreground", className)}
    >
      {initials}
    </div>
  );
}

function Action({
  href,
  onClick,
  icon,
  children,
  className,
  label,
  external,
  pdfHref,
}: {
  href?: string;
  onClick?: () => void;
  icon: ReactNode;
  children: ReactNode;
  className: string;
  label: string;
  external?: boolean;
  /** Link used by the PDF renderer when the on-screen control is a button. */
  pdfHref?: string;
}) {
  const cls = cn(
    "inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-sm font-semibold transition-colors",
    focus,
    className,
  );
  return href ? (
    <a href={href} aria-label={label} className={cls} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
      {icon}
      {children}
    </a>
  ) : (
    <button type="button" onClick={onClick} aria-label={label} className={cls} data-pdf-href={pdfHref}>
      {icon}
      {children}
    </button>
  );
}

export function DigitalDoctorCard({ card, theme }: { card: DigitalCardData; theme: DigitalCardTheme }) {
  const v = VARIANTS[theme];
  const luxe = theme === "minimal_luxe";
  const secondary = [
    card.actions.whatsapp && { key: "wa", href: card.actions.whatsapp, icon: <MessageCircle className="size-4" aria-hidden="true" />, text: "WhatsApp", label: `WhatsApp ${card.name}`, external: true },
    card.actions.call && { key: "call", href: card.actions.call, icon: <Phone className="size-4" aria-hidden="true" />, text: "Call", label: `Call ${card.phone?.display ?? card.name}` },
    card.actions.reviews && { key: "rev", href: card.actions.reviews, icon: <Star className="size-4" aria-hidden="true" />, text: "Reviews", label: "Google Reviews", external: true },
  ].filter(Boolean) as { key: string; href: string; icon: ReactNode; text: string; label: string; external?: boolean }[];

  return (
    <article
      aria-label={`Digital card for ${card.name}`}
      className={cn("mx-auto w-full max-w-[400px] overflow-hidden rounded-2xl shadow-[var(--shadow-md)]", v.root)}
    >
      {luxe ? (
        <div className="relative">
          <Photo card={card} className={v.photo} />
          <div className="absolute left-4 top-4 rounded-md bg-background/95 px-2.5 py-1">
            <MillenniumLogo className="h-7 w-auto" />
          </div>
        </div>
      ) : (
        <>
          <header className={cn("px-6", v.header)}>
            <div className={cn("inline-block", v.logoPlate)}>
              <MillenniumLogo className="h-8 w-auto" />
            </div>
          </header>
          <div className={v.photoWrap}>
            <Photo card={card} className={v.photo} />
          </div>
        </>
      )}

      <div className={cn("grid gap-5 px-6 pb-6 pt-4", v.body)}>
        <div className={v.meta}>
          <h3 className={cn("text-2xl font-semibold leading-tight", v.name)}>{card.name}</h3>
          {card.qualifications ? <p className="mt-1 text-sm font-semibold opacity-80">{card.qualifications}</p> : null}
          <span aria-hidden="true" className={cn("mt-3 block h-0.5 w-10 rounded-full", v.accentRule)} />
          {card.designation ? <p className="mt-3 text-sm font-medium">{card.designation}</p> : null}
          {card.specialization ? (
            <p className={cn("text-sm", theme === "premium_medical" ? "text-primary-foreground/75" : "text-muted-foreground")}>
              {card.specialization}
            </p>
          ) : null}
          <p className={cn("mt-1 text-xs font-semibold uppercase tracking-wider", v.label)}>{hospitalName}</p>
        </div>

        {card.services.length ? (
          <section aria-label="Key services">
            <h4 className={cn("text-[11px] font-bold uppercase tracking-[.16em]", v.label)}>Key services</h4>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {card.services.map((s) => (
                <li key={s} className={cn("px-2.5 py-1 text-xs font-medium", v.chip)}>
                  {s}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {card.location ? (
          <section aria-label="Consultation location" className={cn("rounded-lg p-3 text-sm", v.panel)}>
            <p className="flex items-start gap-2 font-semibold">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-accent" aria-hidden="true" />
              <span>
                {card.location.name}
                {card.location.address ? (
                  <span className="block text-xs font-normal opacity-75">{card.location.address}</span>
                ) : null}
              </span>
            </p>
            {card.location.hours.length ? (
              <div className="mt-2 flex items-start gap-2 text-xs">
                <Clock className="mt-0.5 size-4 shrink-0 text-brand-accent" aria-hidden="true" />
                <ul className="grid gap-0.5">
                  {card.location.hours.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="grid gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Action
              onClick={() => downloadVCard(card)}
              icon={<UserPlus className="size-4" aria-hidden="true" />}
              className={v.primary}
              label={`Save ${card.name} to contacts`}
            >
              Save Contact
            </Action>
            <Action
              href={card.actions.book}
              icon={<CalendarCheck className="size-4" aria-hidden="true" />}
              className={v.primary}
              label={`Book an appointment with ${card.name}`}
            >
              Book
            </Action>
          </div>
          {secondary.length ? (
            <div className={cn("grid gap-2", secondary.length === 3 ? "grid-cols-3" : secondary.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
              {secondary.map((a) => (
                <Action key={a.key} href={a.href} icon={a.icon} className={v.secondary} label={a.label} external={Boolean(a.external)}>
                  {a.text}
                </Action>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 pt-1">
            {card.actions.directions ? (
              <a
                href={card.actions.directions}
                target="_blank"
                rel="noreferrer"
                className={cn("inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline", v.support, focus)}
              >
                <Navigation className="size-4" aria-hidden="true" /> Get Directions
              </a>
            ) : null}
            <a
              href={card.actions.profile}
              target="_blank"
              rel="noreferrer"
              className={cn("inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline", v.support, focus)}
            >
              <ExternalLink className="size-4" aria-hidden="true" /> View Full Profile
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
