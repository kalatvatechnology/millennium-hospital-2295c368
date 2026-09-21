import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAdminSession } from "@/hooks/use-admin-session";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/page";

const links = [
  { label: "Dashboard", to: "/_admin/dashboard" },
  { label: "Enquiries", to: "/_admin/enquiries" },
  { label: "Content", to: "/_admin/content" },
] as const;

export function AdminShell({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  const { session, isAdmin, loading, signOut } = useAdminSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!session || isAdmin === false)) {
      navigate({ to: "/_admin/login" });
    }
  }, [loading, session, isAdmin, navigate]);

  if (loading || !session || isAdmin !== true) {
    return <main className="grid min-h-screen place-items-center bg-admin"><LoadingState /></main>;
  }

  return (
    <div className="min-h-screen bg-admin">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="font-semibold">The Millennium Hospital</Link>
          <nav className="flex flex-wrap gap-4 text-sm font-medium text-muted-foreground">
            {links.map((link) => (
              <Link key={link.to} to={link.to} className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>
                {link.label}
              </Link>
            ))}
          </nav>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => signOut()}>Sign out</Button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">{title}</h1>
        {description ? <p className="mt-2 text-muted-foreground">{description}</p> : null}
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
