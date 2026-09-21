import { Link } from "@tanstack/react-router";
import { Menu, Phone, X } from "lucide-react";
import { useState } from "react";
import { siteConfig, primaryNavigation } from "@/config/site";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-background focus:px-4 focus:py-2">Skip to content</a>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3" aria-label={`${siteConfig.name} home`}>
          <span className="grid size-11 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">TMH</span>
          <span className="max-w-48 text-base font-semibold leading-tight text-foreground sm:text-lg">{siteConfig.name}</span>
        </Link>
        <nav aria-label="Primary navigation" className="hidden items-center gap-1 lg:flex">
          {primaryNavigation.map((item) => (
            <Link key={item.to} to={item.to} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" activeProps={{ className: "bg-accent text-foreground" }}>{item.label}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {siteConfig.contact.phone ? <Button asChild variant="outline"><a href={`tel:${siteConfig.contact.phone}`}><Phone />Call</a></Button> : null}
          <Button asChild><Link to="/contact">Contact us</Link></Button>
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Close menu" : "Open menu"}>{open ? <X /> : <Menu />}</Button>
      </div>
      {open ? (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="border-t border-border bg-background px-4 py-4 lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-1">
            {primaryNavigation.map((item) => <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 font-medium text-foreground" activeProps={{ className: "bg-accent" }}>{item.label}</Link>)}
            <Link to="/contact" onClick={() => setOpen(false)} className="mt-2 rounded-md bg-primary px-4 py-3 text-center font-medium text-primary-foreground">Contact us</Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
