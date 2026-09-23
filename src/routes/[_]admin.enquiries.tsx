import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, MessageCircle } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, LoadingState } from "@/components/shared/page";
import { AdminError } from "@/components/admin/ui";
import { createPageMeta } from "@/lib/seo";
import {
  ENQUIRY_STATUSES,
  usesProductionContract,
  type ProductionEnquiryStatus,
} from "@/lib/data/backend";
import { userFacingDataError } from "@/lib/data/errors";
import { listStaffEnquiries, updateEnquiryStatus } from "@/lib/data/staff-repository";
import {
  isDoctorOriginSource,
  resolveEnquiryWhatsappTarget,
  whatsappUrl,
} from "@/lib/whatsapp";

export const Route = createFileRoute("/_admin/enquiries")({
  head: () => ({
    meta: [
      ...createPageMeta("Enquiries", "Manage patient enquiries."),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminEnquiries,
});

type LocalStatus =
  "submitted" | "pending_forwarding" | "forwarded" | "contacted" | "closed" | "cancelled";
type Status = LocalStatus | ProductionEnquiryStatus;
const localStatuses: LocalStatus[] = [
  "submitted",
  "pending_forwarding",
  "forwarded",
  "contacted",
  "closed",
  "cancelled",
];
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

function AdminEnquiries() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | Status>("all");

  const enquiries = useQuery({
    queryKey: ["admin-enquiries"],
    queryFn: listStaffEnquiries,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: Status }) => {
      await updateEnquiryStatus(id, next);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-enquiries"] }),
  });

  const rows = useMemo(() => {
    const list = enquiries.data ?? [];
    const term = search.trim().toLowerCase();
    return list.filter((row) => {
      const haystack =
        `${row.patientName} ${row.contactNumber} ${row.familyMemberName ?? ""} ${row.doctor?.name ?? ""}`.toLowerCase();
      return haystack.includes(term) && (status === "all" || row.status === status);
    });
  }, [enquiries.data, search, status]);

  const exportCsv = () => {
    const header = [
      "Created",
      "Patient",
      "Contact",
      "Family member",
      "Doctor",
      "Department",
      "Service",
      "Preferred",
      "Status",
      "Message",
    ];
    const body = rows.map((row) => [
      new Date(row.createdAt).toISOString(),
      row.patientName,
      row.contactNumber,
      row.familyMemberName ?? "",
      row.doctor?.name ?? "",
      row.department?.name ?? "",
      row.service?.title ?? "",
      row.preferredAt ?? "",
      row.status,
      (row.message ?? "").replace(/\s+/g, " "),
    ]);
    const csv = [header, ...body]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell
      title="Enquiries"
      description="Search, filter, forward and update patient enquiries."
    >
      <div className="grid gap-4 border border-border bg-background p-5 md:grid-cols-[2fr_1fr_auto] md:items-end">
        <div>
          <Label htmlFor="enquiry-search">Search by name, number or doctor</Label>
          <Input
            id="enquiry-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as "all" | Status)}>
            <SelectTrigger className="mt-2 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statuses.map((item) => (
                <SelectItem key={item} value={item}>
                  {statusLabel[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={!rows.length}>
          <Download className="size-4" /> Export CSV
        </Button>
      </div>

      {enquiries.isPending ? (
        <LoadingState />
      ) : enquiries.isError ? (
        <AdminError message={userFacingDataError(enquiries.error)} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No enquiries found"
          description="New website enquiries will appear here."
        />
      ) : (
        <div className="mt-6 grid gap-4">
          {rows.map((row) => {
            const doctorOrigin = isDoctorOriginSource(row.source);
            const target = resolveEnquiryWhatsappTarget(
              row.source,
              row.doctor
                ? {
                    whatsapp_number: row.doctor.whatsappNumber,
                    whatsapp_country_code: row.doctor.whatsappCountryCode,
                  }
                : null,
            );
            const text = [
              "Enquiry from the hospital website",
              `Patient: ${row.patientName}`,
              `Contact: ${row.contactNumber}`,
              row.doctor ? `Doctor: ${row.doctor.name}` : null,
              row.message ? `Message: ${row.message}` : null,
            ]
              .filter(Boolean)
              .join("\n");
            return (
              <article key={row.id} className="border border-border bg-background p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">{row.patientName}</h2>
                    <p className="text-sm text-muted-foreground">
                      {row.contactNumber} · {new Date(row.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Select
                      value={row.status}
                      onValueChange={(value) =>
                        updateStatus.mutate({ id: row.id, next: value as Status })
                      }
                    >
                      <SelectTrigger className="w-52">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((item) => (
                          <SelectItem key={item} value={item}>
                            {statusLabel[item]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {target ? (
                      <Button asChild variant="outline" size="sm">
                        <a href={whatsappUrl(target, text)} target="_blank" rel="noreferrer">
                          <MessageCircle className="size-4" />{" "}
                          {doctorOrigin && row.doctor?.whatsappNumber
                            ? "Forward to doctor"
                            : "Forward to hospital"}
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
                {updateStatus.isError ? (
                  <p role="alert" className="mt-3 text-sm font-medium text-destructive">
                    {userFacingDataError(updateStatus.error)}
                  </p>
                ) : null}
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  {row.familyMemberName ? (
                    <div>
                      <dt className="font-semibold">Family member</dt>
                      <dd className="text-muted-foreground">{row.familyMemberName}</dd>
                    </div>
                  ) : null}
                  {row.doctor ? (
                    <div>
                      <dt className="font-semibold">Doctor</dt>
                      <dd className="text-muted-foreground">{row.doctor.name}</dd>
                    </div>
                  ) : null}
                  {row.department ? (
                    <div>
                      <dt className="font-semibold">Department</dt>
                      <dd className="text-muted-foreground">{row.department.name}</dd>
                    </div>
                  ) : null}
                  {row.service ? (
                    <div>
                      <dt className="font-semibold">Service</dt>
                      <dd className="text-muted-foreground">{row.service.title}</dd>
                    </div>
                  ) : null}
                  {row.preferredAt ? (
                    <div>
                      <dt className="font-semibold">Preferred time</dt>
                      <dd className="text-muted-foreground">
                        {new Date(row.preferredAt).toLocaleString()}
                      </dd>
                    </div>
                  ) : null}
                </dl>
                {row.message ? (
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{row.message}</p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
