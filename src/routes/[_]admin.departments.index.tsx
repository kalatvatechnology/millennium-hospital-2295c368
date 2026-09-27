import { createFileRoute } from "@tanstack/react-router";
import { DepartmentManager } from "@/components/admin/department-manager";
import { contentTypeByKey } from "@/lib/admin-content";
import { createPageMeta } from "@/lib/seo";

const type = contentTypeByKey("departments")!;

export const Route = createFileRoute("/_admin/departments/")({
  head: () => ({ meta: [...createPageMeta(type.label, type.description), { name: "robots", content: "noindex, nofollow" }] }),
  component: () => <DepartmentManager type={type} />,
});
