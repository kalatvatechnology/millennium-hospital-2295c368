import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, MessageCircle } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/page";
import { createPageMeta } from "@/lib/seo";
import { ENQUIRY_STATUSES, usesProductionContract, type ProductionEnquiryStatus } from "@/lib/data/backend";
import { userFacingDataError } from "@/lib/data/errors";

export const Route = createFileRoute("/_admin/enquiries")({
  head: () => ({
    meta: [...createPageMeta("Enquiries", "Manage patient enquiries."), { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminEnquiries,
});

type LocalStatus = "submitted" | "pending_forwarding" | "forwarded" | "contacted" | "closed" | "cancelled";
type Status = LocalStatus | ProductionEnquiryStatus;
const localStatuses: LocalStatus[] = ["submitted", "pending_forwarding", "forwarded", "contacted", "closed", "cancelled"];
const statuses: Status[] = usesProductionContract ? [...ENQUIRY_STATUSES] : localStatuses;
const statusLabel: Record<Status, string> = {
  submitted: "Submitted",
  pending_forwarding: "Pending forwarding",
  forwarded: "Forwarded",
  new: "New",
  in_progress: "In progress",
  forwarded_whatsapp: "Forwarded to WhatsApp",
  contacted: "Contacted",
  closed: "Closed",
  cancelled: "Cancelled",
  spam: "Spam",
};

type EnquiryRow = {
  id: string;
  created_at: string;
  patient_name: string;
  contact_number: string;
  registered_contact_number?: string | null;
  family_member_name?: string | null;
  preferred_at: string | null;
  status: Status;
  message: string | null;
  doctor: { name: string; whatsapp_number: string | null } | null;
  department: { name: string } | null;
  service: { title: string } | null;
};

function AdminEnquiries() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | Status>("all");

  const enquiries = useQuery({
    queryKey: ["admin-enquiries"],
    queryFn: async () => {
      const table = usesProductionContract ? "appointment_enquiries" : "enquiries";
      const selection = usesProductionContract
        ? "*, doctor:doctors!appointment_enquiries_preferred_doctor_id_fkey(full_name,whatsapp), department:departments!appointment_enquiries_preferred_department_id_fkey(name), service:services!appointment_enquiries_preferred_service_id_fkey(name,title)"
        : "*, doctor:doctors(name,whatsapp_number), department:departments(name), professional_service:professional_services(title), hospital_service:hospital_services(title)";
      const { data, error } = await (supabase as any)
        .from(table)
        .select(selection)
        .order("created_at", { ascending: false });
      if (error) throw userFacingDataError(error);
      return ((data ?? []) as Record<string, any>[]).map((row): EnquiryRow => ({
        id: String(row["id"]),
        created_at: String(row["created_at"]),
        patient_name: String(row["patient_name"]),
        contact_number: String(row["contact_number"]),
        registered_contact_number: row["registered_contact_number"] ?? null,
        family_member_name: row["family_member_name"] ?? null,
        preferred_at: row["preferred_at"] ?? null,
        status: row["status"] as Status,
        message: row["message"] ?? null,
        doctor: row["doctor"] ? { name: String(row["doctor"].full_name ?? row["doctor"].name), whatsapp_number: row["doctor"].whatsapp ?? row["doctor"].whatsapp_number ?? null } : null,
        department: row["department"] ? { name: String(row["department"].name) } : null,
        service: row["service"] ?? row["professional_service"] ?? row["hospital_service"] ?? null,
      }));
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: Status }) => {
      const table = usesProductionContract ? "appointment_enquiries" : "enquiries";
      const { error } = await (supabase as any).from(table).update({ status: next }).eq("id", id);
      if (error) throw new Error(userFacingDataError(error));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-enquiries"] }),
  });

  const rows = useMemo(() => {
    const list = enquiries.data ?? [];
    const term = search.trim().toLowerCase();
    return list.filter((row) => {
      const haystack = `${row.patient_name} ${row.contact_number} ${row.family_member_name ?? ""} ${row.doctor?.name ?? ""}`.toLowerCase();
      return haystack.includes(term) && (status === "all" || row.status === status);
    });
  }, [enquiries.data, search, status]);

  const exportCsv = () => {
    const header = ["Created", "Patient", "Contact", "Family member", "Doctor", "Department", "Service", "Preferred", "Status", "Message"];
    const body = rows.map((row) => [
      new Date(row.created_at).toISOString(),
      row.patient_name,
      row.contact_number,
      row.family_member_name ?? "",
      row.doctor?.name ?? "",
      row.department?.name ?? "",
      row.service?.title ?? "",
      row.preferred_at ?? "",
      row.status,
      (row.message ?? "").replace(/\s+/g, " "),
    ]);
    const csv = [header, ...body].map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell title="Enquiries" description="Search, filter, forward and update patient enquiries.">
      <div className="grid gap-4 border border-border bg-background p-5 md:grid-cols-[2fr_1fr_auto] md:items-end">
        <div>
          <Label htmlFor="enquiry-search">Search by name, number or doctor</Label>
          <Input id="enquiry-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} className="mt-2" />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as "all" | Status)}>
            <SelectTrigger className="mt-2 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statuses.map((item) => <SelectItem key={item} value={item}>{statusLabel[item]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={!rows.length}><Download className="size-4" /> Export CSV</Button>
      </div>

      {enquiries.isPending ? (
        <LoadingState />
      ) : enquiries.isError ? (
        <ErrorState />
      ) : rows.length === 0 ? (
        <EmptyState title="No enquiries found" description="New website enquiries will appear here." />
      ) : (
        <div className="mt-6 grid gap-4">
          {rows.map((row) => {
            const target = row.doctor?.whatsapp_number ?? null;
            const text = encodeURIComponent(
              [
                "Enquiry from the hospital website",
                `Patient: ${row.patient_name}`,
                `Contact: ${row.contact_number}`,
                row.doctor ? `Doctor: ${row.doctor.name}` : null,
                row.message ? `Message: ${row.message}` : null,
              ].filter(Boolean).join("\n"),
            );
            return (
              <article key={row.id} className="border border-border bg-background p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">{row.patient_name}</h2>
                    <p className="text-sm text-muted-foreground">{row.contact_number} · {new Date(row.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Select value={row.status} onValueChange={(value) => updateStatus.mutate({ id: row.id, next: value as Status })}>
                      <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statuses.map((item) => <SelectItem key={item} value={item}>{statusLabel[item]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {target ? (
                      <Button asChild variant="outline" size="sm">
                        <a href={`https://wa.me/${target.replace(/\D/g, "")}?text=${text}`} target="_blank" rel="noreferrer">
                          <MessageCircle className="size-4" /> Forward
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  {row.family_member_name ? <div><dt className="font-semibold">Family member</dt><dd className="text-muted-foreground">{row.family_member_name}</dd></div> : null}
                  {row.doctor ? <div><dt className="font-semibold">Doctor</dt><dd className="text-muted-foreground">{row.doctor.name}</dd></div> : null}
                  {row.department ? <div><dt className="font-semibold">Department</dt><dd className="text-muted-foreground">{row.department.name}</dd></div> : null}
                   {row.service ? <div><dt className="font-semibold">Service</dt><dd className="text-muted-foreground">{row.service.title}</dd></div> : null}
                  {row.preferred_at ? <div><dt className="font-semibold">Preferred time</dt><dd className="text-muted-foreground">{new Date(row.preferred_at).toLocaleString()}</dd></div> : null}
                </dl>
                {row.message ? <p className="mt-4 text-sm leading-6 text-muted-foreground">{row.message}</p> : null}
              </article>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
