import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { DataTable, StatusBadge, type Column } from "@/components/admin/ui";
import { AdminFeatureUnavailable } from "@/components/admin/feature-unavailable";
import { Button } from "@/components/ui/button";
import { useAdminSession } from "@/hooks/use-admin-session";
import { supabase } from "@/integrations/supabase/client";
import { backendFeatures } from "@/lib/data/backend";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/_admin/profile-requests")({
  head: () => ({
    meta: [
      ...createPageMeta(
        "Profile change requests",
        "Doctor requests to update their published profile.",
      ),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminProfileRequests,
});
type RequestRow = {
  id: string;
  doctor_id: string;
  changes: unknown;
  note: string | null;
  status: string;
  created_at: string;
  doctors: { name: string } | null;
};
function AdminProfileRequests() {
  if (!backendFeatures.profileRequests)
    return <AdminFeatureUnavailable title="Profile change requests" />;
  return <AvailableProfileRequests />;
}
function AvailableProfileRequests() {
  const { profile, can } = useAdminSession();
  const canReview = can("content.write");
  const requests = useQuery({
    queryKey: ["admin-profile-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctor_profile_change_requests")
        .select("id, doctor_id, changes, note, status, created_at, doctors(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as RequestRow[];
    },
  });
  const columns: Column<RequestRow>[] = [
    {
      key: "doctor",
      header: "Doctor",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.doctors?.name ?? "Unknown doctor"}</p>
          <p className="text-sm text-muted-foreground">
            {new Date(row.created_at).toLocaleString()}
          </p>
        </div>
      ),
    },
    {
      key: "changes",
      header: "Requested changes",
      cell: (row) => (
        <span className="text-sm">
          {Object.keys((row.changes ?? {}) as Record<string, unknown>)
            .map((key) => key.replace(/_/g, " "))
            .join(", ") || "No fields supplied"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge
          status={row.status}
          tone={
            row.status === "approved"
              ? "positive"
              : row.status === "rejected"
                ? "critical"
                : "warning"
          }
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (row) => (
        <Button asChild size="sm" variant="outline">
          <Link to="/_admin/profile-requests/$requestId" params={{ requestId: row.id }}>
            {canReview && row.status === "pending" ? "Review request" : "View request"}
          </Link>
        </Button>
      ),
    },
  ];
  return (
    <AdminShell
      title="Profile change requests"
      description="Doctors request changes here. Content staff review them on a dedicated page."
      requires={["content.write", "profile.request"]}
      actions={
        profile?.doctor_id ? (
          <Button asChild>
            <Link to="/_admin/profile-requests/$requestId" params={{ requestId: "new" }}>
              Request a change
            </Link>
          </Button>
        ) : null
      }
    >
      <DataTable
        rows={requests.data ?? []}
        columns={columns}
        getRowId={(row) => row.id}
        isPending={requests.isPending}
        isError={requests.isError}
        emptyTitle="No change requests"
        emptyDescription="Requests from doctors will appear here."
      />
    </AdminShell>
  );
}
