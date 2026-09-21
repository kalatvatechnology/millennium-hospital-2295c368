import { createFileRoute } from "@tanstack/react-router";
import { ContentManager } from "@/components/admin/content-manager";
import { contentTypeByKey } from "@/lib/admin-content";
import { createPageMeta } from "@/lib/seo";

const type = contentTypeByKey("navigation")!;

export const Route = createFileRoute("/_admin/navigation")({
  head: () => ({ meta: [...createPageMeta(type.label, type.description), { name: "robots", content: "noindex, nofollow" }] }),
  component: () => <ContentManager type={type} />,
});
