import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  DataTable,
  Pagination,
  SearchField,
  StatusBadge,
  type Column,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, type Role } from "@/lib/permissions";
import { createPageMeta } from "@/lib/seo";
import { backendFeatures, usesProductionContract } from "@/lib/data/backend";
import { AdminFeatureUnavailable } from "@/components/admin/feature-unavailable";
import { listStaffUsers } from "@/lib/data/staff-repository";
import type { StaffProfile } from "@/lib/data/models";

export const Route = createFileRoute("/_admin/users")({
  head: () => ({
    meta: [
      ...createPageMeta("Users and roles", "Manage staff accounts and their roles."),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminUsers,
});

const PAGE_SIZE = 20;
function AdminUsers() {
  if (!backendFeatures.userManagement) return <AdminFeatureUnavailable title="Users and roles" />;
  return <AvailableUsers />;
}

function AvailableUsers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const profiles = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: listStaffUsers,
  });

  const rolesByUser = useMemo(() => {
    const map = new Map<string, Role[]>();
    for (const row of profiles.data ?? []) map.set(row.id, row.roles);
    return map;
  }, [profiles.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (profiles.data ?? []).filter(
      (row) =>
        !term || `${row.fullName ?? ""} ${row.email ?? ""} ${row.id}`.toLowerCase().includes(term),
    );
  }, [profiles.data, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const columns: Column<StaffProfile>[] = [
    {
      key: "person",
      header: "Staff member",
      cell: (row) => (
        <div>
          <p className="font-medium">
            {row.fullName ?? (usesProductionContract ? "Staff account" : "No name recorded")}
          </p>
          <p className="text-sm text-muted-foreground">{row.email ?? row.id}</p>
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
        <Button asChild size="sm" variant="outline">
          <Link to="/_admin/users/$userId" params={{ userId: row.id }}>
            Manage access
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <AdminShell
      title="Users and roles"
      description="Grant and remove staff access. Only super admins can change roles."
      requires="users.manage"
    >
      <div className="flex flex-wrap items-end gap-4">
        <SearchField
          value={search}
          onChange={(next) => {
            setSearch(next);
            setPage(1);
          }}
          placeholder="Search staff"
        />
      </div>
      <div className="mt-6">
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          isPending={profiles.isPending}
          isError={profiles.isError}
          emptyTitle="No staff accounts yet"
          emptyDescription="Accounts appear here once someone signs in for the first time."
        />
        <Pagination
          page={currentPage}
          pageCount={pageCount}
          total={filtered.length}
          onPageChange={setPage}
        />
      </div>
    </AdminShell>
  );
}
