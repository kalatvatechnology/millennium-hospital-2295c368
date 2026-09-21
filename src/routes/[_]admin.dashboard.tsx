import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/admin-shell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/page";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/_admin/dashboard")({
  head: () => ({
    meta: [...createPageMeta("Admin dashboard", "Hospital content and enquiry overview."), { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminDashboard,
});

const tables = [
  { table: "departments", label: "Departments" },
  { table: "doctors", label: "Doctors" },
  { table: "professional_services", label: "Professional services" },
  { table: "hospital_services", label: "Hospital services" },
  { table: "facilities", label: "Facilities" },
  { table: "media_items", label: "Media items" },
  { table: "faqs", label: "FAQs" },
  { table: "reviews", label: "Reviews" },
  { table: "blog_posts", label: "Blog posts" },
  { table: "enquiries", label: "Enquiries" },
] as const;

function AdminDashboard() {
  const counts = useQuery({
    queryKey: ["admin-counts"],
    queryFn: async () => {
      const entries = await Promise.all(
        tables.map(async ({ table, label }) => {
          const { count } = await supabase.from(table).select("id", { count: "exact", head: true });
          return { label, count: count ?? 0 };
        }),
      );
      return entries;
    },
  });

  return (
    <AdminShell title="Dashboard" description="An overview of published content and incoming enquiries.">
      {counts.isPending ? (
        <LoadingState />
      ) : (
        <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {(counts.data ?? []).map((item) => (
            <div key={item.label} className="bg-background p-5">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold">{item.count}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild><Link to="/_admin/enquiries">Manage enquiries</Link></Button>
        <Button asChild variant="outline"><Link to="/_admin/content">Manage content</Link></Button>
      </div>
    </AdminShell>
  );
}
