import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminError, DataTable, FormModal, StatusBadge, type Column } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/page";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSession } from "@/hooks/use-admin-session";
import { logAction } from "@/lib/audit";
import { createPageMeta } from "@/lib/seo";
import { backendFeatures } from "@/lib/data/backend";
import { AdminFeatureUnavailable } from "@/components/admin/feature-unavailable";

export const Route = createFileRoute("/_admin/profile-requests")({
  head: () => ({ meta: [...createPageMeta("Profile change requests", "Doctor requests to update their published profile."), { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminProfileRequests,
});

const requestFields = [
  { name: "designation", label: "Designation" },
  { name: "specialty", label: "Specialty" },
  { name: "photo_url", label: "Photo URL" },
  { name: "whatsapp_number", label: "WhatsApp number" },
  { name: "bio", label: "Biography", long: true },
] as { name: string; label: string; long?: boolean }[];

function AdminProfileRequests() {
  if (!backendFeatures.profileRequests) return <AdminFeatureUnavailable title="Profile change requests" />;
  return <AvailableProfileRequests />;
}

function AvailableProfileRequests() {
  const queryClient = useQueryClient();
  const { profile, can, session } = useAdminSession();
  const canReview = can("content.write");
  const [drafting, setDrafting] = useState<Record<string, string> | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const requests = useQuery({
    queryKey: ["admin-profile-requests"],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("doctor_profile_change_requests")
        .select("id, doctor_id, changes, note, status, review_note, created_at, doctors(name)")
        .order("created_at", { ascending: false });
      if (queryError) throw new Error(queryError.message);
      return data ?? [];
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!drafting || !profile?.doctor_id || !session) return;
      const changes = Object.fromEntries(Object.entries(drafting).filter(([, value]) => value.trim() !== ""));
      const { error: insertError } = await supabase.from("doctor_profile_change_requests").insert({
        doctor_id: profile.doctor_id,
        requested_by: session.user.id,
        changes: changes as never,
        note: note || null,
      });
      if (insertError) throw new Error(insertError.message);
      await logAction({ action: "profile_change_requested", entityTable: "doctors", entityId: profile.doctor_id, summary: "Doctor requested a profile change" });
    },
    onSuccess: () => {
      setDrafting(null);
      setNote("");
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-profile-requests"] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const decide = useMutation({
    mutationFn: async ({ id, doctorId, changes, approve }: { id: string; doctorId: string; changes: Record<string, unknown>; approve: boolean }) => {
      if (approve) {
        const { error: updateError } = await supabase.from("doctors").update(changes as never).eq("id", doctorId);
        if (updateError) throw new Error(updateError.message);
      }
      const { error: statusError } = await supabase
        .from("doctor_profile_change_requests")
        .update({ status: approve ? "approved" : "rejected", reviewed_at: new Date().toISOString(), reviewed_by: session?.user.id ?? null })
        .eq("id", id);
      if (statusError) throw new Error(statusError.message);
      await logAction({ action: approve ? "profile_change_approved" : "profile_change_rejected", entityTable: "doctors", entityId: doctorId, summary: `Profile change request ${approve ? "approved" : "rejected"}` });
    },
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-profile-requests"] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const columns: Column<(typeof requests)["data"] extends (infer T)[] | undefined ? T : never>[] = [
    {
      key: "doctor",
      header: "Doctor",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.doctors?.name ?? "Unknown doctor"}</p>
          <p className="text-sm text-muted-foreground">{new Date(row.created_at).toLocaleString()}</p>
        </div>
      ),
    },
    {
      key: "changes",
      header: "Requested changes",
      cell: (row) => (
        <div className="max-w-md space-y-1 text-sm">
          {Object.entries((row.changes ?? {}) as Record<string, unknown>).map(([key, value]) => (
            <p key={key}>
              <span className="font-medium">{key.replace(/_/g, " ")}:</span> {String(value)}
            </p>
          ))}
          {row.note ? <p className="text-muted-foreground">Note: {row.note}</p> : null}
        </div>
      ),
    },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} tone={row.status === "approved" ? "positive" : row.status === "rejected" ? "critical" : "warning"} /> },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (row) =>
        canReview && row.status === "pending" ? (
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => decide.mutate({ id: row.id, doctorId: row.doctor_id, changes: (row.changes ?? {}) as Record<string, unknown>, approve: true })}>
              Approve &amp; apply
            </Button>
            <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: row.id, doctorId: row.doctor_id, changes: {}, approve: false })}>
              Reject
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <AdminShell
      title="Profile change requests"
      description="Doctors request changes here. Only content staff can apply them to the published profile."
      requires={["content.write", "profile.request"]}
      actions={
        profile?.doctor_id ? (
          <Button onClick={() => setDrafting(Object.fromEntries(requestFields.map((field) => [field.name, ""])))}>Request a change</Button>
        ) : null
      }
    >
      <AdminError message={error} />
      {!profile?.doctor_id && !canReview ? (
        <EmptyState title="Nothing to show" description="Your account is not linked to a doctor profile." />
      ) : (
        <DataTable
          rows={requests.data ?? []}
          columns={columns}
          getRowId={(row) => row.id}
          isPending={requests.isPending}
          isError={requests.isError}
          emptyTitle="No change requests"
          emptyDescription="Requests from doctors will appear here."
        />
      )}

      <FormModal
        open={drafting !== null}
        onOpenChange={(open) => (open ? null : setDrafting(null))}
        title="Request a profile change"
        description="Fill in only what should change. A member of content staff will review it before it appears on the website."
        submitLabel="Send request"
        busy={submit.isPending}
        onSubmit={() => submit.mutate()}
      >
        {requestFields.map((field) => (
          <div key={field.name}>
            <Label htmlFor={`request-${field.name}`}>{field.label}</Label>
            {field.long === true ? (
              <Textarea id={`request-${field.name}`} value={drafting?.[field.name] ?? ""} onChange={(event) => setDrafting((current) => (current ? { ...current, [field.name]: event.target.value } : current))} className="mt-2" />
            ) : (
              <Input id={`request-${field.name}`} value={drafting?.[field.name] ?? ""} onChange={(event) => setDrafting((current) => (current ? { ...current, [field.name]: event.target.value } : current))} className="mt-2" />
            )}
          </div>
        ))}
        <div>
          <Label htmlFor="request-note">Note for the team</Label>
          <Textarea id="request-note" value={note} onChange={(event) => setNote(event.target.value)} className="mt-2" />
        </div>
      </FormModal>
    </AdminShell>
  );
}
