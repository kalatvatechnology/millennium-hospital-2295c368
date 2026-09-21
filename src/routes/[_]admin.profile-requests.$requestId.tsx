import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminError } from "@/components/admin/ui";
import { WorkspaceLayout, WorkspaceSaveBar, WorkspaceSection } from "@/components/admin/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminSession } from "@/hooks/use-admin-session";
import { supabase } from "@/integrations/supabase/client";
import { logAction } from "@/lib/audit";
import { userFacingDataError } from "@/lib/data/errors";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/_admin/profile-requests/$requestId")({
  head: () => ({
    meta: [
      ...createPageMeta("Profile request workspace", "Create or review a doctor profile request."),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RequestWorkspace,
});
const fields: { name: string; label: string; long?: boolean }[] = [
  { name: "designation", label: "Designation" },
  { name: "specialty", label: "Specialty" },
  { name: "photo_url", label: "Photo URL" },
  { name: "whatsapp_number", label: "WhatsApp number" },
  { name: "bio", label: "Biography", long: true },
];
function RequestWorkspace() {
  const { requestId } = Route.useParams();
  const isNew = requestId === "new";
  const { profile, can, session } = useAdminSession();
  const canReview = can("content.write");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const request = useQuery({
    queryKey: ["admin-profile-request", requestId],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctor_profile_change_requests")
        .select("id,doctor_id,changes,note,status,review_note,created_at,doctors(name)")
        .eq("id", requestId)
        .single();
      if (error) throw error;
      return data;
    },
  });
  const [changes, setChanges] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((field) => [field.name, ""])),
  );
  const [note, setNote] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!request.data) return;
    setChanges(
      Object.fromEntries(
        Object.entries((request.data.changes ?? {}) as Record<string, unknown>).map(
          ([key, value]) => [key, String(value ?? "")],
        ),
      ),
    );
    setNote(request.data.note ?? "");
    setReviewNote(request.data.review_note ?? "");
  }, [request.data]);
  const submit = useMutation({
    mutationFn: async () => {
      if (!profile?.doctor_id || !session)
        throw new Error("Your account is not linked to a doctor profile.");
      const clean = Object.fromEntries(Object.entries(changes).filter(([, value]) => value.trim()));
      const { error: insertError } = await supabase.from("doctor_profile_change_requests").insert({
        doctor_id: profile.doctor_id,
        requested_by: session.user.id,
        changes: clean,
        note: note || null,
      });
      if (insertError) throw insertError;
      await logAction({
        action: "profile_change_requested",
        entityTable: "doctors",
        entityId: profile.doctor_id,
        summary: "Doctor requested a profile change",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-profile-requests"] });
      void navigate({ to: "/_admin/profile-requests" });
    },
    onError: (cause: Error) => setError(userFacingDataError(cause)),
  });
  const decide = useMutation({
    mutationFn: async (approve: boolean) => {
      const row = request.data;
      if (!row || !session) throw new Error("Request not found.");
      if (approve) {
        const { error: doctorError } = await supabase
          .from("doctors")
          .update(row.changes as never)
          .eq("id", row.doctor_id);
        if (doctorError) throw doctorError;
      }
      const { error: statusError } = await supabase
        .from("doctor_profile_change_requests")
        .update({
          status: approve ? "approved" : "rejected",
          review_note: reviewNote || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: session.user.id,
        })
        .eq("id", requestId);
      if (statusError) throw statusError;
      await logAction({
        action: approve ? "profile_change_approved" : "profile_change_rejected",
        entityTable: "doctors",
        entityId: row.doctor_id,
        summary: `Profile change request ${approve ? "approved" : "rejected"}`,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-profile-requests"] });
      void navigate({ to: "/_admin/profile-requests" });
    },
    onError: (cause: Error) => setError(userFacingDataError(cause)),
  });
  const readOnly = !isNew;
  return (
    <AdminShell
      title={isNew ? "Request a profile change" : "Review profile change"}
      description={
        isNew
          ? "Only completed fields will be submitted for review."
          : (request.data?.doctors?.name ?? "Doctor request")
      }
      requires={["content.write", "profile.request"]}
    >
      <WorkspaceLayout backLink={<Link to="/_admin/profile-requests">All profile requests</Link>}>
        <WorkspaceSection
          title={isNew ? "Requested changes" : "Request details"}
          description="Doctor requests never change the authoritative profile until approved by content staff."
        >
          <AdminError message={error} />
          {fields.map((field) => (
            <div key={field.name}>
              <Label htmlFor={`request-${field.name}`}>{field.label}</Label>
              {field.long ? (
                <Textarea
                  id={`request-${field.name}`}
                  className="mt-2"
                  readOnly={readOnly}
                  value={changes[field.name] ?? ""}
                  onChange={(event) =>
                    setChanges((current) => ({ ...current, [field.name]: event.target.value }))
                  }
                />
              ) : (
                <Input
                  id={`request-${field.name}`}
                  className="mt-2"
                  readOnly={readOnly}
                  value={changes[field.name] ?? ""}
                  onChange={(event) =>
                    setChanges((current) => ({ ...current, [field.name]: event.target.value }))
                  }
                />
              )}
            </div>
          ))}
          <div>
            <Label htmlFor="request-note">{isNew ? "Note for the team" : "Doctor note"}</Label>
            <Textarea
              id="request-note"
              className="mt-2"
              readOnly={readOnly}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
          {!isNew ? (
            <div>
              <Label htmlFor="review-note">Review note</Label>
              <Textarea
                id="review-note"
                className="mt-2"
                readOnly={!canReview || request.data?.status !== "pending"}
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
              />
            </div>
          ) : null}
          {isNew ? (
            <WorkspaceSaveBar
              busy={submit.isPending}
              disabled={!profile?.doctor_id}
              onCancel={() => navigate({ to: "/_admin/profile-requests" })}
              onSave={() => submit.mutate()}
            />
          ) : canReview && request.data?.status === "pending" ? (
            <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5">
              <Button
                variant="outline"
                disabled={decide.isPending}
                onClick={() => decide.mutate(false)}
              >
                Reject request
              </Button>
              <Button disabled={decide.isPending} onClick={() => decide.mutate(true)}>
                Approve and apply
              </Button>
            </div>
          ) : null}
        </WorkspaceSection>
      </WorkspaceLayout>
    </AdminShell>
  );
}
