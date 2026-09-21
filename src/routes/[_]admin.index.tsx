import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageMeta } from "@/lib/seo";
import { siteConfig } from "@/config/site";
export const Route = createFileRoute("/_admin/")({ head: () => ({ meta: [...createPageMeta("Administration", "Administration access for The Millennium Hospital."), { name: "robots", content: "noindex, nofollow" }] }), component: AdminEntry });
function AdminEntry(){return <main className="grid min-h-screen place-items-center bg-admin px-4 py-12"><div className="w-full max-w-md border border-border bg-background p-8 shadow-lg"><span className="grid size-12 place-items-center rounded-md bg-primary text-primary-foreground"><LockKeyhole/></span><p className="mt-8 text-sm font-semibold text-primary">{siteConfig.name}</p><h1 className="mt-2 text-3xl font-semibold">Administration</h1><p className="mt-4 leading-7 text-muted-foreground">Secure content management access for authorised hospital staff.</p><Button asChild className="mt-8 w-full" size="lg"><Link to="/_admin/login">Continue to sign in <ArrowRight/></Link></Button><Link to="/" className="mt-5 block text-center text-sm font-medium text-muted-foreground hover:text-foreground">Return to website</Link></div></main>}
