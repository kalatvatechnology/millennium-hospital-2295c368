import { createFileRoute } from "@tanstack/react-router";
import { DoctorList } from "@/components/admin/doctor-list";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/_admin/doctors/")({
  head: () => ({
    meta: [
      ...createPageMeta("Doctors", "Manage authoritative doctor profiles."),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DoctorList,
});
