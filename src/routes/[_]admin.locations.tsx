import { createFileRoute } from "@tanstack/react-router";
import { ContentManager } from "@/components/admin/content-manager";
import { contentTypeByKey } from "@/lib/admin-content";
import { createPageMeta } from "@/lib/seo";
import { useAdminSession } from "@/hooks/use-admin-session";

const type = contentTypeByKey("locations")!;

function LocationsPage() {
  const { can } = useAdminSession();
  if (!can("locations.manage")) {
    return (
      <p role="alert" className="text-sm text-muted-foreground">
        Only Super Admins and Admins can manage locations.
      </p>
    );
  }
  return <ContentManager type={type} />;
}

export const Route = createFileRoute("/_admin/locations")({
  head: () => ({ meta: [...createPageMeta(type.label, type.description), { name: "robots", content: "noindex, nofollow" }] }),
  component: LocationsPage,
});
