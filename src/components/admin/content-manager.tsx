/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ImageOff, Pencil, Plus } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  DataTable,
  FilterSelect,
  Pagination,
  SearchField,
  StatusBadge,
  type Column,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { useAdminSession } from "@/hooks/use-admin-session";
import { listRecords, type ContentType } from "@/lib/admin-content";
import { AdminFeatureUnavailable } from "@/components/admin/feature-unavailable";

const PAGE_SIZE = 20;

function statusOf(row: Record<string, any>) {
  if (typeof row["status"] === "string") return row["status"] as string;
  if ("published" in row) return row["published"] ? "published" : "draft";
  if ("show_publicly" in row) return row["show_publicly"] ? "shown publicly" : "hidden";
  return "—";
}

export function ContentManager({ type }: { type: ContentType }) {
  if (type.available === false) return <AdminFeatureUnavailable title={type.label} />;
  return <AvailableContentManager type={type} />;
}

function AvailableContentManager({ type }: { type: ContentType }) {
  const { can } = useAdminSession();
  const canWrite = can("content.write");
  const canPublish = can("content.publish");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const records = useQuery({
    queryKey: ["admin-content", type.table],
    queryFn: () => listRecords(type),
  });

  const filtered = useMemo(() => {
    const rows = records.data ?? [];
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const haystack =
        `${row[type.titleField] ?? ""} ${type.subtitleField ? (row[type.subtitleField] ?? "") : ""} ${row["short_description"] ?? ""}`.toLowerCase();
      if (term && !haystack.includes(term)) return false;
      if (status === "all") return true;
      const rowStatus = statusOf(row);
      return status === "published"
        ? rowStatus === "published" || rowStatus === "shown publicly"
        : rowStatus !== "published" && rowStatus !== "shown publicly";
    });
  }, [records.data, search, status, type]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const columns: Column<Record<string, any>>[] = [
    {
      key: "title",
      header: type.label,
      cell: (row) =>
        type.key === "departments" ? (
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-[72px] shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-surface">
              {row["card_image_url"] ? (
                <img src={row["card_image_url"]} alt="" className="size-full object-cover" loading="lazy" />
              ) : (
                <ImageOff className="size-4 text-muted-foreground" aria-label="No image" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium">{row[type.titleField] ?? "Untitled"}</p>
              <p className="line-clamp-1 max-w-md text-sm text-muted-foreground">
                {row["short_description"] || "No short description yet"}
              </p>
            </div>
          </div>
        ) : (
          <div>
            <p className="font-medium">{row[type.titleField] ?? "Untitled"}</p>
            {type.subtitleField ? (
              <p className="text-sm text-muted-foreground">{row[type.subtitleField] ?? "—"}</p>
            ) : null}
          </div>
        ),
    },
    ...(type.key === "departments"
      ? [{ key: "order", header: "Order", cell: (row: Record<string, any>) => <span className="tabular-nums">{row["display_order"] ?? "—"}</span> }]
      : []),
    {
      key: "status",
      header: "Status",
      cell: (row) => {
        const value = statusOf(row);
        return (
          <StatusBadge
            status={value}
            tone={value === "published" || value === "shown publicly" ? "positive" : "neutral"}
          />
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (row) =>
        canWrite ? (
          <Button asChild size="sm" variant="outline">
            <Link
              to={
                type.key === "doctors"
                  ? "/_admin/doctors/$doctorId/$section"
                  : "/_admin/content/$contentType/$recordId"
              }
              params={
                type.key === "doctors"
                  ? { doctorId: String(row["id"]), section: "profile" }
                  : { contentType: type.key, recordId: String(row["id"]) }
              }
            >
              <Pencil className="size-4" /> Edit
            </Link>
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">View only</span>
        ),
    },
  ];

  return (
    <AdminShell
      title={type.label}
      description={type.description}
      requires="content.read"
      actions={
        canWrite ? (
          type.key === "doctors" ? (
            <Button asChild>
              <Link
                to="/_admin/doctors/$doctorId/$section"
                params={{ doctorId: "new", section: "profile" }}
              >
                <Plus className="size-4" /> New {type.singular}
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link
                to="/_admin/content/$contentType/$recordId"
                params={{ contentType: type.key, recordId: "new" }}
              >
                <Plus className="size-4" /> {type.key === "departments" ? "Add Department" : `New ${type.singular}`}
              </Link>
            </Button>
          )
        ) : null
      }
    >
      <div className="flex flex-wrap items-end gap-4">
        <SearchField
          value={search}
          onChange={(next) => {
            setSearch(next);
            setPage(1);
          }}
          placeholder={`Search ${type.label.toLowerCase()}`}
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={(next) => {
            setStatus(next);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All" },
            { value: "published", label: "Published / visible" },
            { value: "unpublished", label: "Not published" },
          ]}
        />
      </div>

      {!canPublish && canWrite ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Your role can draft and edit content, but publishing is done by an editor or admin.
        </p>
      ) : null}

      <div className="mt-6">
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(row) => row["id"]}
          isPending={records.isPending}
          isError={records.isError}
          emptyTitle={`No ${type.label.toLowerCase()} found`}
          emptyDescription={
            canWrite
              ? "Add the first record using the button above."
              : "Nothing has been added yet."
          }
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
