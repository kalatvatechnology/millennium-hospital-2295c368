import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { ListPanel, Group, Grid, ImageField, Field } from "@/components/admin/department-workspace";
function Demo() {
  const [v, setV] = useState<any>({ enabled: true, label: "Facilities", title: "Advanced orthopaedic care", intro: "Sample introduction text.", image_url: "/favicon.png", image_alt: "Sample alt",
    items: [1,2,3].map((i) => ({ id: String(i), title: `Sample facility ${i}`, text: "Sample description", enabled: true })) });
  return (<div className="mx-auto max-w-4xl p-6"><ListPanel refined title="Facilities & Technology" itemName="facility point" textOptional emptyText="No facilities added." value={v} onChange={(n: any) => setV({ ...v, ...n })}
    extra={<Group title="Feature image" description="Photo shown beside the facility points, with its alt text."><Grid>
      <ImageField label="Feature image" url={v.image_url} onChange={() => {}} onUpload={async () => ""} />
      <Field label="Feature image alt text" wide count={[v.image_alt.length, 160]}><Input value={v.image_alt} readOnly /></Field></Grid></Group>} /></div>);
}
export const Route = createFileRoute("/tmp-facilities")({ component: Demo });
