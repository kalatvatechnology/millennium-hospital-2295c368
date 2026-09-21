import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/page";
import { useAdminSession } from "@/hooks/use-admin-session";
import { ROLE_LABELS } from "@/lib/permissions";
import { createPageMeta } from "@/lib/seo";
import { backendFeatures } from "@/lib/data/backend";
import { getActiveEnquiryCount, getDashboardCounts } from "@/lib/data/staff-repository";

export const Route = createFileRoute("/_admin/dashboard")({
  head: () => ({ meta: [...createPageMeta("Staff dashboard", "Hospital content and enquiry overview."), { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { roles, can, profile } = useAdminSession();
  const isDoctorOnly = roles.length > 0 && roles.every((role) => role === "doctor");

  const counts = useQuery({
    queryKey: ["admin-counts", isDoctorOnly],
    enabled: !isDoctorOnly,
    queryFn: getDashboardCounts,
  });

  const enquiryCount = useQuery({
    queryKey: ["admin-enquiry-count"],
    enabled: can("enquiries.manage"),
    queryFn: getActiveEnquiryCount,
  });

  const doctorWork = useQuery({
    queryKey: ["admin-doctor-work", profile?.doctor_id],
    enabled: Boolean(profile?.doctor_id && backendFeatures.blog && backendFeatures.profileRequests),
    queryFn: async () => ({ pendingReviews: 0, pendingRequests: 0 }),
  });

  return (
    <AdminShell title="Dashboard" description={`Signed in as ${roles.map((role) => ROLE_LABELS[role]).join(", ") || "staff"}.`}>
      {profile?.doctor_id ? (
        <section className="mb-8">
          <h2 className="text-xl font-semibold">Your clinical work</h2>
          <div className="mt-4 grid gap-px border border-border bg-border sm:grid-cols-2">
            <div className="bg-background p-5">
              <p className="text-sm text-muted-foreground">Articles awaiting your clinical review</p>
              <p className="mt-2 text-3xl font-semibold">{doctorWork.data?.pendingReviews ?? 0}</p>
              <Button asChild size="sm" variant="outline" className="mt-4">
                <Link to="/_admin/blog">Open blog</Link>
              </Button>
            </div>
            <div className="bg-background p-5">
              <p className="text-sm text-muted-foreground">Profile change requests pending</p>
              <p className="mt-2 text-3xl font-semibold">{doctorWork.data?.pendingRequests ?? 0}</p>
              <Button asChild size="sm" variant="outline" className="mt-4">
                <Link to="/_admin/profile-requests">Open requests</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {can("enquiries.manage") ? (
        <section className="mb-8 border border-border bg-background p-5">
          <p className="text-sm text-muted-foreground">Enquiries needing attention</p>
          <p className="mt-2 text-3xl font-semibold">{enquiryCount.data ?? 0}</p>
          <Button asChild size="sm" className="mt-4">
            <Link to="/_admin/enquiries">Manage enquiries</Link>
          </Button>
        </section>
      ) : null}

      {isDoctorOnly ? null : counts.isPending ? (
        <LoadingState />
      ) : (
        <section>
          <h2 className="text-xl font-semibold">Website content</h2>
          <div className="mt-4 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {(counts.data ?? []).map((item) => (
              <div key={item.label} className="bg-background p-5">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-3xl font-semibold">{item.count}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </AdminShell>
  );
}
