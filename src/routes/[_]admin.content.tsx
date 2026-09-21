/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/page";
import { contentTypes, deleteRecord, listRecords, saveRecord, type ContentType, type Field } from "@/lib/admin-content";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/_admin/content")({
  head: () => ({
    meta: [...createPageMeta("Content", "Manage hospital website content."), { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminContent,
});

function emptyValues(type: ContentType) {
  const values: Record<string, any> = {};
  for (const field of type.fields) {
    values[field.name] = field.type === "boolean" ? false : field.type === "list" ? "" : "";
  }
  return values;
}

function toFormValues(type: ContentType, row: Record<string, any>) {
  const values: Record<string, any> = {};
  for (const field of type.fields) {
    const raw = row[field.name];
    values[field.name] = field.type === "list" ? (Array.isArray(raw) ? raw.join(", ") : "") : field.type === "boolean" ? Boolean(raw) : raw ?? "";
  }
  return values;
}

function toPayload(type: ContentType, values: Record<string, any>) {
  const payload: Record<string, any> = {};
  for (const field of type.fields) {
    const raw = values[field.name];
    if (field.type === "list") payload[field.name] = String(raw).split(",").map((item) => item.trim()).filter(Boolean);
    else if (field.type === "boolean") payload[field.name] = Boolean(raw);
    else if (field.type === "number") payload[field.name] = raw === "" || raw === null ? null : Number(raw);
    else payload[field.name] = raw === "" ? null : raw;
  }
  return payload;
}

function FieldInput({ field, value, onChange }: { field: Field; value: any; onChange: (next: any) => void }) {
  const id = `field-${field.name}`;
  if (field.type === "boolean") {
    return (
      <div className="flex items-center gap-3">
        <Checkbox id={id} checked={Boolean(value)} onCheckedChange={(checked) => onChange(checked === true)} />
        <Label htmlFor={id}>{field.label}</Label>
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

function AdminContent() {
  const queryClient = useQueryClient();
  const [type, setType] = useState<ContentType>(contentTypes[0] as ContentType);
  const [editing, setEditing] = useState<{ id: string | null; values: Record<string, any> } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const records = useQuery({ queryKey: ["admin-content", type.table], queryFn: () => listRecords(type) });

  const save = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      await saveRecord(type, editing.id, toPayload(type, editing.values));
    },
    onSuccess: () => {
      setEditing(null);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["admin-content", type.table] });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteRecord(type, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-content", type.table] }),
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  return (
    <AdminShell title="Content" description="Create, update and remove website content.">
      <div className="flex flex-wrap gap-2">
        {contentTypes.map((item) => (
          <Button
            key={item.table}
            size="sm"
            variant={item.table === type.table ? "default" : "outline"}
            onClick={() => {
              setType(item);
              setEditing(null);
              setError(null);
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => setEditing({ id: null, values: emptyValues(type) })}><Plus className="size-4" /> New {type.label.toLowerCase()}</Button>
      </div>

      {error ? <p role="alert" className="mt-4 text-sm font-medium text-destructive">{error}</p> : null}

      {editing ? (
        <form
          className="mt-6 grid gap-5 border border-border bg-background p-6"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <h2 className="text-xl font-semibold">{editing.id ? "Edit record" : "New record"}</h2>
          {type.fields.map((field) => (
            <FieldInput
              key={field.name}
              field={field}
              value={editing.values[field.name]}
              onChange={(next) => setEditing({ ...editing, values: { ...editing.values, [field.name]: next } })}
            />
          ))}
          <div className="flex gap-3">
            <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </form>
      ) : null}

      {records.isPending ? (
        <LoadingState />
      ) : records.isError ? (
        <ErrorState />
      ) : (records.data ?? []).length === 0 ? (
        <EmptyState title={`No ${type.label.toLowerCase()} yet`} description="Add the first record using the button above." />
      ) : (
        <div className="mt-6 grid gap-px border border-border bg-border">
          {(records.data ?? []).map((row) => (
            <div key={row["id"]} className="flex flex-wrap items-center justify-between gap-4 bg-background p-4">
              <div>
                <p className="font-medium">{row[type.titleField] ?? "Untitled"}</p>
                <p className="text-sm text-muted-foreground">
                  {"published" in row ? (row["published"] ? "Published" : "Not published") : row["show_publicly"] ? "Shown publicly" : "Hidden"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing({ id: row["id"], values: toFormValues(type, row) })}>
                  <Pencil className="size-4" /> Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => remove.mutate(row["id"])}>
                  <Trash2 className="size-4" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
