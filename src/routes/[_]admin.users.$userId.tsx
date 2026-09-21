import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminError } from "@/components/admin/ui";
import { WorkspaceLayout, WorkspaceSaveBar, WorkspaceSection } from "@/components/admin/workspace";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { backendFeatures, usesProductionContract } from "@/lib/data/backend";
import { userFacingDataError } from "@/lib/data/errors";
import {
  listStaffDoctorOptions,
  listStaffUsers,
  updateStaffUser,
} from "@/lib/data/staff-repository";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type Role } from "@/lib/permissions";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/_admin/users/$userId")({
  head: () => ({
    meta: [
      ...createPageMeta("Manage staff access", "Manage one staff account."),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: UserWorkspace,
});
const roles: Role[] = ["super_admin", "admin", "front_desk", "doctor", "writer", "editor"];
function UserWorkspace() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const users = useQuery({ queryKey: ["admin-profiles"], queryFn: listStaffUsers });
  const doctors = useQuery({ queryKey: ["admin-users-doctors"], queryFn: listStaffDoctorOptions });
  const user = users.data?.find((item) => item.id === userId);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [baseline, setBaseline] = useState({ roles: [] as Role[], doctorId: "" });
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    const next = { roles: [...user.roles], doctorId: user.doctorId ?? "" };
    setSelectedRoles(next.roles);
    setDoctorId(next.doctorId);
    setBaseline(next);
  }, [user]);
  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Staff account was not found.");
      await updateStaffUser({ ...user, roles: selectedRoles, doctorId: doctorId || null });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      void navigate({ to: "/_admin/users" });
    },
    onError: (cause: Error) => setError(userFacingDataError(cause)),
  });
  if (!backendFeatures.userManagement)
    return (
      <AdminShell title="Users and roles" requires="users.manage">
        <p>This backend does not support user management.</p>
      </AdminShell>
    );
  return (
    <AdminShell
      title="Manage staff access"
      description={user?.email ?? userId}
      requires="users.manage"
    >
      <WorkspaceLayout backLink={<Link to="/_admin/users">All staff accounts</Link>}>
        <WorkspaceSection
          title="Roles"
          description="Role enforcement remains on the database. Changes are applied only when you save."
        >
          <AdminError message={error} />
          {users.isPending ? (
            <p>Loading…</p>
          ) : !user ? (
            <p>This staff account was not found.</p>
          ) : (
            <>
              <fieldset className="grid gap-3">
                {roles.map((role) => (
                  <label key={role} className="flex items-start gap-3 border border-border p-4">
                    <Checkbox
                      checked={selectedRoles.includes(role)}
                      onCheckedChange={(checked) =>
                        setSelectedRoles((current) =>
                          checked === true
                            ? [...new Set([...current, role])]
                            : current.filter((item) => item !== role),
                        )
                      }
                    />
                    <span>
                      <span className="font-medium">{ROLE_LABELS[role]}</span>
                      <span className="block text-sm text-muted-foreground">
                        {ROLE_DESCRIPTIONS[role]}
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>
              {selectedRoles.includes("admin") ? (
                <p className="border border-warning bg-warning/20 p-4 text-sm">
                  Delegated per-module Admin responsibilities require an approved backend permission
                  model and remain unavailable.
                </p>
              ) : null}
              {!usesProductionContract ? (
                <div>
                  <Label>Linked doctor profile</Label>
                  <Select
                    value={doctorId || "none"}
                    onValueChange={(value) => setDoctorId(value === "none" ? "" : value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not linked</SelectItem>
                      {(doctors.data ?? []).map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <WorkspaceSaveBar
                busy={save.isPending}
                onCancel={() => {
                  setSelectedRoles([...baseline.roles]);
                  setDoctorId(baseline.doctorId);
                  setError(null);
                }}
                onSave={() => save.mutate()}
              />
            </>
          )}
        </WorkspaceSection>
      </WorkspaceLayout>
    </AdminShell>
  );
}
