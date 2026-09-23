/* eslint-disable @typescript-eslint/no-explicit-any */
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { AdminError } from "@/components/admin/ui";
import { userFacingDataError } from "@/lib/data/errors";

const db = supabase as any;
type Row = {
  id?: string;
  doctor_id?: string | null;
  enabled?: boolean;
  display_order?: number;
  is_present?: boolean;
  end_year?: number | string | null;
  consultation_availability?: string | null;
  public_name?: string | null;
  map_url?: string | null;
  show_on_profile?: boolean;
  author_name?: string;
  content?: string;
  [key: string]: any;
};
type Field = { name: string; label: string; multiline?: boolean; type?: "number" | "boolean" };
type Section = { table: string; title: string; fields: Field[] };

const specializationsSection: Section = {
  table: "doctor_specializations",
  title: "Specializations",
  fields: [
    { name: "title", label: "Title" },
    { name: "description", label: "Description", multiline: true },
    { name: "icon", label: "Icon" },
  ],
};
const experienceSection: Section = {
  table: "doctor_experience",
  title: "Experience",
  fields: [
    { name: "position", label: "Position" },
    { name: "organization", label: "Organization" },
    { name: "start_year", label: "Start year", type: "number" },
    { name: "end_year", label: "End year", type: "number" },
    { name: "is_present", label: "Currently working here", type: "boolean" },
    { name: "description", label: "Description", multiline: true },
  ],
};
const educationSection: Section = {
  table: "doctor_education",
  title: "Education",
  fields: [
    { name: "qualification", label: "Qualification" },
    { name: "institution", label: "Institution" },
    { name: "year", label: "Year", type: "number" },
    { name: "description", label: "Description", multiline: true },

  ],
};
const achievementsSection: Section = {
  table: "doctor_achievements",
  title: "Achievements & memberships",
  fields: [
    { name: "title", label: "Title" },
    { name: "achievement_type", label: "Type" },
    { name: "organization", label: "Organization" },
    { name: "year", label: "Year", type: "number" },
    { name: "description", label: "Description", multiline: true },
  ],
};

const visibilityLabels: Record<string, string> = {
  statistics: "Statistics",
  quote: "Quote",
  specializations: "Specializations",
  services: "Professional services",
  experience: "Experience",
  education: "Education",
  achievements: "Achievements & memberships",
  locations: "Locations",
  media: "Videos & media",
  reviews: "Patient reviews",
  faqs: "FAQs",
};

type Relationship = {
  key: string;
  source: string;
  link: string;
  sourceId: string;
  label: string;
  text: string;
  controls?: (
    | "enabled"
    | "display_order"
    | "consultation_availability"
    | "show_on_profile"
    | "public_name"
    | "map_url"
  )[];
};
const servicesRelationship: Relationship = {
  key: "services",
  source: "professional_services",
  link: "professional_service_doctors",
  sourceId: "professional_service_id",
  label: "Professional services",
  text: "title",
};
const locationsRelationship: Relationship = {
  key: "locations",
  source: "locations",
  link: "doctor_locations",
  sourceId: "location_id",
  label: "Locations",
  text: "name",
  controls: ["enabled", "display_order", "consultation_availability", "public_name", "map_url"],
};
const mediaRelationship: Relationship = {
  key: "media",
  source: "media_items",
  link: "media_doctors",
  sourceId: "media_id",
  label: "Media",
  text: "title",
  controls: ["enabled", "show_on_profile", "display_order"],
};
const faqsRelationship: Relationship = {
  key: "faqs",
  source: "faqs",
  link: "doctor_faqs",
  sourceId: "faq_id",
  label: "FAQs",
  text: "question",
  controls: ["enabled", "display_order"],
};

export type DoctorProfileSectionsHandle = { save: () => Promise<void> };
export type DoctorProfileTab =
  | "specializations"
  | "services"
  | "experience"
  | "education"
  | "achievements"
  | "locations"
  | "media"
  | "reviews"
  | "faqs";

export const DoctorProfileSections = forwardRef<
  DoctorProfileSectionsHandle,
  { doctorId: string; activeTab: DoctorProfileTab }
>(function DoctorProfileSections({ doctorId, activeTab }, ref) {
  const editors = useMemo(() => new Map<string, () => Promise<void>>(), []);
  useImperativeHandle(
    ref,
    () => ({
      save: async () => {
        for (const save of editors.values()) await save();
      },
    }),
    [editors],
  );
  return (
    <div className="grid gap-6">
      <div hidden={activeTab !== "specializations"}>
        <SectionEditor
          doctorId={doctorId}
          section={specializationsSection}
          register={(save) => {
            editors.set("doctor_specializations", save);
          }}
        />
      </div>
      <div hidden={activeTab !== "services"}>
        <RelationshipGroup
          doctorId={doctorId}
          relation={servicesRelationship}
          register={(save) => {
            editors.set("services", save);
          }}
        />
      </div>
      <div hidden={activeTab !== "experience"}>
        <SectionEditor
          doctorId={doctorId}
          section={experienceSection}
          register={(save) => {
            editors.set("doctor_experience", save);
          }}
        />
      </div>
      <div hidden={activeTab !== "education"}>
        <SectionEditor
          doctorId={doctorId}
          section={educationSection}
          register={(save) => {
            editors.set("doctor_education", save);
          }}
        />
      </div>
      <div hidden={activeTab !== "achievements"}>
        <SectionEditor
          doctorId={doctorId}
          section={achievementsSection}
          register={(save) => {
            editors.set("doctor_achievements", save);
          }}
        />
      </div>
      <div hidden={activeTab !== "locations"}>
        <RelationshipGroup
          doctorId={doctorId}
          relation={locationsRelationship}
          register={(save) => {
            editors.set("locations", save);
          }}
        />
      </div>
      <div hidden={activeTab !== "media"}>
        <RelationshipGroup
          doctorId={doctorId}
          relation={mediaRelationship}
          register={(save) => {
            editors.set("media", save);
          }}
        />
      </div>
      <div hidden={activeTab !== "reviews"}>
        <ReviewSelector
          doctorId={doctorId}
          register={(save) => {
            editors.set("reviews", save);
          }}
        />
      </div>
      <div hidden={activeTab !== "faqs"}>
        <RelationshipGroup
          doctorId={doctorId}
          relation={faqsRelationship}
          register={(save) => {
            editors.set("faqs", save);
          }}
        />
      </div>
    </div>
  );
});

function normalizeRow(row: Row, index: number) {
  return { ...row, enabled: row.enabled !== false, display_order: index };
}
function SectionEditor({
  doctorId,
  section,
  register,
}: {
  doctorId: string;
  section: Section;
  register: (save: () => Promise<void>) => void;
}) {
  const query = useQuery({
    queryKey: ["doctor-profile-section", section.table, doctorId],
    queryFn: async () => {
      const { data, error } = await db
        .from(section.table)
        .select("*")
        .eq("doctor_id", doctorId)
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });
  const [rows, setRows] = useState<Row[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Row | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setRows((query.data ?? []).map(normalizeRow)), [query.data]);
  const save = async () => {
    setError(null);
    try {
      const original = query.data ?? [];
      const removed = original
        .filter((old: Row) => !rows.some((row) => row.id === old.id))
        .map((row: Row) => row.id)
        .filter(Boolean);
      if (removed.length) {
        const { error: deleteError } = await db.from(section.table).delete().in("id", removed);
        if (deleteError) throw deleteError;
      }
      for (const [index, row] of rows.entries()) {
        const payload: Record<string, any> = {
          doctor_id: doctorId,
          enabled: row.enabled !== false,
          display_order: index,
        };
        section.fields.forEach((field) => {
          let value = row[field.name];
          if (field.type === "number") value = value === "" || value == null ? null : Number(value);
          payload[field.name] = value === "" ? null : value;
        });
        if (section.table === "doctor_experience" && payload["is_present"])
          payload["end_year"] = null;
        const command = String(row.id).startsWith("new-")
          ? db.from(section.table).insert(payload)
          : db.from(section.table).update(payload).eq("id", row.id);
        const { error: writeError } = await command;
        if (writeError) throw writeError;
      }
    } catch (cause) {
      setError(userFacingDataError(cause));
      throw cause;
    }
  };
  useEffect(() => {
    register(save);
  });
  const add = () => {
    const id = `new-${crypto.randomUUID()}`;
    const row: Row = { id, enabled: true, display_order: rows.length };
    section.fields.forEach((field) => (row[field.name] = field.type === "boolean" ? false : ""));
    setRows((current) => [...current, row]);
    setEditingId(id);
  };
  const move = (index: number, delta: number) =>
    setRows((current) => {
      const target = index + delta;
      const sourceRow = current[index];
      const targetRow = current[target];
      if (!sourceRow || !targetRow) return current;
      const next = [...current];
      next[index] = targetRow;
      next[target] = sourceRow;
      return next.map(normalizeRow);
    });
  const previewRow = rows.find((row) => row.id === editingId) ?? rows[0];
  return (
    <section className="rounded-md border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{section.title}</h3>
        <Button type="button" size="sm" variant="outline" onClick={add}>
          <Plus className="size-4" /> Add
        </Button>
      </div>
      <AdminError message={error} />
      <div className="mt-4 grid gap-3">
        {rows.map((row, index) => (
          <div key={row.id} className="rounded-md bg-secondary p-3">
            {editingId === row.id ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <div key={field.name} className={field.multiline ? "sm:col-span-2" : ""}>
                    {field.type === "boolean" ? (
                      <label className="flex items-center gap-3 text-sm font-medium">
                        <Checkbox
                          checked={Boolean(row[field.name])}
                          onCheckedChange={(checked) =>
                            setRows((current) =>
                              current.map((item) =>
                                item.id === row.id
                                  ? {
                                      ...item,
                                      [field.name]: checked === true,
                                      ...(field.name === "is_present" && checked
                                        ? { end_year: "" }
                                        : {}),
                                    }
                                  : item,
                              ),
                            )
                          }
                        />
                        {field.label}
                      </label>
                    ) : (
                      <>
                        <Label htmlFor={`${row.id}-${field.name}`}>{field.label}</Label>
                        {field.multiline ? (
                          <Textarea
                            id={`${row.id}-${field.name}`}
                            className="mt-1"
                            value={row[field.name] ?? ""}
                            onChange={(event) =>
                              setRows((current) =>
                                current.map((item) =>
                                  item.id === row.id
                                    ? { ...item, [field.name]: event.target.value }
                                    : item,
                                ),
                              )
                            }
                          />
                        ) : (
                          <Input
                            id={`${row.id}-${field.name}`}
                            className="mt-1"
                            type={field.type === "number" ? "number" : "text"}
                            disabled={field.name === "end_year" && row.is_present}
                            value={row[field.name] ?? ""}
                            onChange={(event) =>
                              setRows((current) =>
                                current.map((item) =>
                                  item.id === row.id
                                    ? { ...item, [field.name]: event.target.value }
                                    : item,
                                ),
                              )
                            }
                          />
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium">
                {String(row[section.fields[0]?.name ?? "id"] || "Untitled")}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="mr-auto flex items-center gap-2 text-sm">
                <Switch
                  checked={row.enabled !== false}
                  onCheckedChange={(checked) =>
                    setRows((current) =>
                      current.map((item) =>
                        item.id === row.id ? { ...item, enabled: checked } : item,
                      ),
                    )
                  }
                />
                Enabled
              </label>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Move up"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ChevronUp className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Move down"
                disabled={index === rows.length - 1}
                onClick={() => move(index, 1)}
              >
                <ChevronDown className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Edit"
                onClick={() => setEditingId(editingId === row.id ? null : (row.id ?? null))}
              >
                <Pencil className="size-4" />
              </Button>
              {pendingDelete?.id === row.id ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setRows((current) =>
                        current.filter((r) => r.id !== row.id).map(normalizeRow),
                      );
                      setPendingDelete(null);
                    }}
                  >
                    Confirm
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPendingDelete(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Delete"
                  onClick={() => setPendingDelete(row)}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RelationshipGroup({
  doctorId,
  relation,
  register,
}: {
  doctorId: string;
  relation: Relationship;
  register: (save: () => Promise<void>) => void;
}) {
  const query = useQuery({
    queryKey: ["doctor-profile-relation", relation.key, doctorId],
    queryFn: async () => {
      const select = relation.controls?.length
        ? `${relation.sourceId},${relation.controls.join(",")}`
        : relation.sourceId;
      const [source, links] = await Promise.all([
        db.from(relation.source).select(`id,${relation.text}`).order(relation.text),
        db.from(relation.link).select(select).eq("doctor_id", doctorId),
      ]);
      if (source.error) throw source.error;
      if (links.error) throw links.error;
      return { options: source.data ?? [], links: links.data ?? [] };
    },
  });
  const [links, setLinks] = useState<Row[]>([]);
  useEffect(() => setLinks((query.data?.links ?? []).map(normalizeRow)), [query.data]);
  const save = async () => {
    const original = query.data?.links ?? [];
    const removed = original.filter(
      (old: Row) => !links.some((row) => row[relation.sourceId] === old[relation.sourceId]),
    );
    for (const row of removed) {
      const { error } = await db
        .from(relation.link)
        .delete()
        .eq("doctor_id", doctorId)
        .eq(relation.sourceId, row[relation.sourceId]);
      if (error) throw error;
    }
    const controls = relation.controls ?? [];
    const allowed = ["doctor_id", relation.sourceId, ...controls];
    for (const [index, row] of links.entries()) {
      const payload: Record<string, any> = {};
      for (const key of allowed) {
        if (key in row) payload[key] = row[key];
      }
      payload["doctor_id"] = doctorId;
      payload[relation.sourceId] = row[relation.sourceId];
      if (controls.includes("display_order")) payload["display_order"] = index;
      const existing = original.some(
        (old: Row) => old[relation.sourceId] === row[relation.sourceId],
      );
      if (existing && controls.length === 0) continue;
      const command = existing
        ? db
            .from(relation.link)
            .update(payload)
            .eq("doctor_id", doctorId)
            .eq(relation.sourceId, row[relation.sourceId])
        : db.from(relation.link).insert(payload);
      const { error } = await command;
      if (error) throw error;
    }

  };
  useEffect(() => register(save));
  const linked = new Map(links.map((row) => [row[relation.sourceId], row]));
  const toggle = (id: string, checked: boolean) =>
    setLinks((current) =>
      checked
        ? [
            ...current,
            {
              id: `new-${id}`,
              [relation.sourceId]: id,
              enabled: true,
              show_on_profile: true,
              display_order: current.length,
              consultation_availability: "",
              public_name: "",
              map_url: "",
            },
          ]
        : current.filter((row) => row[relation.sourceId] !== id),
    );
  const move = (id: string, delta: number) =>
    setLinks((current) => {
      const index = current.findIndex((row) => row[relation.sourceId] === id);
      const target = index + delta;
      const sourceRow = current[index];
      const targetRow = current[target];
      if (!sourceRow || !targetRow) return current;
      const next = [...current];
      next[index] = targetRow;
      next[target] = sourceRow;
      return next.map(normalizeRow);
    });
  return (
    <section className="rounded-md border border-border p-4">
      <h3 className="font-semibold">{relation.label}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Select existing records. Changes apply only when the doctor is saved.
      </p>
      <div className="mt-4 grid gap-2">
        {query.data?.options.length ? (
          query.data.options.map((option: Row) => {
            const optionId = option.id;
            if (!optionId) return null;
            const row = linked.get(optionId);
            const index = links.findIndex((item) => item[relation.sourceId] === optionId);
            return (
              <div key={option.id} className="rounded-md bg-secondary p-3">
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox
                    checked={Boolean(row)}
                    onCheckedChange={(checked) => toggle(optionId, checked === true)}
                  />
                  <span className="font-medium">{option[relation.text]}</span>
                </label>
                {row && relation.controls?.length ? (
                  <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
                    {relation.controls.includes("consultation_availability") ? (
                      <div className="sm:col-span-2">
                        <Label htmlFor={`${relation.key}-${option.id}-availability`}>
                          Consultation availability
                        </Label>
                        <Input
                          id={`${relation.key}-${option.id}-availability`}
                          className="mt-1"
                          value={row.consultation_availability ?? ""}
                          onChange={(event) =>
                            setLinks((current) =>
                              current.map((item) =>
                                item[relation.sourceId] === option.id
                                  ? { ...item, consultation_availability: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      </div>
                    ) : null}
                    {relation.controls.includes("public_name") ? (
                      <div>
                        <Label htmlFor={`${relation.key}-${option.id}-public-name`}>
                          Public display name
                        </Label>
                        <Input
                          id={`${relation.key}-${option.id}-public-name`}
                          className="mt-1"
                          value={row.public_name ?? ""}
                          onChange={(event) =>
                            setLinks((current) =>
                              current.map((item) =>
                                item[relation.sourceId] === option.id
                                  ? { ...item, public_name: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      </div>
                    ) : null}
                    {relation.controls.includes("map_url") ? (
                      <div>
                        <Label htmlFor={`${relation.key}-${option.id}-map-url`}>Map URL</Label>
                        <Input
                          id={`${relation.key}-${option.id}-map-url`}
                          className="mt-1"
                          type="url"
                          value={row.map_url ?? ""}
                          onChange={(event) =>
                            setLinks((current) =>
                              current.map((item) =>
                                item[relation.sourceId] === option.id
                                  ? { ...item, map_url: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      </div>
                    ) : null}
                    {relation.controls.includes("enabled") ? (
                      <label className="flex items-center gap-2 text-sm">
                        <Switch
                          checked={row.enabled !== false}
                          onCheckedChange={(checked) =>
                            setLinks((current) =>
                              current.map((item) =>
                                item[relation.sourceId] === option.id
                                  ? { ...item, enabled: checked }
                                  : item,
                              ),
                            )
                          }
                        />
                        Enabled
                      </label>
                    ) : null}
                    {relation.controls.includes("show_on_profile") ? (
                      <label className="flex items-center gap-2 text-sm">
                        <Switch
                          checked={row.show_on_profile !== false}
                          onCheckedChange={(checked) =>
                            setLinks((current) =>
                              current.map((item) =>
                                item[relation.sourceId] === option.id
                                  ? { ...item, show_on_profile: checked }
                                  : item,
                              ),
                            )
                          }
                        />
                        Show on profile
                      </label>
                    ) : null}
                    {relation.controls.includes("display_order") ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Move ${option[relation.text]} up`}
                          disabled={index === 0}
                          onClick={() => move(optionId, -1)}
                        >
                          <ChevronUp className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Move ${option[relation.text]} down`}
                          disabled={index === links.length - 1}
                          onClick={() => move(optionId, 1)}
                        >
                          <ChevronDown className="size-4" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">No records available.</p>
        )}
      </div>
    </section>
  );
}

function ReviewSelector({
  doctorId,
  register,
}: {
  doctorId: string;
  register: (save: () => Promise<void>) => void;
}) {
  const query = useQuery({
    queryKey: ["doctor-profile-reviews", doctorId],
    queryFn: async () => {
      const [reviews, selections] = await Promise.all([
        db
          .from("reviews")
          .select("id,author_name,content,source_type,source_url")
          .eq("review_type", "doctor")
          .eq("show_publicly", true)
          .order("display_order"),
        db
          .from("doctor_review_selections")
          .select("review_id,display_order")
          .eq("doctor_id", doctorId)
          .eq("enabled", true)
          .order("display_order"),
      ]);
      if (reviews.error) throw reviews.error;
      if (selections.error) throw selections.error;
      return { reviews: reviews.data ?? [], selections: selections.data ?? [] };
    },
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  useEffect(
    () => setSelected(new Set((query.data?.selections ?? []).map((row: Row) => row["review_id"]))),
    [doctorId, query.data],
  );
  const save = async () => {
    const { error: deleteError } = await db
      .from("doctor_review_selections")
      .delete()
      .eq("doctor_id", doctorId);
    if (deleteError) throw deleteError;
    const rows = [...selected].map((review_id, display_order) => ({
      doctor_id: doctorId,
      review_id,
      enabled: true,
      display_order,
    }));
    if (rows.length) {
      const { error } = await db.from("doctor_review_selections").insert(rows);
      if (error) throw error;
    }
  };
  useEffect(() => register(save));
  return (
    <section className="rounded-md border border-border p-4">
      <h3 className="font-semibold">Approved patient reviews</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Select only approved doctor reviews. Review text remains read-only here.
      </p>
      <div className="mt-4 grid gap-2">
        {query.data?.reviews.length ? (
          query.data.reviews.map((row: Row) => {
            const rowId = row.id;
            if (!rowId) return null;
            return (
              <label key={rowId} className="flex gap-3 rounded-md bg-secondary p-3 text-sm">
                <Checkbox
                  checked={selected.has(rowId)}
                  onCheckedChange={(checked) =>
                    setSelected((current) => {
                      const next = new Set(current);
                      if (checked) next.add(rowId);
                      else next.delete(rowId);
                      return next;
                    })
                  }
                />
                <span>
                  <span className="font-medium">{row.author_name}</span>
                  <span className="ml-2 text-xs uppercase text-muted-foreground">
                    {String(row["source_type"] ?? "review source")}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-muted-foreground">
                    {row.content}
                  </span>
                </span>
              </label>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">No approved doctor reviews are available.</p>
        )}
      </div>
    </section>
  );
}
