import { AdminShell } from "@/components/admin/admin-shell";
import { EmptyState } from "@/components/shared/page";

export function AdminFeatureUnavailable({
  title,
  frontendReady = false,
}: {
  title: string;
  frontendReady?: boolean;
}) {
  return (
    <AdminShell
      title={title}
      description={
        frontendReady
          ? "The approved workspace is retained and ready for its production data model."
          : "This area is preserved but is not connected to the production backend contract."
      }
    >
      <EmptyState
        title={frontendReady ? "Frontend ready · Backend required" : "Backend not yet available"}
        description="No production request will be made until the data model and permissions are approved and connected."
      />
    </AdminShell>
  );
}
