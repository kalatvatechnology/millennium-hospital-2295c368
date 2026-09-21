import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, HeartPulse, ShieldCheck, Stethoscope } from "lucide-react";
import { PublicPage } from "@/components/layout/public-page";
import { Button } from "@/components/ui/button";
import { createPageMeta } from "@/lib/seo";
import { siteConfig } from "@/config/site";

export const Route = createFileRoute("/")({
  head: () => ({ meta: createPageMeta("Home", "Welcome to The Millennium Hospital. Explore care information, hospital services, facilities, and ways to contact the team.") }),
  component: HomePage,
});

function HomePage() {
  return <PublicPage>
    <section className="relative overflow-hidden bg-hero text-primary-foreground">
      <div className="absolute inset-y-0 right-0 hidden w-[42%] border-l border-primary-foreground/10 bg-primary-foreground/5 lg:block" />
      <div className="relative mx-auto grid min-h-[600px] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div><p className="text-sm font-semibold text-highlight">Welcome to {siteConfig.name}</p><h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[1.08] sm:text-6xl">Care that listens. Expertise you can trust.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-primary-foreground/75">Access clear hospital information and find the right path for your care.</p><div className="mt-9 flex flex-wrap gap-3"><Button asChild size="lg" className="bg-highlight text-highlight-foreground hover:bg-highlight/90"><Link to="/services">Explore services <ArrowRight /></Link></Button><Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/contact">Contact the hospital</Link></Button></div></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1"><div className="border border-primary-foreground/15 bg-primary-foreground/8 p-6 backdrop-blur"><HeartPulse className="text-highlight" /><h2 className="mt-5 text-xl font-semibold">Patient-first information</h2><p className="mt-2 text-sm leading-6 text-primary-foreground/70">Clear routes to doctors, services, facilities, and hospital support.</p></div><div className="border border-primary-foreground/15 bg-primary-foreground/8 p-6 backdrop-blur"><ShieldCheck className="text-highlight" /><h2 className="mt-5 text-xl font-semibold">A trusted digital front door</h2><p className="mt-2 text-sm leading-6 text-primary-foreground/70">Designed to make essential information easy to find on any device.</p></div></div>
      </div>
    </section>
    <section className="bg-background"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><div className="max-w-2xl"><p className="text-sm font-semibold text-primary">How can we help?</p><h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Start with what you need</h2></div><div className="mt-10 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">{[{icon:Stethoscope,title:"Find a doctor",text:"Browse the hospital's medical team when profiles are published.",to:"/doctors" as const},{icon:HeartPulse,title:"Explore services",text:"Find care areas and treatment information in one place.",to:"/services" as const},{icon:Building2,title:"View facilities",text:"Learn about the hospital environment and available facilities.",to:"/facilities" as const}].map((item) => <Link key={item.title} to={item.to} className="group bg-background p-7 transition-colors hover:bg-surface"><item.icon className="text-primary" /><h3 className="mt-8 text-xl font-semibold">{item.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p><span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary">Learn more <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span></Link>)}</div></div></section>
    <section className="bg-accent"><div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8"><div><h2 className="text-3xl font-semibold">Need hospital information?</h2><p className="mt-2 text-muted-foreground">The contact page will display verified details as soon as they are published.</p></div><Button asChild size="lg"><Link to="/contact">View contact information <ArrowRight /></Link></Button></div></section>
  </PublicPage>;
}
