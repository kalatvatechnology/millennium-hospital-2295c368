import { createFileRoute } from "@tanstack/react-router";
import { DepartmentWorkspace } from "@/components/admin/department-workspace";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/_admin/departments/$departmentId/$section")({
  head: () => ({
    meta: [
      ...createPageMeta("Department workspace", "Edit a department page and its linked content."),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DepartmentWorkspace,
});
