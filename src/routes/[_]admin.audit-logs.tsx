import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/admin-shell";
import { DataTable, Pagination, SearchField, type Column } from "@/components/admin/ui";
import { createPageMeta } from "@/lib/seo";
import { listAuditLogs } from "@/lib/data/staff-repository";

export const Route = createFileRoute("/_admin/audit-logs")({
  head: () => ({
    meta: [
      ...createPageMeta("Audit logs", "A record of important staff actions."),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminAuditLogs,
});

const PAGE_SIZE = 25;

function AdminAuditLogs() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const logs = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: listAuditLogs,
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (logs.data ?? []).filter(
      (row) =>
        !term ||
        `${row.actorEmail ?? ""} ${row.action} ${row.summary ?? ""} ${row.entityTable ?? ""}`
          .toLowerCase()
          .includes(term),
    );
  }, [logs.data, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const columns: Column<(typeof filtered)[number]>[] = [
    { key: "when", header: "When", cell: (row) => new Date(row.createdAt).toLocaleString() },
    { key: "who", header: "Staff member", cell: (row) => row.actorEmail ?? "Unknown" },
    {
      key: "what",
      header: "Action",
      cell: (row) => row.summary ?? `${row.action} ${row.entityTable ?? ""}`,
    },
  ];

  return (
    <AdminShell
      title="Audit logs"
      description="A record of content and enquiry actions taken by staff."
      requires="audit.read"
    >
      <SearchField
        value={search}
        onChange={(next) => {
          setSearch(next);
          setPage(1);
        }}
        placeholder="Search activity"
      />
      <div className="mt-6">
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          isPending={logs.isPending}
          isError={logs.isError}
          emptyTitle="No recorded activity yet"
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
