/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminError, ConfirmDialog, DataTable, FilterSelect, FormModal, Pagination, SearchField, StatusBadge, type Column } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminSession } from "@/hooks/use-admin-session";
import { deleteRecord, listRecords, saveRecord, type ContentType, type Field } from "@/lib/admin-content";
import { AdminFeatureUnavailable } from "@/components/admin/feature-unavailable";
import { userFacingDataError } from "@/lib/data/errors";

const PAGE_SIZE = 20;

function emptyValues(type: ContentType) {
  const values: Record<string, any> = {};
  for (const field of type.fields) {
    values[field.name] = field.type === "boolean" ? false : field.type === "select" ? (field.options?.[0]?.value ?? "") : "";
  }
  return values;
}

function toFormValues(type: ContentType, row: Record<string, any>) {
  const values: Record<string, any> = {};
  for (const field of type.fields) {
    const raw = row[field.name];
    values[field.name] =
      field.type === "list" ? (Array.isArray(raw) ? raw.join(", ") : "") : field.type === "boolean" ? Boolean(raw) : (raw ?? "");
  }
  return values;
}

function toPayload(type: ContentType, values: Record<string, any>, canPublish: boolean) {
  const payload: Record<string, any> = {};
  for (const field of type.fields) {
    if (field.publishControl && !canPublish) continue;
    const raw = values[field.name];
    if (field.type === "list") payload[field.name] = String(raw).split(",").map((item) => item.trim()).filter(Boolean);
    else if (field.type === "boolean") payload[field.name] = Boolean(raw);
    else if (field.type === "number") {
      if (raw === "" || raw === null) continue;
      payload[field.name] = Number(raw);
    }
    else payload[field.name] = raw === "" ? null : raw;
  }
  return payload;
}

function FieldInput({ field, value, onChange, disabled }: { field: Field; value: any; onChange: (next: any) => void; disabled?: boolean }) {
  const id = `field-${field.name}`;
  if (field.type === "boolean") {
    return (
      <div className="flex items-center gap-3">
        <Checkbox id={id} disabled={disabled} checked={Boolean(value)} onCheckedChange={(checked) => onChange(checked === true)} />
        <Label htmlFor={id}>{field.label}</Label>
      </div>
    );
  }
  if (field.type === "select") {
    return (
      <div>
        <Label htmlFor={id}>{field.label}</Label>
        <Select value={String(value ?? "")} onValueChange={onChange} disabled={disabled ?? false}>
          <SelectTrigger id={id} className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
  return (
    <div>
      <Label htmlFor={id}>{field.label}</Label>
      {field.type === "textarea" ? (
        <Textarea id={id} value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-28" />
      ) : (
        <Input
          id={id}
          type={field.type === "number" ? "number" : "text"}
          required={field.required}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2"
        />
      )}
    </div>
  );
}

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
  const queryClient = useQueryClient();
  const { can } = useAdminSession();
  const canWrite = can("content.write");
  const canPublish = can("content.publish");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<{ id: string | null; values: Record<string, any> } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const records = useQuery({ queryKey: ["admin-content", type.table], queryFn: () => listRecords(type) });

  const filtered = useMemo(() => {
    const rows = records.data ?? [];
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const haystack = `${row[type.titleField] ?? ""} ${type.subtitleField ? (row[type.subtitleField] ?? "") : ""}`.toLowerCase();
      if (term && !haystack.includes(term)) return false;
      if (status === "all") return true;
      const rowStatus = statusOf(row);
      return status === "published" ? rowStatus === "published" || rowStatus === "shown publicly" : rowStatus !== "published" && rowStatus !== "shown publicly";
    });
  }, [records.data, search, status, type]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-content", type.table] });

  const save = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      await saveRecord(type, editing.id, toPayload(type, editing.values, canPublish));
    },
    onSuccess: () => {
      setEditing(null);
      setError(null);
      void invalidate();
    },
    onError: (mutationError: Error) => setError(userFacingDataError(mutationError)),
  });

  const remove = useMutation({
    mutationFn: async (row: Record<string, any>) => deleteRecord(type, row["id"], row[type.titleField]),
    onSuccess: () => {
      setPendingDelete(null);
      setError(null);
      void invalidate();
    },
    onError: (mutationError: Error) => setError(userFacingDataError(mutationError)),
  });

  const columns: Column<Record<string, any>>[] = [
    {
      key: "title",
      header: type.label,
      cell: (row) => (
        <div>
          <p className="font-medium">{row[type.titleField] ?? "Untitled"}</p>
          {type.subtitleField ? <p className="text-sm text-muted-foreground">{row[type.subtitleField] ?? "—"}</p> : null}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => {
        const value = statusOf(row);
        return <StatusBadge status={value} tone={value === "published" || value === "shown publicly" ? "positive" : "neutral"} />;
      },
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (row) =>
        canWrite ? (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing({ id: row["id"], values: toFormValues(type, row) })}>
              <Pencil className="size-4" /> Edit
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPendingDelete(row)}>
              <Trash2 className="size-4" /> Delete
            </Button>
          </div>
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
          <Button onClick={() => setEditing({ id: null, values: emptyValues(type) })}>
            <Plus className="size-4" /> New {type.singular}
          </Button>
        ) : null
      }
    >
      <div className="flex flex-wrap items-end gap-4">
        <SearchField value={search} onChange={(next) => { setSearch(next); setPage(1); }} placeholder={`Search ${type.label.toLowerCase()}`} />
        <FilterSelect
          label="Status"
          value={status}
          onChange={(next) => { setStatus(next); setPage(1); }}
          options={[
            { value: "all", label: "All" },
            { value: "published", label: "Published / visible" },
            { value: "unpublished", label: "Not published" },
          ]}
        />
      </div>

      <AdminError message={error} />
      {!canPublish && canWrite ? (
        <p className="mt-4 text-sm text-muted-foreground">Your role can draft and edit content, but publishing is done by an editor or admin.</p>
      ) : null}

      <div className="mt-6">
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(row) => row["id"]}
          isPending={records.isPending}
          isError={records.isError}
          emptyTitle={`No ${type.label.toLowerCase()} found`}
          emptyDescription={canWrite ? "Add the first record using the button above." : "Nothing has been added yet."}
        />
        <Pagination page={currentPage} pageCount={pageCount} total={filtered.length} onPageChange={setPage} />
      </div>

      <FormModal
        open={editing !== null}
        onOpenChange={(open) => (open ? null : setEditing(null))}
        title={editing?.id ? `Edit ${type.singular}` : `New ${type.singular}`}
        description={type.description}
        busy={save.isPending}
        onSubmit={() => save.mutate()}
      >
        {type.fields
          .filter((field) => !(field.publishControl && !canPublish))
          .map((field) => (
            <FieldInput
              key={field.name}
              field={field}
              value={editing?.values[field.name]}
              onChange={(next) => setEditing((current) => (current ? { ...current, values: { ...current.values, [field.name]: next } } : current))}
            />
          ))}
      </FormModal>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => (open ? null : setPendingDelete(null))}
        title={`Delete this ${type.singular}?`}
        description="This permanently removes the record from the website. This cannot be undone."
        onConfirm={() => pendingDelete && remove.mutate(pendingDelete)}
      />
    </AdminShell>
  );
}
