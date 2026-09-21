/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminError, ConfirmDialog, DataTable, FilterSelect, Pagination, SearchField, StatusBadge, type Column } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { useAdminSession } from "@/hooks/use-admin-session";
import { contentTypeByKey, deleteRecord, listRecords } from "@/lib/admin-content";
import { userFacingDataError } from "@/lib/data/errors";

const type = contentTypeByKey("doctors");
const PAGE_SIZE = 20;
const statusOf = (row: Record<string, any>) => row["published"] ? "published" : "draft";

export function DoctorList() {
  const queryClient = useQueryClient();
  const { can } = useAdminSession();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canWrite = can("content.write");
  const records = useQuery({
    queryKey: ["admin-content", "doctors"],
    queryFn: () => {
      if (!type) throw new Error("Doctor content configuration is unavailable");
      return listRecords(type);
    },
  });
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (records.data ?? []).filter((row) => {
      const haystack = `${row["name"] ?? row["full_name"] ?? ""} ${row["specialty"] ?? row["specialization"] ?? ""}`.toLowerCase();
      if (term && !haystack.includes(term)) return false;
      return status === "all" || statusOf(row) === status;
    });
  }, [records.data, search, status]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const remove = useMutation({
    mutationFn: async (row: Record<string, any>) => {
      if (!type) throw new Error("Doctor content configuration is unavailable");
      await deleteRecord(type, row["id"], row["name"] ?? row["full_name"]);
    },
    onSuccess: () => {
      setPendingDelete(null);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-content", "doctors"] });
    },
    onError: (cause: Error) => setError(userFacingDataError(cause)),
  });
  const columns: Column<Record<string, any>>[] = [
    { key: "doctor", header: "Doctor", cell: (row) => <div><p className="font-medium">{row["name"] ?? row["full_name"] ?? "Untitled"}</p><p className="text-sm text-muted-foreground">{row["specialty"] ?? row["specialization"] ?? "—"}</p></div> },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={statusOf(row)} tone={row["published"] ? "positive" : "neutral"} /> },
    { key: "actions", header: "Actions", className: "text-right", cell: (row) => canWrite ? <div className="flex justify-end gap-2"><Button asChild size="sm" variant="outline"><Link to="/_admin/doctors/$doctorId/$section" params={{ doctorId: row["id"], section: "profile" }}><Pencil className="size-4" /> Edit</Link></Button><Button size="icon" variant="outline" aria-label={`Delete ${row["name"] ?? "doctor"}`} onClick={() => setPendingDelete(row)}><Trash2 className="size-4" /></Button></div> : <span className="text-sm text-muted-foreground">View only</span> },
  ];
  return <AdminShell title="Doctors" description="Authoritative doctor profiles. Doctors submit change requests instead of editing these records directly." requires="content.read" actions={canWrite ? <Button asChild><Link to="/_admin/doctors/$doctorId/$section" params={{ doctorId: "new", section: "profile" }}><Plus className="size-4" /> New doctor</Link></Button> : null}>
    <div className="flex flex-wrap items-end gap-4"><SearchField value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search doctors" /><FilterSelect label="Status" value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={[{ value: "all", label: "All" }, { value: "published", label: "Published" }, { value: "draft", label: "Unpublished" }]} /></div>
    <AdminError message={error} />
    <div className="mt-6"><DataTable rows={rows} columns={columns} getRowId={(row) => row["id"]} isPending={records.isPending} isError={records.isError} emptyTitle="No doctors found" emptyDescription="Add the first doctor using the button above." /><Pagination page={currentPage} pageCount={pageCount} total={filtered.length} onPageChange={setPage} /></div>
    <ConfirmDialog open={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null); }} title="Delete this doctor?" description="This permanently removes the doctor and related profile content. This cannot be undone." onConfirm={() => { if (pendingDelete) remove.mutate(pendingDelete); }} />
  </AdminShell>;
}
