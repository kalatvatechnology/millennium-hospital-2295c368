import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ListPanel } from "@/components/admin/department-workspace";
import type { ListSection } from "@/lib/department-page";
export const Route = createFileRoute("/qa-care-preview")({ component: P });
function P() {
  const [v, setV] = useState<ListSection>({ enabled: true, label: "Conditions", title: "Conditions we treat", intro: "Sample introduction text.", items: [1,2,3].map((n) => ({ id: String(n), title: `Condition ${n}`, text: n===2?"":`Description for condition ${n}.`, enabled: true })) });
  return <div className="mx-auto max-w-4xl p-6"><ListPanel title="Conditions We Treat" itemName="condition" nameLabel="Name" textOptional emptyText="No conditions added." value={v} onChange={setV} refined /></div>;
}
