/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
  const imageFields = type.fields.filter((field) => field.type === "image");
  const cleanupImages = async (paths: (string | null)[]) => {
    const targets = paths.filter((path): path is string => Boolean(path));
    if (!targets.length) return;
    const { error: cleanupError } = await supabase.storage.from(imageBucket).remove(targets);
    if (cleanupError) console.error("Department image cleanup failed", { paths: targets, cleanupError });
  };
  const save = useMutation({
    mutationFn: () =>
      saveRecord(type, isNew ? null : recordId, contentPayload(type, values, canPublish)),
    onSuccess: async () => {
      // Only after the database update succeeded: remove the exact file this record used before.
      await cleanupImages(
        imageFields.map((field) =>
          values[field.name] !== baseline[field.name] ? managedImagePath(field, baseline[field.name]) : null,
        ),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-content", type.table] }),
        queryClient.invalidateQueries({ queryKey: ["admin-content-record", type.table, recordId] }),
        queryClient.invalidateQueries({ queryKey: [type.table] }),
      ]);
      toast.success(`${type.singular.charAt(0).toUpperCase()}${type.singular.slice(1)} saved successfully.`);
      void navigate({ to: returnTo });
    },
    onError: (cause: Error) => {
      type ErrLike = { code?: string; message?: string; details?: string };
      const raw = cause as Error & ErrLike & { cause?: ErrLike; originalError?: ErrLike };
      const inner = raw.originalError ?? raw.cause;
      const code = raw.code ?? inner?.code;
      const text = `${raw.message ?? ""} ${inner?.message ?? ""} ${inner?.details ?? ""}`;
      const duplicateSlug =
        type.key === "departments" && (code === "23505" || /duplicate key/i.test(text)) && /slug/i.test(text);
      setError(
        duplicateSlug
          ? "This web address is already being used by another department. Please choose a different one."
          : userFacingDataError(cause),
      );
    },
  });
  const remove = useMutation({
    mutationFn: () => deleteRecord(type, recordId, String(values[type.titleField] ?? "")),
    onSuccess: async () => {
      // Only after the record is deleted: remove its saved image and any unsaved upload.
      await cleanupImages(
        imageFields.flatMap((field) => [
          managedImagePath(field, baseline[field.name]),
          values[field.name] !== baseline[field.name] ? managedImagePath(field, values[field.name]) : null,
        ]),
      );
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
              description={
                type.key === "departments"
                  ? "Delete this department? Doctors, services and other records linked to it may be affected. If linked records prevent deletion, you'll see a message and nothing will be removed. This cannot be undone."
                  : "This permanently removes the record and cannot be undone."
              }
              busy={remove.isPending}
              onConfirm={() => remove.mutate()}
            />
          ) : null}
          <WorkspaceSaveBar
            busy={save.isPending}
            disabled={record.isPending}
            onCancel={() => {
              // Discard unsaved uploads (never the saved image).
              void cleanupImages(
                imageFields.map((field) =>
                  values[field.name] !== baseline[field.name] ? managedImagePath(field, values[field.name]) : null,
                ),
              );
              setValues(structuredClone(baseline));
              setError(null);
              if (isNew) void navigate({ to: returnTo });
            }}
            onSave={() => {
              for (const field of type.fields) {
                const raw = String(values[field.name] ?? "");
                if (field.required && !raw.trim()) return setError(`${field.label} is required.`);
                if (field.maxLength && raw.length > field.maxLength)
                  return setError(`${field.label} must be ${field.maxLength} characters or fewer.`);
                const message = raw ? field.validate?.(raw) : null;
                if (message) return setError(message);
              }
              setError(null);
              save.mutate();
            }}
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
  if (field.type === "image") return <ImageFieldControl field={field} value={value} onChange={onChange} />;
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
          className={field.maxLength ? "mt-2 min-h-24" : "mt-2 min-h-36"}
          aria-describedby={field.help ? `${id}-help` : undefined}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          id={id}
          required={field.required}
          type={field.type === "number" ? "number" : "text"}
          className="mt-2"
          placeholder={field.placeholder}
          aria-describedby={field.help ? `${id}-help` : undefined}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {field.help || field.maxLength ? (
        <div className="mt-1 flex justify-between gap-3 text-xs text-muted-foreground">
          <p id={`${id}-help`}>{field.help}</p>
          {field.maxLength ? (
            <span
              aria-live="polite"
              className={String(value ?? "").length > field.maxLength ? "shrink-0 text-destructive" : "shrink-0"}
            >
              {String(value ?? "").length}/{field.maxLength}
            </span>
          ) : null}
        </div>
      ) : null}
      {field.validate && value ? (
        <p className="mt-1 text-xs text-destructive">{field.validate(String(value))}</p>
      ) : null}
    </div>
  );
}

const imageBucket = "doctor-profile-images";
const imageEndpoint = "/api/public/doctor-profile-image";
function managedImagePath(field: Field, value: unknown): string | null {
  if (!value || typeof value !== "string") return null;
  try {
    const parsed = new URL(value, "https://millennium.invalid");
    if (parsed.pathname !== imageEndpoint) return null;
    const path = parsed.searchParams.get("path");
    const folder = field.imageFolder ?? "content";
    return path && path.startsWith(`${folder}/`) && !path.includes("..") ? path : null;
  } catch {
    return null;
  }
}
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageBytes = 5 * 1024 * 1024;

function ImageFieldControl({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: any;
  onChange: (value: any) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);
  const current = String(value ?? "");
  const id = `content-${field.name}`;

  const upload = async (file?: File) => {
    if (!file) return;
    if (!allowedImageTypes.includes(file.type)) return setMessage("Please upload a JPG, PNG, or WebP image.");
    if (file.size > maxImageBytes) return setMessage("Image is too large. Please upload a smaller image (up to 5 MB).");
    setMessage(null);
    setBusy(true);
    try {
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${field.imageFolder ?? "content"}/${crypto.randomUUID()}/card.${extension}`;
      const { error } = await supabase.storage
        .from(imageBucket)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const url = `${imageEndpoint}?path=${encodeURIComponent(path)}`;
      const check = await fetch(url, { cache: "no-store" });
      if (!check.ok) {
        await supabase.storage.from(imageBucket).remove([path]);
        throw new Error("The uploaded image could not be verified.");
      }
      setBroken(false);
      onChange(url);
    } catch (cause) {
      setMessage(userFacingDataError(cause as Error));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="lg:col-span-2">
      <Label htmlFor={id}>{field.label}</Label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => void upload(event.target.files?.[0])}
      />
      {current && !broken ? (
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end">
          <img
            src={current}
            alt="Department card preview"
            onError={() => setBroken(true)}
            className="aspect-[3/2] w-full max-w-sm rounded-md border border-border object-cover"
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
              <Upload className="size-4" /> {busy ? "Uploading…" : "Replace image"}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => onChange("")}>
              <Trash2 className="size-4" /> Remove image
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void upload(event.dataTransfer.files?.[0]);
          }}
          className="mt-2 flex aspect-[3/2] w-full max-w-sm flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-surface text-sm text-muted-foreground hover:border-primary/40"
        >
          <ImagePlus className="size-6 text-primary" />
          {busy ? "Uploading…" : broken ? "Saved image could not load — upload a new one" : "Click or drop an image to upload"}
        </button>
      )}
      {field.help ? <p className="mt-1 text-xs text-muted-foreground">{field.help}</p> : null}
      {message ? <p role="alert" className="mt-1 text-xs text-destructive">{message}</p> : null}
    </div>
  );
}
