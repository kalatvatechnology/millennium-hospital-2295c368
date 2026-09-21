import type { ReactNode } from "react";
import { Activity, ArrowRight, FileText, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function PageIntro({ eyebrow, title, description }: { eyebrow?: string; title: string; description: string }) {
  return <section className="border-b border-border bg-surface"><div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">{eyebrow ? <p className="mb-3 text-sm font-semibold text-primary">{eyebrow}</p> : null}<h1 className="max-w-3xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl">{title}</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{description}</p></div></section>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="mx-auto max-w-2xl py-16 text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-accent text-primary"><Search /></span><h2 className="mt-5 text-2xl font-semibold">{title}</h2><p className="mx-auto mt-3 max-w-lg text-muted-foreground">{description}</p>{action ? <div className="mt-6">{action}</div> : null}</div>;
}

export function LoadingState() { return <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground" role="status"><Activity className="animate-pulse" /><span>Loading information…</span></div>; }
export function ErrorState() { return <div className="py-16 text-center" role="alert"><FileText className="mx-auto text-destructive" /><h2 className="mt-4 text-xl font-semibold">Information unavailable</h2><p className="mt-2 text-muted-foreground">Please try again later.</p></div>; }

export function ContentSection({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return <section className={muted ? "bg-surface" : "bg-background"}><div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">{children}</div></section>;
}

export function SectionHeading({ eyebrow, title, description, link }: { eyebrow: string; title: string; description: string; link?: { label: string; to: "/about" | "/blog" | "/contact" | "/doctors" | "/facilities" | "/faq" | "/reviews" | "/services" } }) {
  return <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-2xl"><p className="text-sm font-semibold text-primary">{eyebrow}</p><h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{title}</h2><p className="mt-4 leading-7 text-muted-foreground">{description}</p></div>{link ? <Link to={link.to} className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary">{link.label}<ArrowRight className="size-4" /></Link> : null}</div>;
}

export function UnpublishedPanel({ title, description }: { title: string; description: string }) {
  return <div className="mt-8 border border-dashed border-border bg-background p-6"><p className="font-semibold">{title}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div>;
}
