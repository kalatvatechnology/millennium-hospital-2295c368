import { createFileRoute } from "@tanstack/react-router";
import { DoctorWorkspace } from "@/components/admin/doctor-workspace";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/_admin/doctors/$doctorId/$section")({
  head: () => ({
    meta: [
      ...createPageMeta("Doctor workspace", "Edit a doctor profile and its related content."),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DoctorWorkspace,
});
