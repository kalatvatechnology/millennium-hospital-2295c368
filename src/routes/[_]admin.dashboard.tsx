import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/admin-shell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/page";
import { useAdminSession } from "@/hooks/use-admin-session";
import { ROLE_LABELS } from "@/lib/permissions";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/_admin/dashboard")({
  head: () => ({ meta: [...createPageMeta("Staff dashboard", "Hospital content and enquiry overview."), { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminDashboard,
});

const contentTables = [
  { table: "departments", label: "Departments" },
  { table: "doctors", label: "Doctors" },
  { table: "professional_services", label: "Professional services" },
  { table: "hospital_services", label: "Hospital services" },
  { table: "facilities", label: "Facilities" },
  { table: "media_items", label: "Media items" },
  { table: "faqs", label: "FAQs" },
  { table: "reviews", label: "Reviews" },
  { table: "blog_posts", label: "Blog posts" },
] as const;

function AdminDashboard() {
  const { roles, can, profile } = useAdminSession();
  const isDoctorOnly = roles.length > 0 && roles.every((role) => role === "doctor");

  const counts = useQuery({
    queryKey: ["admin-counts", isDoctorOnly],
    enabled: !isDoctorOnly,
    queryFn: async () => {
      const entries = await Promise.all(
        contentTables.map(async ({ table, label }) => {
          const { count } = await supabase.from(table).select("id", { count: "exact", head: true });
          return { label, count: count ?? 0 };
        }),
      );
      return entries;
    },
  });

  const enquiryCount = useQuery({
    queryKey: ["admin-enquiry-count"],
    enabled: can("enquiries.manage"),
    queryFn: async () => {
      const { count } = await supabase.from("enquiries").select("id", { count: "exact", head: true }).in("status", ["submitted", "pending_forwarding"]);
      return count ?? 0;
    },
  });

  const doctorWork = useQuery({
    queryKey: ["admin-doctor-work", profile?.doctor_id],
    enabled: Boolean(profile?.doctor_id),
    queryFn: async () => {
      const [reviews, requests] = await Promise.all([
        supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("clinical_reviewer_id", profile?.doctor_id ?? "").eq("clinical_review_status", "pending"),
        supabase.from("doctor_profile_change_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      return { pendingReviews: reviews.count ?? 0, pendingRequests: requests.count ?? 0 };
    },
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
