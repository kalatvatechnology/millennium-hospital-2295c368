import { AdminShell } from "@/components/admin/admin-shell";
import { EmptyState } from "@/components/shared/page";

export function AdminFeatureUnavailable({ title }: { title: string }) {
  return (
    <AdminShell title={title} description="This area is preserved but is not connected to the production backend contract.">
      <EmptyState
        title="Backend not yet available"
        description="This area will remain read-only and disconnected until its production data model and permissions are confirmed."
      />
    </AdminShell>
  );
}
