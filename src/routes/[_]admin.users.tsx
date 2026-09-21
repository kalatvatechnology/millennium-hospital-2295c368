import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminError, DataTable, FormModal, Pagination, SearchField, StatusBadge, type Column } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { logAction } from "@/lib/audit";
import { ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS, type Role } from "@/lib/permissions";
import { createPageMeta } from "@/lib/seo";
import { backendFeatures } from "@/lib/data/backend";
import { AdminFeatureUnavailable } from "@/components/admin/feature-unavailable";

export const Route = createFileRoute("/_admin/users")({
  head: () => ({ meta: [...createPageMeta("Users and roles", "Manage staff accounts and their roles."), { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminUsers,
});

const PAGE_SIZE = 20;

type ProfileRow = { id: string; full_name: string | null; email: string | null; doctor_id: string | null; active: boolean };

function AdminUsers() {
  if (!backendFeatures.profiles) return <AdminFeatureUnavailable title="Users and roles" />;
  return <AvailableUsers />;
}

function AvailableUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<{ profile: ProfileRow; roles: Role[]; doctorId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const profiles = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error: queryError } = await supabase.from("profiles").select("id, full_name, email, doctor_id, active").order("created_at");
      if (queryError) throw new Error(queryError.message);
      return (data ?? []) as ProfileRow[];
    },
  });

  const roleRows = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error: queryError } = await supabase.from("user_roles").select("user_id, role");
      if (queryError) throw new Error(queryError.message);
      return data ?? [];
    },
  });

  const doctors = useQuery({
    queryKey: ["admin-users-doctors"],
    queryFn: async () => {
      const { data, error: queryError } = await supabase.from("doctors").select("id, name").order("name");
      if (queryError) throw new Error(queryError.message);
      return data ?? [];
    },
  });

  const rolesByUser = useMemo(() => {
    const map = new Map<string, Role[]>();
    for (const row of roleRows.data ?? []) {
      const list = map.get(row.user_id) ?? [];
      list.push(row.role as Role);
      map.set(row.user_id, list);
    }
    return map;
  }, [roleRows.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (profiles.data ?? []).filter((row) => !term || `${row.full_name ?? ""} ${row.email ?? ""}`.toLowerCase().includes(term));
  }, [profiles.data, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const save = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const userId = editing.profile.id;
      const existing = rolesByUser.get(userId) ?? [];
      const toAdd = editing.roles.filter((role) => !existing.includes(role));
      const toRemove = existing.filter((role) => !editing.roles.includes(role));
      if (toRemove.length) {
        const { error: removeError } = await (supabase as any).from("user_roles").delete().eq("user_id", userId).in("role", toRemove);
        if (removeError) throw new Error(removeError.message);
      }
      if (toAdd.length) {
        const { error: addError } = await (supabase as any).from("user_roles").insert(toAdd.map((role) => ({ user_id: userId, role })));
        if (addError) throw new Error(addError.message);
      }
      const { error: profileError } = await supabase.from("profiles").update({ doctor_id: editing.doctorId || null }).eq("id", userId);
      if (profileError) throw new Error(profileError.message);
      await logAction({ action: "roles_updated", entityTable: "user_roles", entityId: userId, summary: `Updated roles for ${editing.profile.email ?? userId}: ${editing.roles.join(", ") || "none"}` });
    },
    onSuccess: () => {
      setEditing(null);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const columns: Column<ProfileRow>[] = [
    {
      key: "person",
      header: "Staff member",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.full_name ?? "No name recorded"}</p>
          <p className="text-sm text-muted-foreground">{row.email ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "roles",
      header: "Roles",
      cell: (row) => {
        const list = rolesByUser.get(row.id) ?? [];
        return list.length ? (
          <div className="flex flex-wrap gap-1">
            {list.map((role) => (
              <StatusBadge key={role} status={ROLE_LABELS[role]} tone="positive" />
            ))}
          </div>
        ) : (
          <StatusBadge status="no access" tone="critical" />
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (row) => (
        <Button size="sm" variant="outline" onClick={() => setEditing({ profile: row, roles: rolesByUser.get(row.id) ?? [], doctorId: row.doctor_id ?? "" })}>
          Manage access
        </Button>
      ),
    },
  ];

  return (
    <AdminShell title="Users and roles" description="Grant and remove staff access. Only super admins can change roles." requires="users.manage">
      <SearchField value={search} onChange={(next) => { setSearch(next); setPage(1); }} placeholder="Search staff" />
      <AdminError message={error} />
      <div className="mt-6">
        <DataTable rows={rows} columns={columns} getRowId={(row) => row.id} isPending={profiles.isPending} isError={profiles.isError} emptyTitle="No staff accounts yet" emptyDescription="Accounts appear here once someone signs in for the first time." />
        <Pagination page={currentPage} pageCount={pageCount} total={filtered.length} onPageChange={setPage} />
      </div>

      <FormModal
        open={editing !== null}
        onOpenChange={(open) => (open ? null : setEditing(null))}
        title="Manage access"
        description={editing?.profile.email ?? ""}
        busy={save.isPending}
        onSubmit={() => save.mutate()}
      >
        <fieldset className="grid gap-3">
          <legend className="text-sm font-medium">Roles</legend>
          {ROLES.map((role) => (
            <label key={role} className="flex items-start gap-3">
              <Checkbox
                checked={editing?.roles.includes(role) ?? false}
                onCheckedChange={(checked) =>
                  setEditing((current) =>
                    current ? { ...current, roles: checked === true ? [...current.roles, role] : current.roles.filter((item) => item !== role) } : current,
                  )
                }
              />
              <span>
                <span className="font-medium">{ROLE_LABELS[role]}</span>
                <span className="block text-sm text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <div>
          <Label>Linked doctor profile</Label>
          <Select value={editing?.doctorId || "none"} onValueChange={(next) => setEditing((current) => (current ? { ...current, doctorId: next === "none" ? "" : next } : current))}>
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
      </FormModal>
    </AdminShell>
  );
}
