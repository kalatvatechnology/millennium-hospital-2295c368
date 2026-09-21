import { createFileRoute, Link } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPageMeta } from "@/lib/seo";
export const Route = createFileRoute("/_admin/login")({ head: () => ({ meta: [...createPageMeta("Admin sign in", "Authorised staff sign-in for The Millennium Hospital."), { name: "robots", content: "noindex, nofollow" }] }), component: AdminLogin });
function AdminLogin(){return <main className="grid min-h-screen place-items-center bg-admin px-4 py-12"><div className="w-full max-w-md border border-border bg-background p-8 shadow-lg"><LockKeyhole className="text-primary"/><h1 className="mt-6 text-3xl font-semibold">Staff sign in</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Authentication will be enabled when the hospital's secure content service is connected.</p><form className="mt-8 grid gap-5" onSubmit={(event)=>event.preventDefault()}><div><Label htmlFor="admin-email">Email address</Label><Input id="admin-email" type="email" className="mt-2" autoComplete="username"/></div><div><Label htmlFor="admin-password">Password</Label><Input id="admin-password" type="password" className="mt-2" autoComplete="current-password"/></div><Button type="submit" size="lg" disabled>Sign in</Button></form><Link to="/" className="mt-6 block text-center text-sm font-medium text-muted-foreground hover:text-foreground">Return to website</Link></div></main>}
