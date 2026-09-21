/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminError } from "@/components/admin/ui";
import {
  InlineDelete,
  WorkspaceLayout,
  WorkspaceSaveBar,
  WorkspaceSection,
} from "@/components/admin/workspace";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAdminSession } from "@/hooks/use-admin-session";
import {
  contentFormValues,
  contentPayload,
  contentTypeByKey,
  deleteRecord,
  emptyContentValues,
  getRecord,
  saveRecord,
  type Field,
} from "@/lib/admin-content";
import { userFacingDataError } from "@/lib/data/errors";
import { createPageMeta } from "@/lib/seo";

export const Route = createFileRoute("/_admin/content/$contentType/$recordId")({
  head: () => ({
    meta: [
      ...createPageMeta("Content workspace", "Create or edit website content."),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ContentWorkspace,
});

const listRoutes = {
  departments: "/_admin/departments",
  "professional-services": "/_admin/professional-services",
  "hospital-services": "/_admin/hospital-services",
  facilities: "/_admin/facilities",
  locations: "/_admin/locations",
  media: "/_admin/media",
  "faq-categories": "/_admin/faq-categories",
  faqs: "/_admin/faqs",
  reviews: "/_admin/reviews",
  pages: "/_admin/pages",
  navigation: "/_admin/navigation",
} as const;

function ContentWorkspace() {
  const { contentType, recordId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = useAdminSession();
  const type = contentTypeByKey(contentType);
  if (!type || contentType === "doctors") throw notFound();
  const returnTo = listRoutes[contentType as keyof typeof listRoutes];
  if (!returnTo) throw notFound();
  const isNew = recordId === "new";
  const canPublish = can("content.publish");
  const [values, setValues] = useState<Record<string, any>>(() => emptyContentValues(type));
  const [baseline, setBaseline] = useState<Record<string, any>>(() => emptyContentValues(type));
  const [error, setError] = useState<string | null>(null);
  const record = useQuery({
    queryKey: ["admin-content-record", type.table, recordId],
    enabled: !isNew,
    queryFn: async () => {
      return getRecord(type, recordId);
    },
  });
  useEffect(() => {
    const next = isNew
      ? emptyContentValues(type)
      : record.data
        ? contentFormValues(type, record.data)
        : null;
    if (next) {
      setValues(next);
      setBaseline(structuredClone(next));
    }
  }, [isNew, record.data, type]);
  const save = useMutation({
    mutationFn: () =>
      saveRecord(type, isNew ? null : recordId, contentPayload(type, values, canPublish)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-content", type.table] }),
        queryClient.invalidateQueries({ queryKey: ["admin-content-record", type.table, recordId] }),
      ]);
      void navigate({ to: returnTo });
    },
    onError: (cause: Error) => setError(userFacingDataError(cause)),
  });
  const remove = useMutation({
    mutationFn: () => deleteRecord(type, recordId, String(values[type.titleField] ?? "")),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-content", type.table] }),
        queryClient.invalidateQueries({ queryKey: ["admin-content-record", type.table, recordId] }),
      ]);
      void navigate({ to: returnTo });
    },
    onError: (cause: Error) => setError(userFacingDataError(cause)),
  });
  return (
    <AdminShell
      title={isNew ? `New ${type.singular}` : `Edit ${type.singular}`}
      description={type.description}
      requires="content.write"
    >
      <WorkspaceLayout backLink={<Link to={returnTo}>Back to {type.label}</Link>}>
        <WorkspaceSection
          title="Content"
          description="Changes remain here until you save. Cancel restores the last saved version."
        >
          {record.isPending && !isNew ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {type.fields
                .filter((field) => !(field.publishControl && !canPublish))
                .map((field) => (
                  <FieldControl
                    key={field.name}
                    field={field}
                    value={values[field.name]}
                    onChange={(value) =>
                      setValues((current) => ({ ...current, [field.name]: value }))
                    }
                  />
                ))}
            </div>
          )}
          <AdminError message={error} />
          {!isNew ? (
            <InlineDelete
              label={type.singular}
              description="This permanently removes the record and cannot be undone."
              busy={remove.isPending}
              onConfirm={() => remove.mutate()}
            />
          ) : null}
          <WorkspaceSaveBar
            busy={save.isPending}
            disabled={record.isPending}
            onCancel={() => {
              setValues(structuredClone(baseline));
              setError(null);
              if (isNew) void navigate({ to: returnTo });
            }}
            onSave={() => save.mutate()}
          />
        </WorkspaceSection>
      </WorkspaceLayout>
    </AdminShell>
  );
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: any;
  onChange: (value: any) => void;
}) {
  const id = `content-${field.name}`;
  if (field.type === "boolean")
    return (
      <label className="flex items-center gap-3 border border-border p-4 lg:col-span-2">
        <Checkbox
          id={id}
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(checked === true)}
        />
        <span className="font-medium">{field.label}</span>
      </label>
    );
  if (field.type === "select")
    return (
      <div>
        <Label htmlFor={id}>{field.label}</Label>
        <Select value={String(value ?? "")} onValueChange={onChange}>
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
  return (
    <div className={field.type === "textarea" ? "lg:col-span-2" : ""}>
      <Label htmlFor={id}>{field.label}</Label>
      {field.type === "textarea" ? (
        <Textarea
          id={id}
          required={field.required}
          className="mt-2 min-h-36"
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          id={id}
          required={field.required}
          type={field.type === "number" ? "number" : "text"}
          className="mt-2"
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}
