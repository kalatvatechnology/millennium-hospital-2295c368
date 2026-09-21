import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Plus, X } from "lucide-react";
import { useAdminSession } from "@/hooks/use-admin-session";
import { Button } from "@/components/ui/button";
import { LoadingState, EmptyState } from "@/components/shared/page";
import { ROLE_LABELS, type Permission } from "@/lib/permissions";
import { backendFeatures, usesProductionContract } from "@/lib/data/backend";
import { userFacingDataError } from "@/lib/data/errors";

type NavItem = { label: string; to: string; permission: Permission | Permission[] | null };

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/_admin/dashboard", permission: null },
  { label: "Doctors", to: "/_admin/doctors", permission: "content.write" },
  { label: "Departments", to: "/_admin/departments", permission: "content.write" },
  {
    label: "Professional services",
    to: "/_admin/professional-services",
    permission: "content.write",
  },
  ...(usesProductionContract
    ? []
    : [
        {
          label: "Hospital services",
          to: "/_admin/hospital-services",
          permission: "content.write" as Permission,
        },
      ]),
  { label: "Facilities", to: "/_admin/facilities", permission: "content.write" },
  { label: "Locations", to: "/_admin/locations", permission: "content.write" },
  { label: "Appointment enquiries", to: "/_admin/enquiries", permission: "enquiries.manage" },
  { label: "Media & content", to: "/_admin/media", permission: "content.write" },
  { label: "FAQs", to: "/_admin/faqs", permission: "content.write" },
  { label: "Reviews", to: "/_admin/reviews", permission: "content.write" },
  ...(backendFeatures.blog
    ? [
        {
          label: "Blog",
          to: "/_admin/blog",
          permission: ["content.write", "blog.review"] as Permission[],
        },
      ]
    : []),
  ...(backendFeatures.websitePages
    ? [{ label: "Website pages", to: "/_admin/pages", permission: "content.write" as Permission }]
    : []),
  ...(backendFeatures.navigation
    ? [{ label: "Navigation", to: "/_admin/navigation", permission: "content.write" as Permission }]
    : []),
  ...(backendFeatures.profileRequests
    ? [
        {
          label: "Profile requests",
          to: "/_admin/profile-requests",
          permission: ["content.write", "profile.request"] as Permission[],
        },
      ]
    : []),
  ...(backendFeatures.profiles
    ? [{ label: "Users & roles", to: "/_admin/users", permission: "users.manage" as Permission }]
    : []),
  ...(backendFeatures.notifications
    ? [{ label: "Notifications", to: "/_admin/notifications", permission: null }]
    : []),
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
  const { session, roles, loading, error, isStaff, can, signOut } = useAdminSession();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!session || !isStaff)) navigate({ to: "/_admin/login" });
  }, [loading, session, isStaff, navigate]);

  if (loading || (!error && (!session || !isStaff))) {
    return (
      <main className="grid min-h-screen place-items-center bg-admin">
        <LoadingState />
      </main>
    );
  }

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-admin p-6">
        <EmptyState
          title="Staff access could not be verified"
          description={userFacingDataError(error)}
        />
      </main>
    );
  }

  if (!session || !isStaff) return null;

  const allows = (permission: Permission | Permission[] | null | undefined) =>
    permission === null || permission === undefined
      ? true
      : Array.isArray(permission)
        ? permission.some(can)
        : can(permission);
  const visible = navItems.filter((item) => allows(item.permission));
  const allowed = allows(requires);

  return (
    <div className="min-h-screen bg-admin">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 shadow-[var(--shadow-sm)] backdrop-blur">
        <div className="mx-auto flex h-18 max-w-screen-2xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 font-heading font-semibold">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Plus className="size-5" />
            </span>
            <span>The Millennium Hospital</span>
          </Link>
          <span className="hidden rounded-sm bg-secondary px-2 py-1 text-xs font-semibold text-primary sm:inline">
            Staff workspace
          </span>
          <p className="hidden text-sm text-muted-foreground md:block">
            {roles.map((role) => ROLE_LABELS[role]).join(", ")}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={() => setNavOpen((value) => !value)}
            aria-label={navOpen ? "Close staff navigation" : "Open staff navigation"}
            aria-expanded={navOpen}
          >
            {navOpen ? <X /> : <Menu />}
          </Button>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </header>
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-8 px-4 py-6 sm:px-6 lg:flex-row lg:gap-10 lg:px-8 lg:py-8">
        <nav
          aria-label="Staff sections"
          className={`${navOpen ? "block" : "hidden"} rounded-lg bg-sidebar p-3 text-sidebar-foreground shadow-[var(--shadow-md)] lg:block lg:w-64 lg:shrink-0`}
        >
          <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase text-sidebar-foreground/55">
            Workspace
          </p>
          <ul className="grid gap-1">
            {visible.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setNavOpen(false)}
                  className="block min-h-10 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  activeProps={{
                    className:
                      "block min-h-10 rounded-md px-3 py-2.5 text-sm font-semibold bg-sidebar-primary text-sidebar-primary-foreground",
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main className="min-w-0 flex-1 pb-12">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
            <div>
              <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
              {description ? <p className="mt-2 text-muted-foreground">{description}</p> : null}
            </div>
            {allowed ? actions : null}
          </div>
          <div className="mt-8">
            {allowed ? (
              children
            ) : (
              <EmptyState
                title="You do not have access to this section"
                description="Ask a super admin if you need this permission."
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
