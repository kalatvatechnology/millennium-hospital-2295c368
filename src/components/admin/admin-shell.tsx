import type { ReactNode } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAdminSession } from "@/hooks/use-admin-session";
import { Button } from "@/components/ui/button";
import { LoadingState, EmptyState } from "@/components/shared/page";
import { ROLE_LABELS, type Permission } from "@/lib/permissions";

type NavItem = { label: string; to: string; permission: Permission | Permission[] | null };

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/_admin/dashboard", permission: null },
  { label: "Doctors", to: "/_admin/doctors", permission: "content.write" },
  { label: "Departments", to: "/_admin/departments", permission: "content.write" },
  { label: "Professional services", to: "/_admin/professional-services", permission: "content.write" },
  { label: "Hospital services", to: "/_admin/hospital-services", permission: "content.write" },
  { label: "Facilities", to: "/_admin/facilities", permission: "content.write" },
  { label: "Locations", to: "/_admin/locations", permission: "content.write" },
  { label: "Appointment enquiries", to: "/_admin/enquiries", permission: "enquiries.manage" },
  { label: "Media & content", to: "/_admin/media", permission: "content.write" },
  { label: "FAQs", to: "/_admin/faqs", permission: "content.write" },
  { label: "Reviews", to: "/_admin/reviews", permission: "content.write" },
  { label: "Blog", to: "/_admin/blog", permission: ["content.write", "blog.review"] },
  { label: "Website pages", to: "/_admin/pages", permission: "content.write" },
  { label: "Navigation", to: "/_admin/navigation", permission: "content.write" },
  { label: "Profile requests", to: "/_admin/profile-requests", permission: ["content.write", "profile.request"] },
  { label: "Users & roles", to: "/_admin/users", permission: "users.manage" },
  { label: "Notifications", to: "/_admin/notifications", permission: null },
  { label: "Audit logs", to: "/_admin/audit-logs", permission: "audit.read" },
];

export function AdminShell({
  title,
  description,
  requires,
  actions,
  children,
}: {
  title: string;
  description?: string;
  requires?: Permission | Permission[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { session, roles, loading, isStaff, can, signOut } = useAdminSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!session || !isStaff)) navigate({ to: "/_admin/login" });
  }, [loading, session, isStaff, navigate]);

  if (loading || !session || !isStaff) {
    return (
      <main className="grid min-h-screen place-items-center bg-admin">
        <LoadingState />
      </main>
    );
  }

  const allows = (permission: Permission | Permission[] | null | undefined) =>
    permission === null || permission === undefined ? true : Array.isArray(permission) ? permission.some(can) : can(permission);
  const visible = navItems.filter((item) => allows(item.permission));
  const allowed = allows(requires);

  return (
    <div className="min-h-screen bg-admin">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="font-semibold">
            The Millennium Hospital
          </Link>
          <p className="text-sm text-muted-foreground">{roles.map((role) => ROLE_LABELS[role]).join(", ")}</p>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
        <nav aria-label="Staff sections" className="lg:w-60 lg:shrink-0">
          <ul className="flex flex-wrap gap-1 lg:flex-col">
            {visible.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-background hover:text-foreground"
                  activeProps={{ className: "block rounded-md px-3 py-2 text-sm font-medium bg-background text-foreground" }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">{title}</h1>
              {description ? <p className="mt-2 text-muted-foreground">{description}</p> : null}
            </div>
            {allowed ? actions : null}
          </div>
          <div className="mt-8">
            {allowed ? (
              children
            ) : (
              <EmptyState title="You do not have access to this section" description="Ask a super admin if you need this permission." />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
