import { createFileRoute } from "@tanstack/react-router";
import { LinkedList } from "@/components/admin/department-workspace";
const rows = [
  { id: "a", order: 0, title: "Dr. Sample One", sub: "Consultant · Orthopedics", image: null, status: "Published" },
  { id: "b", order: 1, title: "Dr. Sample Two", sub: "Senior Surgeon · Joint Replacement", image: null, status: "Draft" },
  { id: "c", order: 2, title: "Dr. Sample Three", sub: "Consultant · Sports Medicine", image: null, status: "Draft" },
] as any;
export const Route = createFileRoute("/tmp-specialists")({
  component: () => (
    <div className="mx-auto max-w-3xl p-6 bg-background">
      <LinkedList refined rows={rows} busy={false} removeLabel="Remove doctor" empty={null} onMove={() => {}} onRemove={() => {}} />
    </div>
  ),
});
