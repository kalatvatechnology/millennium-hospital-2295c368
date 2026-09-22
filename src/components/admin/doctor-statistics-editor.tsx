/* eslint-disable @typescript-eslint/no-explicit-any */
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AdminError } from "@/components/admin/ui";
import { userFacingDataError } from "@/lib/data/errors";

const db = supabase as any;
const bucket = "doctor-profile-images";
const endpoint = "/api/public/doctor-profile-image";
const imageUrl = (path: string) => `${endpoint}?path=${encodeURIComponent(path)}`;
const managedPath = (value: string): string | null => {
  if (!value) return null;
  try {
    const parsed = new URL(value, "https://millennium.invalid");
    return parsed.pathname === endpoint ? parsed.searchParams.get("path") : null;
  } catch {
    return null;
  }
};

type Definition = {
  id: string;
  name: string;
  meaning: string;
  default_icon_url: string;
  active: boolean;
  isNew?: boolean;
};
type Assignment = {
  id: string;
  statistic_id: string;
  value: string;
  label: string;
  icon: string;
  icon_override_url: string;
  enabled: boolean;
  display_order: number;
};
export type DoctorStatisticsEditorHandle = { save: () => Promise<void>; reset: () => void };

export const DoctorStatisticsEditor = forwardRef<
  DoctorStatisticsEditorHandle,
  {
    doctorId: string;
    enabled: boolean;
    canWrite: boolean;
    onEnabledChange: (enabled: boolean) => void;
    onDirty?: () => void;
  }
>(function DoctorStatisticsEditor(
  { doctorId, enabled, canWrite, onEnabledChange, onDirty },
  ref,
) {
  const query = useQuery({
    queryKey: ["doctor-statistics-workspace", doctorId],
    queryFn: async () => {
      const [definitions, assignments] = await Promise.all([
        db.from("doctor_statistic_definitions").select("*").order("name"),
        db.from("doctor_statistics").select("*").eq("doctor_id", doctorId).order("display_order"),
      ]);
      if (definitions.error) throw definitions.error;
      if (assignments.error) throw assignments.error;
      return { definitions: definitions.data ?? [], assignments: assignments.data ?? [] };
    },
  });
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [baselineDefinitions, setBaselineDefinitions] = useState<Definition[]>([]);
  const [baselineAssignments, setBaselineAssignments] = useState<Assignment[]>([]);
  const [mode, setMode] = useState<"closed" | "existing" | "new">("closed");
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const uploadedPaths = useRef(new Set<string>());
  const removedPaths = useRef(new Set<string>());

  useEffect(() => {
    const nextDefinitions = (query.data?.definitions ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      meaning: row.meaning ?? "",
      default_icon_url: row.default_icon_url ?? "",
      active: row.active,
    }));
    const nextAssignments = (query.data?.assignments ?? []).map((row: any, index: number) => ({
      id: row.id,
      statistic_id: row.statistic_id ?? "",
      value: row.value ?? "",
      label: row.label ?? "",
      icon: row.icon ?? "",
      icon_override_url: row.icon_override_url ?? "",
      enabled: row.enabled !== false,
      display_order: index,
    }));
    setDefinitions(nextDefinitions);
    setAssignments(nextAssignments);
    setBaselineDefinitions(structuredClone(nextDefinitions));
    setBaselineAssignments(structuredClone(nextAssignments));
  }, [query.data]);

  const definitionFor = (row: Assignment) => definitions.find((item) => item.id === row.statistic_id);
  const markDirty = () => onDirty?.();
  const reset = () => {
    const paths = [...uploadedPaths.current];
    if (paths.length) void supabase.storage.from(bucket).remove(paths);
    uploadedPaths.current.clear();
    removedPaths.current.clear();
    setDefinitions(structuredClone(baselineDefinitions));
    setAssignments(structuredClone(baselineAssignments));
    setMode("closed");
    setEditing(null);
    setError(null);
  };
  useEffect(() => () => {
    const paths = [...uploadedPaths.current];
    if (paths.length) void supabase.storage.from(bucket).remove(paths);
  }, []);

  const save = async () => {
    setError(null);
    try {
      const idMap = new Map<string, string>();
      for (const definition of definitions) {
        if (!definition.name.trim()) throw new Error("Every statistic needs a name.");
        const payload = {
          name: definition.name.trim(),
          meaning: definition.meaning.trim() || null,
          default_icon_url: definition.default_icon_url || null,
          active: definition.active,
        };
        if (definition.isNew) {
          const { data, error: insertError } = await db
            .from("doctor_statistic_definitions")
            .insert(payload)
            .select("id")
            .single();
          if (insertError) throw insertError;
          idMap.set(definition.id, data.id);
        } else {
          const { error: updateError } = await db
            .from("doctor_statistic_definitions")
            .update(payload)
            .eq("id", definition.id);
          if (updateError) throw updateError;
        }
      }
      const original = query.data?.assignments ?? [];
      const removed = original.filter((row: any) => !assignments.some((item) => item.id === row.id));
      if (removed.length) {
        const { error: deleteError } = await db
          .from("doctor_statistics")
          .delete()
          .in("id", removed.map((row: any) => row.id));
        if (deleteError) throw deleteError;
      }
      for (const [index, row] of assignments.entries()) {
        const resolvedId = idMap.get(row.statistic_id) ?? row.statistic_id || null;
        const definition = definitions.find((item) => item.id === row.statistic_id);
        if (!row.value.trim()) throw new Error("Every assigned statistic needs a doctor value.");
        const payload = {
          doctor_id: doctorId,
          statistic_id: resolvedId,
          value: row.value.trim(),
          label: definition?.name ?? row.label,
          icon: definition?.default_icon_url || row.icon || null,
          icon_override_url: row.icon_override_url || null,
          enabled: row.enabled,
          display_order: index,
        };
        const command = row.id.startsWith("new-")
          ? db.from("doctor_statistics").insert(payload)
          : db.from("doctor_statistics").update(payload).eq("id", row.id);
        const { error: writeError } = await command;
        if (writeError) throw writeError;
      }
      const stale = [...removedPaths.current].filter((path) => !uploadedPaths.current.has(path));
      if (stale.length) {
        const { error: cleanupError } = await supabase.storage.from(bucket).remove(stale);
        if (cleanupError) throw cleanupError;
      }
      uploadedPaths.current.clear();
      removedPaths.current.clear();
      await query.refetch();
    } catch (cause) {
      setError(userFacingDataError(cause));
      throw cause;
    }
  };
  useImperativeHandle(ref, () => ({ save, reset }));

  const uploadIcon = async (
    file: File | undefined,
    current: string,
    apply: (url: string) => void,
    scope: "definition" | "override",
  ) => {
    if (!file) return;
    if (file.type !== "image/png") throw new Error("Statistic icons must be PNG files.");
    if (file.size > 1024 * 1024) throw new Error("Statistic icons must be 1 MB or smaller.");
    const path = `${crypto.randomUUID()}/statistic-${scope}.png`;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: "image/png", upsert: false });
    if (uploadError) throw uploadError;
    const next = imageUrl(path);
    const response = await fetch(next, { cache: "no-store" });
    if (!response.ok || response.headers.get("content-type")?.split(";", 1)[0] !== "image/png") {
      await supabase.storage.from(bucket).remove([path]);
      throw new Error("The uploaded PNG could not be verified.");
    }
    const previous = managedPath(current);
    if (previous) removedPaths.current.add(previous);
    uploadedPaths.current.add(path);
    apply(next);
    markDirty();
  };

  const filtered = useMemo(
    () => definitions.filter((item) => item.active && item.name.toLowerCase().includes(search.toLowerCase())),
    [definitions, search],
  );
  const assign = (definitionId: string) => {
    if (assignments.some((row) => row.statistic_id === definitionId)) {
      setError("This statistic is already assigned to this doctor.");
      return;
    }
    const id = `new-${crypto.randomUUID()}`;
    setAssignments((current) => [
      ...current,
      { id, statistic_id: definitionId, value: "", label: "", icon: "", icon_override_url: "", enabled: true, display_order: current.length },
    ]);
    setEditing(id);
    setMode("closed");
    markDirty();
  };
  const createDefinition = () => {
    const definitionId = `new-definition-${crypto.randomUUID()}`;
    const assignmentId = `new-${crypto.randomUUID()}`;
    setDefinitions((current) => [
      ...current,
      { id: definitionId, name: "", meaning: "", default_icon_url: "", active: true, isNew: true },
    ]);
    setAssignments((current) => [
      ...current,
      { id: assignmentId, statistic_id: definitionId, value: "", label: "", icon: "", icon_override_url: "", enabled: true, display_order: current.length },
    ]);
    setEditing(assignmentId);
    setMode("closed");
    markDirty();
  };
  const updateAssignment = (id: string, patch: Partial<Assignment>) => {
    setAssignments((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    markDirty();
  };
  const updateDefinition = (id: string, patch: Partial<Definition>) => {
    setDefinitions((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    markDirty();
  };
  const move = (index: number, delta: number) => {
    setAssignments((current) => {
      const target = index + delta;
      if (!current[index] || !current[target]) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((row, display_order) => ({ ...row, display_order }));
    });
    markDirty();
  };

  return (
    <section className="border-t border-border pt-6" aria-labelledby="statistics-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="statistics-heading" className="text-lg font-semibold">Statistics</h3>
          <p className="mt-1 text-sm text-muted-foreground">Reusable profile highlights with doctor-specific values.</p>
        </div>
        <label className="flex items-center gap-3 text-sm font-semibold">
          <span>{enabled ? "ON" : "OFF"}</span>
          <Switch checked={enabled} disabled={!canWrite} aria-label="Statistics section visibility" onCheckedChange={(checked) => { onEnabledChange(checked); markDirty(); }} />
        </label>
      </div>
      {!enabled ? null : (
        <div className="mt-5">
          <Button type="button" variant="outline" disabled={!canWrite} onClick={() => setMode(mode === "closed" ? "existing" : "closed")}>
            <Plus className="size-4" /> Add Statistic
          </Button>
          {mode !== "closed" ? (
            <div className="mt-4 grid gap-4 rounded-md border border-border p-4">
              <div className="flex gap-2" role="group" aria-label="Add statistic method">
                <Button type="button" size="sm" variant={mode === "existing" ? "default" : "outline"} onClick={() => setMode("existing")}>Use Existing</Button>
                <Button type="button" size="sm" variant={mode === "new" ? "default" : "outline"} onClick={() => setMode("new")}>Create New</Button>
              </div>
              {mode === "existing" ? (
                <>
                  <div className="relative max-w-md"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label="Search statistic library" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Statistic Library" /></div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {filtered.map((definition) => (
                      <Button key={definition.id} type="button" variant="outline" className="h-auto justify-start whitespace-normal py-3 text-left" onClick={() => assign(definition.id)}>{definition.name}</Button>
                    ))}
                  </div>
                </>
              ) : (
                <Button type="button" className="w-fit" onClick={createDefinition}>Create custom statistic</Button>
              )}
            </div>
          ) : null}
          <AdminError message={error} />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {assignments.map((row, index) => {
              const definition = definitionFor(row);
              const icon = row.icon_override_url || definition?.default_icon_url || row.icon;
              const isEditing = editing === row.id;
              return (
                <article key={row.id} className="min-w-0 rounded-md border border-border bg-background p-4">
                  {isEditing ? (
                    <div className="grid gap-4">
                      {definition?.isNew ? (
                        <><div><Label>Statistic Name</Label><Input className="mt-1" value={definition.name} onChange={(event) => updateDefinition(definition.id, { name: event.target.value })} /></div><div><Label>Meaning</Label><Textarea className="mt-1" value={definition.meaning} onChange={(event) => updateDefinition(definition.id, { meaning: event.target.value })} /></div></>
                      ) : null}
                      <IconUpload label="Default PNG Icon" value={definition?.default_icon_url ?? ""} onUpload={(file) => definition && uploadIcon(file, definition.default_icon_url, (url) => updateDefinition(definition.id, { default_icon_url: url }), "definition")} onRemove={() => definition && updateDefinition(definition.id, { default_icon_url: "" })} />
                      <div><Label>Doctor Value</Label><Input className="mt-1" value={row.value} onChange={(event) => updateAssignment(row.id, { value: event.target.value })} placeholder="e.g. 10+" /></div>
                      <IconUpload label="Use a different icon for this doctor" value={row.icon_override_url} onUpload={(file) => uploadIcon(file, row.icon_override_url, (url) => updateAssignment(row.id, { icon_override_url: url }), "override")} onRemove={() => updateAssignment(row.id, { icon_override_url: "" })} />
                      <Button type="button" size="sm" variant="outline" className="w-fit" onClick={() => setEditing(null)}>Done</Button>
                    </div>
                  ) : (
                    <div className="grid min-h-40 place-items-center text-center">
                      {icon ? <img src={icon} alt="" className="size-12 object-contain" /> : <div className="size-12 rounded-md border border-dashed border-border" aria-hidden="true" />}
                      <div><strong className="block text-2xl text-primary">{row.value || "Value"}</strong><span className="mt-1 block text-sm font-medium">{definition?.name || row.label || "Statistic"}</span></div>
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-1 border-t border-border pt-3">
                    <Switch checked={row.enabled} aria-label={`${definition?.name ?? row.label} enabled`} onCheckedChange={(checked) => updateAssignment(row.id, { enabled: checked })} />
                    <span className="mr-auto text-xs text-muted-foreground">{row.enabled ? "Enabled" : "Disabled"}</span>
                    <Button type="button" size="icon" variant="ghost" aria-label="Move statistic up" disabled={index === 0} onClick={() => move(index, -1)}><ChevronUp className="size-4" /></Button>
                    <Button type="button" size="icon" variant="ghost" aria-label="Move statistic down" disabled={index === assignments.length - 1} onClick={() => move(index, 1)}><ChevronDown className="size-4" /></Button>
                    <Button type="button" size="icon" variant="ghost" aria-label="Edit statistic assignment" onClick={() => setEditing(isEditing ? null : row.id)}><Pencil className="size-4" /></Button>
                    <Button type="button" size="icon" variant="ghost" aria-label="Remove statistic assignment" onClick={() => { setAssignments((current) => current.filter((item) => item.id !== row.id)); markDirty(); }}><Trash2 className="size-4" /></Button>
                  </div>
                </article>
              );
            })}
          </div>
          {!assignments.length ? <p className="mt-5 text-sm text-muted-foreground">No statistics assigned to this doctor.</p> : null}
        </div>
      )}
    </section>
  );
});

function IconUpload({ label, value, onUpload, onRemove }: { label: string; value: string; onUpload: (file?: File) => Promise<void>; onRemove: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return <div><Label>{label}</Label><p className="mt-1 text-xs text-muted-foreground">Recommended: 512 × 512 px transparent PNG. Maximum 1 MB.</p>{value ? <img src={value} alt={`${label} preview`} className="mt-2 size-16 rounded-md border border-border object-contain p-1" /> : null}<input ref={input} type="file" accept="image/png" className="sr-only" onChange={(event) => { setBusy(true); setError(null); void onUpload(event.target.files?.[0]).catch((cause) => setError(userFacingDataError(cause))).finally(() => { setBusy(false); if (input.current) input.current.value = ""; }); }} /><div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => input.current?.click()}><Upload className="size-4" /> {busy ? "Uploading…" : value ? "Replace PNG" : "Upload PNG"}</Button>{value ? <Button type="button" size="sm" variant="ghost" onClick={onRemove}>Remove</Button> : null}</div>{error ? <p className="mt-1 text-sm text-destructive" role="alert">{error}</p> : null}</div>;
}
