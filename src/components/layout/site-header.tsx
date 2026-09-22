import { Link } from "@tanstack/react-router";
import { CalendarDays, Menu, Phone, Search, X } from "lucide-react";
import { useState } from "react";
import { siteConfig, primaryNavigation } from "@/config/site";
import { Button } from "@/components/ui/button";
import { MillenniumLogo } from "@/components/shared/millennium-logo";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 shadow-[var(--shadow-sm)] backdrop-blur-md">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-background focus:px-4 focus:py-2">Skip to content</a>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 shrink-0 items-center" aria-label={`${siteConfig.name} home`}>
          <MillenniumLogo variant="responsive" priority className="h-12 w-12 sm:h-auto sm:w-56 lg:w-60" />
        </Link>
        <nav aria-label="Primary navigation" className="hidden items-center gap-1 lg:flex">
          {primaryNavigation.map((item) => (
            <Link key={item.to} to={item.to} className="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-primary" activeProps={{ className: "bg-secondary text-primary" }}>{item.label}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {siteConfig.contact.phone ? <Button asChild variant="outline"><a href={`tel:${siteConfig.contact.phone}`}><Phone />Call</a></Button> : null}
          <Button asChild className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"><Link to="/contact"><CalendarDays />Request appointment</Link></Button>
        </div>
        <div className="ml-auto flex items-center gap-1 lg:hidden">
          <Button asChild variant="ghost" size="icon"><Link to="/doctors" aria-label="Search doctors"><Search /></Link></Button>
          <Button variant="ghost" size="icon" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Close menu" : "Open menu"}>{open ? <X /> : <Menu />}</Button>
        </div>
      </div>
      {open ? (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="border-t border-border bg-background px-4 py-4 lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-1">
            {primaryNavigation.map((item) => <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 font-medium text-foreground" activeProps={{ className: "bg-accent" }}>{item.label}</Link>)}
             <Link to="/contact" onClick={() => setOpen(false)} className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-md bg-brand-accent px-4 py-3 text-center font-semibold text-brand-accent-foreground"><CalendarDays className="size-4" />Request appointment</Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
