import { createFileRoute } from "@tanstack/react-router";
import { ContentManager } from "@/components/admin/content-manager";
import { contentTypeByKey } from "@/lib/admin-content";
import { createPageMeta } from "@/lib/seo";

const type = contentTypeByKey("professional-services")!;

export const Route = createFileRoute("/_admin/professional-services")({
  head: () => ({ meta: [...createPageMeta(type.label, type.description), { name: "robots", content: "noindex, nofollow" }] }),
  component: () => <ContentManager type={type} />,
});
