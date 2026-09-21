import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"><Plus className="size-6" /></span><span className="font-heading font-semibold">{siteConfig.name}</span></div><p className="mt-4 max-w-sm text-sm leading-6 text-sidebar-foreground/70">{siteConfig.description}</p></div>
        <div><h2 className="text-sm font-semibold">Explore</h2><div className="mt-4 grid gap-3 text-sm text-sidebar-foreground/70"><Link to="/about">About</Link><Link to="/doctors">Doctors</Link><Link to="/services">Services</Link><Link to="/facilities">Facilities</Link></div></div>
        <div><h2 className="text-sm font-semibold">Information</h2><div className="mt-4 grid gap-3 text-sm text-sidebar-foreground/70"><Link to="/faq">Frequently asked questions</Link><Link to="/contact">Contact</Link><Link to="/privacy-policy">Privacy policy</Link><Link to="/terms-and-conditions">Terms & conditions</Link></div></div>
      </div>
      <div className="border-t border-sidebar-border"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-sidebar-foreground/60 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8"><p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p><p>For medical emergencies, contact your local emergency service.</p></div></div>
    </footer>
  );
}
