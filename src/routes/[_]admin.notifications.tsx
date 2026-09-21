import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/admin-shell";
import { DataTable, StatusBadge, type Column } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { createPageMeta } from "@/lib/seo";
import { backendFeatures } from "@/lib/data/backend";
import { AdminFeatureUnavailable } from "@/components/admin/feature-unavailable";

export const Route = createFileRoute("/_admin/notifications")({
  head: () => ({ meta: [...createPageMeta("Notifications", "Messages for your staff account."), { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminNotifications,
});

function AdminNotifications() {
  if (!backendFeatures.notifications) return <AdminFeatureUnavailable title="Notifications" />;
  return <AvailableNotifications />;
}

function AvailableNotifications() {
  const queryClient = useQueryClient();
  const notifications = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });

  const columns: Column<(typeof notifications)["data"] extends (infer T)[] | undefined ? T : never>[] = [
    {
      key: "title",
      header: "Message",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.title}</p>
          {row.body ? <p className="text-sm text-muted-foreground">{row.body}</p> : null}
        </div>
      ),
    },
    { key: "when", header: "Received", cell: (row) => new Date(row.created_at).toLocaleString() },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.read_at ? "read" : "unread"} tone={row.read_at ? "neutral" : "warning"} /> },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (row) =>
        row.read_at ? null : (
          <Button size="sm" variant="outline" onClick={() => markRead.mutate(row.id)}>
            Mark as read
          </Button>
        ),
    },
  ];

  return (
    <AdminShell title="Notifications" description="Messages sent to your staff account.">
      <DataTable
        rows={notifications.data ?? []}
        columns={columns}
        getRowId={(row) => row.id}
        isPending={notifications.isPending}
        isError={notifications.isError}
        emptyTitle="No notifications"
        emptyDescription="You will see messages here when something needs your attention."
      />
    </AdminShell>
  );
}
