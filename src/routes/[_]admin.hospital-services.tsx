import { createFileRoute } from "@tanstack/react-router";
import { ContentManager } from "@/components/admin/content-manager";
import { contentTypeByKey } from "@/lib/admin-content";
import { createPageMeta } from "@/lib/seo";
import { usesProductionContract } from "@/lib/data/backend";
import { AdminFeatureUnavailable } from "@/components/admin/feature-unavailable";

const type = contentTypeByKey("hospital-services")!;

export const Route = createFileRoute("/_admin/hospital-services")({
  head: () => ({ meta: [...createPageMeta(type.label, type.description), { name: "robots", content: "noindex, nofollow" }] }),
  component: () =>
    usesProductionContract ? (
      <AdminFeatureUnavailable title="Hospital services" frontendReady />
    ) : (
      <ContentManager type={type} />
    ),
});
