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

/*
 * Five artistic layouts over the same card data and the same actions.
 * PDF-safety rules (the PDF traces this DOM): artwork is inline SVG coloured
 * with currentColor, no CSS gradients/transforms, images use uniform radii,
 * and artwork layers come before the content they sit behind.
 */

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent";

/* ------------------------------------------------------------------ shared */

function Photo({ card, className }: { card: DigitalCardData; className: string }) {
  const initials = card.name
    .replace(/^dr\.?\s*/i, "")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return card.photoUrl ? (
    <img src={card.photoUrl} alt={card.photoAlt} className={cn("block object-cover object-top", className)} />
  ) : (
    <div
      role="img"
      aria-label={card.photoAlt}
      className={cn("grid place-items-center bg-dc-stone text-3xl font-semibold text-dc-navy", className)}
    >
      {initials}
    </div>
  );
}

function Art({ className, viewBox, children }: { className: string; viewBox: string; children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={viewBox}
      preserveAspectRatio="none"
      className={cn("pointer-events-none absolute", className)}
    >
      {children}
    </svg>
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
  pdfHref?: string;
}) {
  const cls = cn(
    "inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap px-2.5 text-sm font-semibold transition-colors",
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

type Sec = { key: string; href: string; icon: ReactNode; text: string; label: string; external?: boolean };

function secondaryActions(card: DigitalCardData): Sec[] {
  return [
    card.actions.whatsapp && { key: "wa", href: card.actions.whatsapp, icon: <MessageCircle className="size-4" aria-hidden="true" />, text: "WhatsApp", label: `WhatsApp ${card.name}`, external: true },
    card.actions.call && { key: "call", href: card.actions.call, icon: <Phone className="size-4" aria-hidden="true" />, text: "Call", label: `Call ${card.phone?.display ?? card.name}` },
    card.actions.reviews && { key: "rev", href: card.actions.reviews, icon: <Star className="size-4" aria-hidden="true" />, text: "Reviews", label: "Google Reviews", external: true },
  ].filter(Boolean) as Sec[];
}

const cols = (n: number) => (n === 3 ? "grid-cols-3" : n === 2 ? "grid-cols-2" : "grid-cols-1");

/** Save Contact + Book, the secondary row and the two text links — styled per theme. */
function Actions({
  card,
  primary,
  book,
  secondary,
  link,
  linksAlign = "justify-center",
}: {
  card: DigitalCardData;
  primary: string;
  book: string;
  secondary: string;
  link: string;
  linksAlign?: string;
}) {
  const sec = secondaryActions(card);
  return (
    <div className="relative grid gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Action
          onClick={() => downloadVCard(card)}
          pdfHref={card.actions.saveContact}
          icon={<UserPlus className="size-4" aria-hidden="true" />}
          className={primary}
          label={`Save ${card.name} to contacts`}
        >
          Save Contact
        </Action>
        <Action
          href={card.actions.book}
          icon={<CalendarCheck className="size-4" aria-hidden="true" />}
          className={book}
          label={`Book an appointment with ${card.name}`}
        >
          Book
        </Action>
      </div>
      {sec.length ? (
        <div className={cn("grid gap-2", cols(sec.length))}>
          {sec.map((a) => (
            <Action key={a.key} href={a.href} icon={a.icon} className={secondary} label={a.label} external={Boolean(a.external)}>
              {a.text}
            </Action>
          ))}
        </div>
      ) : null}
      <div className={cn("flex flex-wrap gap-x-5 gap-y-1 pt-1", linksAlign)}>
        {card.actions.directions ? (
          <a
            href={card.actions.directions}
            target="_blank"
            rel="noreferrer"
            className={cn("inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline", link, focus)}
          >
            <Navigation className="size-4" aria-hidden="true" /> Get Directions
          </a>
        ) : null}
        <a
          href={card.actions.profile}
          target="_blank"
          rel="noreferrer"
          className={cn("inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline", link, focus)}
        >
          <ExternalLink className="size-4" aria-hidden="true" /> View Full Profile
        </a>
      </div>
    </div>
  );
}

function Location({
  card,
  className,
  icon,
  title,
}: {
  card: DigitalCardData;
  className: string;
  icon: string;
  title?: string;
}) {
  if (!card.location) return null;
  return (
    <section aria-label="Consultation location" className={cn("relative text-sm", className)}>
      {title ? <h4 className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] opacity-70">{title}</h4> : null}
      <p className="flex items-start gap-2 font-semibold">
        <MapPin className={cn("mt-0.5 size-4 shrink-0", icon)} aria-hidden="true" />
        <span>
          {card.location.name}
          {card.location.address ? <span className="block text-xs font-normal opacity-75">{card.location.address}</span> : null}
        </span>
      </p>
      {card.location.hours.length ? (
        <div className="mt-2 flex items-start gap-2 text-xs">
          <Clock className={cn("mt-0.5 size-4 shrink-0", icon)} aria-hidden="true" />
          <ul className="grid gap-0.5">
            {card.location.hours.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function Credentials({ card, muted }: { card: DigitalCardData; muted: string }) {
  return (
    <>
      {card.designation ? <p className="mt-3 text-sm font-semibold">{card.designation}</p> : null}
      {card.specialization ? <p className={cn("text-sm", muted)}>{card.specialization}</p> : null}
    </>
  );
}

const Shell = ({ card, className, children }: { card: DigitalCardData; className: string; children: ReactNode }) => (
  <article
    aria-label={`Digital card for ${card.name}`}
    className={cn("relative mx-auto w-full max-w-[400px] overflow-hidden rounded-3xl shadow-[var(--shadow-lg)]", className)}
  >
    {children}
  </article>
);

/* ---------------------------------------------------- 1 Millennium Signature */

function Signature({ card }: { card: DigitalCardData }) {
  return (
    <Shell card={card} className="bg-dc-paper text-dc-ink">
      <div className="relative h-52 bg-dc-navy">
        {/* flowing smile curves */}
        <Art className="inset-0 size-full text-dc-paper" viewBox="0 0 400 208">
          <path d="M-20 60 C 90 130, 250 130, 420 40" fill="none" stroke="currentColor" strokeOpacity=".14" strokeWidth="1.5" />
          <path d="M-20 88 C 100 156, 260 150, 420 70" fill="none" stroke="currentColor" strokeOpacity=".1" strokeWidth="1.5" />
          <path d="M-20 116 C 110 180, 270 172, 420 100" fill="none" stroke="currentColor" strokeOpacity=".07" strokeWidth="1.5" />
          <circle cx="352" cy="34" r="70" fill="currentColor" fillOpacity=".05" />
          <circle cx="352" cy="34" r="42" fill="none" stroke="currentColor" strokeOpacity=".12" />
        </Art>
        <Art className="inset-x-0 bottom-0 h-20 w-full text-dc-red" viewBox="0 0 400 80">
          <path d="M0 58 C 120 20, 280 20, 400 50 L400 80 L0 80 Z" fill="currentColor" />
        </Art>
        <Art className="inset-x-0 -bottom-px h-20 w-full text-dc-paper" viewBox="0 0 400 80">
          <path d="M0 66 C 120 30, 280 30, 400 60 L400 80 L0 80 Z" fill="currentColor" />
        </Art>
        <div className="relative flex items-start justify-between px-6 pt-5">
          <div className="rounded-lg bg-dc-paper px-3 py-2 shadow-[var(--shadow-sm)]">
            <MillenniumLogo className="h-9 w-auto" />
          </div>
          <p className="pt-2 text-[10px] font-bold uppercase tracking-[.22em] text-dc-paper/80">Doctor Profile</p>
        </div>
      </div>
      <div className="relative -mt-20 flex justify-center">
        <div className="rounded-full bg-dc-paper p-1.5 shadow-[var(--shadow-md)]">
          <div className="rounded-full bg-dc-red p-[3px]">
            <Photo card={card} className="size-32 rounded-full bg-dc-stone" />
          </div>
        </div>
      </div>
      <div className="relative grid gap-5 px-6 pb-4 pt-3">
        <div className="text-center">
          <h3 className="font-heading text-2xl font-semibold leading-tight text-dc-navy">{card.name}</h3>
          {card.qualifications ? <p className="mt-1 text-sm font-semibold text-dc-ink/70">{card.qualifications}</p> : null}
          <div aria-hidden="true" className="mt-3 flex items-center justify-center gap-1.5">
            <span className="block h-0.5 w-8 rounded-full bg-dc-red" />
            <span className="block size-1.5 rounded-full bg-dc-red" />
            <span className="block h-0.5 w-8 rounded-full bg-dc-red" />
          </div>
          <Credentials card={card} muted="text-dc-ink/65" />
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[.16em] text-dc-red">{hospitalName}</p>
        </div>
        {card.services.length ? (
          <section aria-label="Key services" className="text-center">
            <h4 className="text-[11px] font-bold uppercase tracking-[.18em] text-dc-navy">Key services</h4>
            <ul className="mt-2 flex flex-wrap justify-center gap-1.5">
              {card.services.map((s) => (
                <li key={s} className="rounded-full border border-dc-navy/15 bg-dc-sky px-3 py-1 text-xs font-semibold text-dc-navy">
                  {s}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <Location card={card} icon="text-dc-red" className="rounded-2xl border-l-4 border-dc-red bg-dc-sky p-3.5 text-dc-ink" />
        <Actions
          card={card}
          primary="rounded-full bg-dc-navy text-dc-paper hover:bg-dc-navy/90"
          book="rounded-full bg-dc-red text-dc-paper hover:bg-dc-red/90"
          secondary="rounded-full border border-dc-navy/20 text-dc-navy hover:bg-dc-sky"
          link="text-dc-navy"
        />
      </div>
      <div className="relative h-3 bg-dc-navy">
        <span aria-hidden="true" className="absolute inset-y-0 left-0 block w-1/3 bg-dc-red" />
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------ 2 Radiant Care */

function Radiant({ card }: { card: DigitalCardData }) {
  return (
    <Shell card={card} className="bg-dc-ivory text-dc-navy">
      {/* sunrise arcs and layered paper forms */}
      <Art className="right-0 top-0 h-72 w-72 text-dc-blush" viewBox="0 0 288 288">
        <circle cx="210" cy="96" r="160" fill="currentColor" fillOpacity=".55" />
      </Art>
      <Art className="right-0 top-0 h-72 w-72 text-dc-coral" viewBox="0 0 288 288">
        <circle cx="210" cy="96" r="120" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth="1.2" />
        <circle cx="210" cy="96" r="136" fill="none" stroke="currentColor" strokeOpacity=".22" strokeWidth="1.2" />
        <circle cx="210" cy="96" r="152" fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="1.2" />
      </Art>
      <Art className="bottom-0 left-0 h-56 w-full text-dc-cream" viewBox="0 0 400 224">
        <path d="M0 90 C 120 40, 230 150, 400 110 L400 224 L0 224 Z" fill="currentColor" />
      </Art>
      <Art className="bottom-0 left-0 h-40 w-full text-dc-blush" viewBox="0 0 400 160">
        <path d="M0 110 C 140 60, 250 150, 400 90 L400 160 L0 160 Z" fill="currentColor" fillOpacity=".6" />
      </Art>

      <div className="relative px-6 pt-6">
        <div className="inline-block rounded-2xl bg-dc-paper px-3 py-2 shadow-[var(--shadow-sm)]">
          <MillenniumLogo className="h-9 w-auto" />
        </div>
      </div>
      <div className="relative mt-4 flex justify-end pr-6">
        <div className="rounded-full bg-dc-paper p-2 shadow-[var(--shadow-md)]">
          <Photo card={card} className="size-40 rounded-full bg-dc-cream" />
        </div>
      </div>
      <div className="relative grid gap-5 px-6 pb-6 pt-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.2em] text-dc-red">Your doctor</p>
          <h3 className="mt-1 font-heading text-[28px] font-semibold leading-[1.1]">{card.name}</h3>
          {card.qualifications ? <p className="mt-1 text-sm font-semibold text-dc-navy/70">{card.qualifications}</p> : null}
          <span aria-hidden="true" className="mt-3 block h-1 w-14 rounded-full bg-dc-coral" />
          <Credentials card={card} muted="text-dc-navy/70" />
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[.14em] text-dc-navy/60">{hospitalName}</p>
        </div>
        {card.services.length ? (
          <section aria-label="Key services">
            <h4 className="text-[11px] font-bold uppercase tracking-[.18em] text-dc-red">Key services</h4>
            <ol className="mt-2 grid">
              {card.services.map((s, i) => (
                <li key={s} className="flex items-baseline gap-3 border-b border-dc-coral/30 py-1.5 text-sm font-medium last:border-b-0">
                  <span className="w-6 shrink-0 text-xs font-bold text-dc-coral">{String(i + 1).padStart(2, "0")}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        <Location card={card} icon="text-dc-red" className="rounded-3xl bg-dc-paper/85 p-4 text-dc-navy shadow-[var(--shadow-sm)]" />
        <Actions
          card={card}
          primary="rounded-full bg-dc-navy text-dc-paper hover:bg-dc-navy/90"
          book="rounded-full bg-dc-red text-dc-paper hover:bg-dc-red/90"
          secondary="rounded-full border border-dc-coral/50 bg-dc-paper/80 text-dc-navy hover:bg-dc-paper"
          link="text-dc-navy"
        />
      </div>
    </Shell>
  );
}

/* --------------------------------------------------------- 3 Executive Focus */

function Executive({ card }: { card: DigitalCardData }) {
  return (
    <Shell card={card} className="rounded-2xl bg-dc-midnight text-dc-paper">
      <div className="relative h-80 bg-dc-midnight">
        <Photo card={card} className="h-80 w-full bg-dc-charcoal text-6xl text-dc-gold" />
        {/* architectural diagonal panels over the portrait */}
        <div aria-hidden="true" className="absolute inset-0 bg-dc-navy/55 [clip-path:polygon(0_62%,100%_40%,100%_100%,0_100%)]" />
        <div aria-hidden="true" className="absolute inset-0 bg-dc-midnight [clip-path:polygon(0_80%,100%_60%,100%_100%,0_100%)]" />
        <Art className="inset-0 size-full text-dc-gold" viewBox="0 0 400 320">
          <path d="M0 250 L400 186" stroke="currentColor" strokeWidth="1.5" />
          <path d="M250 0 L400 0 L400 120 Z" fill="currentColor" fillOpacity=".12" />
          <path d="M300 0 L400 70" stroke="currentColor" strokeOpacity=".5" />
        </Art>
        <div className="absolute left-5 top-5 rounded-sm bg-dc-paper px-3 py-2">
          <MillenniumLogo className="h-8 w-auto" />
        </div>
      </div>
      <div className="relative grid gap-5 px-6 pb-6 pt-1">
        <div>
          <h3 className="font-heading text-2xl font-bold uppercase leading-tight tracking-wide">{card.name}</h3>
          {card.qualifications ? <p className="mt-1 text-sm font-semibold text-dc-gold">{card.qualifications}</p> : null}
          <span aria-hidden="true" className="mt-3 block h-0.5 w-16 bg-dc-gold" />
          <Credentials card={card} muted="text-dc-paper/70" />
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[.2em] text-dc-paper/55">{hospitalName}</p>
        </div>
        {card.services.length ? (
          <section aria-label="Key services">
            <h4 className="text-[11px] font-bold uppercase tracking-[.22em] text-dc-gold">Key services</h4>
            <ul className="mt-2 grid gap-1">
              {card.services.map((s) => (
                <li key={s} className="flex items-center gap-3 border-l-2 border-dc-gold bg-dc-charcoal px-3 py-1.5 text-sm font-medium">
                  {s}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <Location card={card} icon="text-dc-gold" className="border-t-2 border-dc-gold bg-dc-charcoal p-4 text-dc-paper" />
        <Actions
          card={card}
          primary="rounded-sm border border-dc-paper/60 text-dc-paper hover:bg-dc-paper/10"
          book="rounded-sm bg-dc-gold text-dc-gold-foreground hover:bg-dc-gold/90"
          secondary="rounded-sm bg-dc-charcoal text-dc-paper hover:bg-dc-navy"
          link="text-dc-gold"
          linksAlign="justify-start"
        />
      </div>
    </Shell>
  );
}

/* -------------------------------------------------------- 4 Oral Health Plus */

function OralHealth({ card }: { card: DigitalCardData }) {
  return (
    <Shell card={card} className="bg-dc-paper text-dc-navy">
      <div className="relative h-60 bg-dc-sky">
        {/* translucent organic forms, smile line and a tooth contour */}
        <Art className="inset-0 size-full text-dc-aqua" viewBox="0 0 400 240">
          <ellipse cx="90" cy="150" rx="150" ry="110" fill="currentColor" fillOpacity=".45" />
          <ellipse cx="330" cy="40" rx="120" ry="90" fill="currentColor" fillOpacity=".25" />
        </Art>
        <Art className="inset-0 size-full text-dc-mint" viewBox="0 0 400 240">
          <ellipse cx="170" cy="200" rx="170" ry="80" fill="currentColor" fillOpacity=".7" />
          <path d="M300 170 C 330 120, 380 120, 400 150 L400 240 L260 240 Z" fill="currentColor" fillOpacity=".55" />
        </Art>
        <Art className="inset-0 size-full text-dc-teal" viewBox="0 0 400 240">
          <path d="M228 150 C 270 190, 340 190, 380 150" fill="none" stroke="currentColor" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" />
          <path d="M318 64 c -10 -12 -32 -10 -34 8 c -2 16 6 30 8 48 c 2 10 10 10 12 0 l 4 -18 l 4 18 c 2 10 10 10 12 0 c 2 -18 10 -32 8 -48 c -2 -18 -24 -20 -34 -8 z" fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth="1.2" />
        </Art>
        <Art className="inset-x-0 -bottom-px h-14 w-full text-dc-paper" viewBox="0 0 400 56">
          <path d="M0 40 C 110 10, 260 60, 400 24 L400 56 L0 56 Z" fill="currentColor" />
        </Art>
        <div className="absolute right-5 top-5 rounded-xl bg-dc-paper/90 px-3 py-2 shadow-[var(--shadow-sm)]">
          <MillenniumLogo className="h-8 w-auto" />
        </div>
        <div className="absolute bottom-6 left-6 rounded-[2.75rem] bg-dc-paper/70 p-2">
          <Photo card={card} className="size-40 rounded-[2.5rem] bg-dc-mint" />
        </div>
      </div>
      <div className="relative grid gap-5 px-6 pb-6 pt-2">
        <div>
          <h3 className="font-heading text-2xl font-semibold leading-tight">{card.name}</h3>
          {card.qualifications ? <p className="mt-1 text-sm font-semibold text-dc-teal">{card.qualifications}</p> : null}
          <div aria-hidden="true" className="mt-3 flex gap-1">
            <span className="block h-1 w-8 rounded-full bg-dc-teal" />
            <span className="block h-1 w-3 rounded-full bg-dc-aqua" />
            <span className="block h-1 w-2 rounded-full bg-dc-red" />
          </div>
          <Credentials card={card} muted="text-dc-navy/65" />
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[.16em] text-dc-navy/60">{hospitalName}</p>
        </div>
        {card.services.length ? (
          <section aria-label="Key services">
            <h4 className="text-[11px] font-bold uppercase tracking-[.18em] text-dc-teal">Key services</h4>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {card.services.map((s) => (
                <li key={s} className="flex items-center gap-1.5 rounded-full bg-dc-sky px-3 py-1 text-xs font-semibold text-dc-navy">
                  <span aria-hidden="true" className="block size-1.5 rounded-full bg-dc-teal" />
                  {s}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <Location card={card} icon="text-dc-teal" className="rounded-2xl border border-dc-aqua/60 bg-dc-sky/70 p-4 text-dc-navy" />
        <Actions
          card={card}
          primary="rounded-xl bg-dc-navy text-dc-paper hover:bg-dc-navy/90"
          book="rounded-xl bg-dc-teal text-dc-paper hover:bg-dc-teal/90"
          secondary="rounded-xl border border-dc-aqua text-dc-navy hover:bg-dc-sky"
          link="text-dc-teal"
        />
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------- 5 Minimal Luxe */

function Luxe({ card }: { card: DigitalCardData }) {
  return (
    <Shell card={card} className="rounded-none bg-dc-ivory text-dc-ink">
      <div className="relative flex items-center gap-3 px-7 pt-6">
        <MillenniumLogo className="h-8 w-auto" />
        <span aria-hidden="true" className="block h-px flex-1 bg-dc-ink/20" />
      </div>
      <div className="relative mx-7 mt-5">
        <div aria-hidden="true" className="absolute -right-3 top-6 h-[85%] w-[70%] bg-dc-stone" />
        <Photo card={card} className="relative aspect-[4/4.6] w-full bg-dc-stone" />
        <span aria-hidden="true" className="absolute -bottom-2 left-0 block size-4 bg-dc-red" />
      </div>
      <div className="relative grid gap-6 px-7 pb-7 pt-8">
        <div>
          <h3 className="font-heading text-[32px] font-medium leading-[1.05] tracking-tight text-dc-navy">{card.name}</h3>
          {card.qualifications ? <p className="mt-2 text-xs font-semibold uppercase tracking-[.2em] text-dc-ink/60">{card.qualifications}</p> : null}
          <Credentials card={card} muted="text-dc-ink/60" />
          <p className="mt-1 text-[11px] uppercase tracking-[.2em] text-dc-ink/50">{hospitalName}</p>
        </div>
        {card.services.length ? (
          <section aria-label="Key services">
            <h4 className="text-[10px] font-semibold uppercase tracking-[.24em] text-dc-ink/50">Key services</h4>
            <ul className="mt-2 grid">
              {card.services.map((s, i) => (
                <li key={s} className="flex items-baseline justify-between gap-3 border-t border-dc-ink/15 py-2 text-sm">
                  <span>{s}</span>
                  <span className="text-[10px] font-semibold text-dc-red">{String(i + 1).padStart(2, "0")}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <Location card={card} icon="text-dc-red" title="Consultation" className="border-t border-dc-ink/15 pt-3 text-dc-ink" />
        <Actions
          card={card}
          primary="rounded-none bg-dc-navy text-dc-paper hover:bg-dc-navy/90"
          book="rounded-none border border-dc-navy text-dc-navy hover:bg-dc-stone"
          secondary="rounded-none border border-dc-ink/20 text-dc-ink hover:bg-dc-stone"
          link="text-dc-navy"
          linksAlign="justify-between"
        />
      </div>
    </Shell>
  );
}

const LAYOUTS: Record<DigitalCardTheme, (p: { card: DigitalCardData }) => ReactNode> = {
  millennium_signature: Signature,
  clinical_elegance: Radiant,
  modern_executive: Executive,
  premium_medical: OralHealth,
  minimal_luxe: Luxe,
};

export function DigitalDoctorCard({ card, theme }: { card: DigitalCardData; theme: DigitalCardTheme }) {
  const Layout = LAYOUTS[theme];
  return <Layout card={card} />;
}
