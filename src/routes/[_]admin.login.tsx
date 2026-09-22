import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSession } from "@/hooks/use-admin-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPageMeta } from "@/lib/seo";
import { MillenniumLogo } from "@/components/shared/millennium-logo";

export const Route = createFileRoute("/_admin/login")({
  head: () => ({
    meta: [...createPageMeta("Admin sign in", "Authorised staff sign-in for The Millennium Hospital."), { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const { session, isStaff, loading } = useAdminSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session && isStaff) navigate({ to: "/_admin/dashboard" });
  }, [session, isStaff, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (signInError) setError("We couldn't sign you in. Check your email and password.");
  };

  return (
    <main className="grid min-h-screen place-items-center bg-secondary px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-border bg-background p-8 shadow-[var(--shadow-lg)]">
        <div className="border-b border-border pb-6"><Link to="/" aria-label="The Millennium Hospital home" className="inline-block"><MillenniumLogo className="w-72 max-w-full" /></Link><p className="mt-3 text-xs font-semibold uppercase text-muted-foreground">Staff workspace</p></div>
        <span className="mt-8 grid size-11 place-items-center rounded-lg bg-secondary text-primary"><LockKeyhole /></span>
        <h1 className="mt-6 text-3xl font-semibold">Staff sign in</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Only authorised hospital staff accounts can manage content and enquiries.</p>
        <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="admin-email">Email address</Label>
            <Input id="admin-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2" autoComplete="username" />
          </div>
          <div>
            <Label htmlFor="admin-password">Password</Label>
            <Input id="admin-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2" autoComplete="current-password" />
          </div>
          {error ? <p role="alert" className="text-sm font-medium text-destructive">{error}</p> : null}
          {session && !loading && !isStaff ? (
            <p role="alert" className="text-sm font-medium text-destructive">This account does not have staff access.</p>
          ) : null}
          <Button type="submit" size="lg" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
        </form>
        <Link to="/" className="mt-6 block text-center text-sm font-medium text-muted-foreground hover:text-foreground">Return to the website</Link>
      </div>
    </main>
  );
}
