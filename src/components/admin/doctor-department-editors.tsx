/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Plus, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { userFacingDataError } from "@/lib/data/errors";
import { cn } from "@/lib/utils";

const db = supabase as any;
const bucket = "doctor-profile-images";
const endpoint = "/api/public/doctor-profile-image";
const imageUrl = (path: string) => `${endpoint}?path=${encodeURIComponent(path)}`;
const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const managedPath = (value: string): string | null => {
  if (!value) return null;
  try {
    const parsed = new URL(value, "https://millennium.invalid");
    return parsed.pathname === endpoint ? parsed.searchParams.get("path") : null;
  } catch {
    return null;
  }
};

export type Option = { id: string; name: string; department_id?: string | null };
type Department = { id: string; name: string };

export type ProfessionalSnapshot = {
  departmentIds: string[];
  designationByDepartment: Record<string, string>;
  qualificationIds: string[];
  specializationIds: string[];
  designation: string;
  qualifications: string[];
  specialty: string;
};

export type ProfessionalEditorHandle = {
  snapshot: () => ProfessionalSnapshot;
  save: (doctorId: string) => Promise<void>;
  reset: () => void;
};

export const DepartmentProfessionalEditor = forwardRef<
  ProfessionalEditorHandle,
  {
    doctorId: string;
    departments: Department[];
    legacyDesignation: string;
    legacyQualifications: string[];
    legacySpecialty: string;
    canWrite: boolean;
    onDepartmentsChange: (ids: string[]) => void;
  }
>(function DepartmentProfessionalEditor(
  {
    doctorId,
    departments,
    legacyDesignation,
    legacyQualifications,
    legacySpecialty,
    canWrite,
    onDepartmentsChange,
  },
  ref,
) {
  const isNew = doctorId === "new";
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["doctor-department-professional", doctorId],
    queryFn: async () => {
      const requests = [
        db.from("department_designations").select("id,name,department_id").eq("active", true).order("name"),
        db.from("department_qualifications").select("id,name,department_id").eq("active", true).order("name"),
        db.from("department_specializations").select("id,name,department_id").eq("active", true).order("name"),
      ];
      if (!isNew) {
        requests.push(
          db.from("doctor_departments").select("department_id,is_primary,display_order").eq("doctor_id", doctorId).order("display_order"),
          db.from("doctor_designations").select("department_id,designation_id").eq("doctor_id", doctorId),
          db.from("doctor_qualifications").select("department_id,qualification_id,display_order").eq("doctor_id", doctorId).order("display_order"),
          db.from("doctor_specializations").select("department_id,specialization_id").eq("doctor_id", doctorId).not("specialization_id", "is", null),
        );
      }
      const results = await Promise.all(requests);
      const failure = results.find((result) => result.error)?.error;
      if (failure) throw failure;
      return {
        designations: results[0]?.data ?? [],
        qualifications: results[1]?.data ?? [],
        specializations: results[2]?.data ?? [],
        departmentLinks: results[3]?.data ?? [],
        designationLinks: results[4]?.data ?? [],
        qualificationLinks: results[5]?.data ?? [],
        specializationLinks: results[6]?.data ?? [],
      };
    },
  });
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);
  const [designationByDepartment, setDesignationByDepartment] = useState<Record<string, string>>({});
  const [qualificationIds, setQualificationIds] = useState<string[]>([]);
  const [specializationIds, setSpecializationIds] = useState<string[]>([]);
  const [dialog, setDialog] = useState<{ kind: "designation" | "qualification" | "specialization"; departmentId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    if (!query.data) return;
    const ids = query.data.departmentLinks.map((row: any) => row.department_id);
    setDepartmentIds(ids);
    setDesignationByDepartment(
      Object.fromEntries(query.data.designationLinks.map((row: any) => [row.department_id, row.designation_id])),
    );
    setQualificationIds(query.data.qualificationLinks.map((row: any) => row.qualification_id));
    setSpecializationIds(query.data.specializationLinks.map((row: any) => row.specialization_id));
    onDepartmentsChange(ids);
    setError(null);
  };
  useEffect(() => {
    reset();
    // The query payload is the saved baseline; the callback is stabilized by the workspace.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data, onDepartmentsChange]);

  const updateDepartments = (ids: string[]) => {
    setDepartmentIds(ids);
    onDepartmentsChange(ids);
  };
  const snapshot = (): ProfessionalSnapshot => {
    const designations = query.data?.designations ?? [];
    const qualifications = query.data?.qualifications ?? [];
    const specializations = query.data?.specializations ?? [];
    const primaryDesignation = designations.find(
      (item: any) => item.id === designationByDepartment[departmentIds[0] ?? ""],
    )?.name;
    const knownQualificationNames = new Set(
      qualifications.map((item: any) => item.name.trim().toLowerCase()),
    );
    const unmatchedLegacyQualifications = legacyQualifications.filter(
      (name) => !knownQualificationNames.has(name.trim().toLowerCase()),
    );
    const selectedQualificationNames = qualificationIds
      .map((id) => qualifications.find((item: any) => item.id === id)?.name)
      .filter(Boolean);
    const knownSpecializationNames = new Set(
      specializations.map((item: any) => item.name.trim().toLowerCase()),
    );
    const unmatchedLegacySpecialties = legacySpecialty
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name && !knownSpecializationNames.has(name.toLowerCase()));
    const selectedSpecializationNames = specializationIds
      .map((id) => specializations.find((item: any) => item.id === id)?.name)
      .filter(Boolean);
    return {
      departmentIds,
      designationByDepartment,
      qualificationIds,
      specializationIds,
      designation: primaryDesignation ?? legacyDesignation,
      qualifications: [...unmatchedLegacyQualifications, ...selectedQualificationNames],
      specialty: [...unmatchedLegacySpecialties, ...selectedSpecializationNames].join(", "),
    };
  };
  const save = async (savedDoctorId: string) => {
    const sync = async (table: string, rows: any[]) => {
      const { error: removeError } = await db.from(table).delete().eq("doctor_id", savedDoctorId);
      if (removeError) throw removeError;
      if (rows.length) {
        const { error: insertError } = await db.from(table).insert(rows);
        if (insertError) throw insertError;
      }
    };
    await sync(
      "doctor_departments",
      departmentIds.map((department_id, display_order) => ({
        doctor_id: savedDoctorId,
        department_id,
        is_primary: display_order === 0,
        display_order,
      })),
    );
    await sync(
      "doctor_designations",
      departmentIds.flatMap((department_id) => {
        const designation_id = designationByDepartment[department_id];
        return designation_id ? [{ doctor_id: savedDoctorId, department_id, designation_id }] : [];
      }),
    );
    const qualifications = query.data?.qualifications ?? [];
    await sync(
      "doctor_qualifications",
      qualificationIds.flatMap((qualification_id, display_order) => {
        const option = qualifications.find((item: any) => item.id === qualification_id);
        return option
          ? [{ doctor_id: savedDoctorId, qualification_id, department_id: option.department_id, display_order }]
          : [];
      }),
    );
    const existing = query.data?.specializationLinks ?? [];
    const removedIds = existing
      .filter((row: any) => !specializationIds.includes(row.specialization_id))
      .map((row: any) => row.specialization_id);
    if (removedIds.length) {
      const { error: removeError } = await db
        .from("doctor_specializations")
        .delete()
        .eq("doctor_id", savedDoctorId)
        .in("specialization_id", removedIds);
      if (removeError) throw removeError;
    }
    const specializations = query.data?.specializations ?? [];
    for (const [display_order, specialization_id] of specializationIds.entries()) {
      const option = specializations.find((item: any) => item.id === specialization_id);
      if (!option) continue;
      const match = existing.find((row: any) => row.specialization_id === specialization_id);
      if (match) continue;
      const { error: insertError } = await db.from("doctor_specializations").insert({
        doctor_id: savedDoctorId,
        specialization_id,
        department_id: option.department_id,
        title: option.name,
        enabled: true,
        display_order,
      });
      if (insertError) throw insertError;
    }
  };
  useImperativeHandle(ref, () => ({ snapshot, save, reset }));

  const createOption = async (kind: "designation" | "qualification" | "specialization", departmentId: string, values: { name: string; description?: string }) => {
    const table =
      kind === "designation"
        ? "department_designations"
        : kind === "qualification"
          ? "department_qualifications"
          : "department_specializations";
    const existing = (query.data?.[`${kind}s` as keyof typeof query.data] as any[] | undefined)?.find(
      (item) => item.department_id === departmentId && item.name.trim().toLowerCase() === values.name.trim().toLowerCase(),
    );
    let id = existing?.id;
    const previousDepartments = departmentIds;
    const previousDesignations = designationByDepartment;
    const previousQualifications = qualificationIds;
    const previousSpecializations = specializationIds;
    if (!id) {
      const payload = { department_id: departmentId, name: values.name.trim(), ...(kind === "specialization" ? { description: values.description?.trim() || null } : {}) };
      const { data, error: createError } = await db.from(table).insert(payload).select("id").single();
      if (createError) throw createError;
      id = data.id;
      client.setQueryData(["doctor-department-professional", doctorId], (current: any) => ({
        ...current,
        [`${kind}s`]: [
          ...(current?.[`${kind}s`] ?? []),
          { id, department_id: departmentId, name: values.name.trim(), description: values.description?.trim() || null },
        ],
        ...(kind === "designation"
          ? {
              designationLinks: [
                ...(current?.designationLinks ?? []).filter(
                  (item: any) => item.department_id !== departmentId,
                ),
                { department_id: departmentId, designation_id: id },
              ],
            }
          : kind === "qualification"
            ? {
                qualificationLinks: [
                  ...(current?.qualificationLinks ?? []),
                  { department_id: departmentId, qualification_id: id, display_order: previousQualifications.length },
                ],
              }
            : {
                specializationLinks: [
                  ...(current?.specializationLinks ?? []),
                  { department_id: departmentId, specialization_id: id },
                ],
              }),
      }));
    }
    setDepartmentIds(previousDepartments);
    onDepartmentsChange(previousDepartments);
    setDesignationByDepartment(
      kind === "designation"
        ? { ...previousDesignations, [departmentId]: id }
        : previousDesignations,
    );
    setQualificationIds(
      kind === "qualification"
        ? [...new Set([...previousQualifications, id])]
        : previousQualifications,
    );
    setSpecializationIds(
      kind === "specialization"
        ? [...new Set([...previousSpecializations, id])]
        : previousSpecializations,
    );
  };

  if (query.isError) return <p className="text-sm text-destructive">{userFacingDataError(query.error)}</p>;
  return (
    <div className="grid gap-5 lg:col-span-2">
      <div>
        <Label>Departments *</Label>
        <SearchableMultiSelect
          label="Departments"
          options={departments}
          selected={departmentIds}
          onChange={updateDepartments}
          placeholder="Select departments"
          disabled={!canWrite}
        />
      </div>
      {!departmentIds.length ? (
        <p className="text-sm text-muted-foreground">Select at least one department to choose professional information.</p>
      ) : null}
      {departmentIds.map((departmentId) => {
        const department = departments.find((item) => item.id === departmentId);
        const designations = (query.data?.designations ?? []).filter((item: any) => item.department_id === departmentId);
        const qualifications = (query.data?.qualifications ?? []).filter((item: any) => item.department_id === departmentId);
        const specializations = (query.data?.specializations ?? []).filter((item: any) => item.department_id === departmentId);
        return (
          <section key={departmentId} className="grid gap-5 border-t border-border pt-5">
            <h4 className="font-semibold">{department?.name ?? "Department"}</h4>
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <Label>Designation</Label>
                <SearchableSingleSelect
                  label={`${department?.name ?? "Department"} designation`}
                  options={designations}
                  value={designationByDepartment[departmentId] ?? ""}
                  onChange={(value) => setDesignationByDepartment((current) => ({ ...current, [departmentId]: value }))}
                  placeholder="Select designation"
                  disabled={!canWrite}
                />
                <AddButton label="Add New Designation" onClick={() => setDialog({ kind: "designation", departmentId })} />
              </div>
              <div>
                <Label>Qualifications</Label>
                <SearchableMultiSelect
                  label={`${department?.name ?? "Department"} qualifications`}
                  options={qualifications}
                  selected={qualificationIds.filter((id) => qualifications.some((item: any) => item.id === id))}
                  onChange={(ids) => setQualificationIds((current) => [...current.filter((id) => !qualifications.some((item: any) => item.id === id)), ...ids])}
                  placeholder="Select qualifications"
                  disabled={!canWrite}
                />
                <AddButton label="Add New Qualification" onClick={() => setDialog({ kind: "qualification", departmentId })} />
              </div>
              <div className="lg:col-span-2">
                <Label>Specializations</Label>
                <SearchableMultiSelect
                  label={`${department?.name ?? "Department"} specializations`}
                  options={specializations}
                  selected={specializationIds.filter((id) => specializations.some((item: any) => item.id === id))}
                  onChange={(ids) => setSpecializationIds((current) => [...current.filter((id) => !specializations.some((item: any) => item.id === id)), ...ids])}
                  placeholder="Select specializations"
                  disabled={!canWrite}
                />
                <AddButton label="Add New Specialization" onClick={() => setDialog({ kind: "specialization", departmentId })} />
              </div>
            </div>
          </section>
        );
      })}
      {(legacyDesignation || legacyQualifications.length || legacySpecialty) && !query.isPending ? (
        <p className="text-xs text-muted-foreground">
          Existing unmatched values remain preserved: {[legacyDesignation, ...legacyQualifications, legacySpecialty].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      <p className="text-sm text-destructive" role="alert">{error}</p>
      <AddOptionDialog
        open={Boolean(dialog)}
        kind={dialog?.kind ?? "designation"}
        departmentName={departments.find((item) => item.id === dialog?.departmentId)?.name ?? "department"}
        onOpenChange={(open) => !open && setDialog(null)}
        onSave={async (values) => {
          if (!dialog) return;
          setError(null);
          try {
            await createOption(dialog.kind, dialog.departmentId, values);
            setDialog(null);
          } catch (cause) {
            setError(userFacingDataError(cause));
            throw cause;
          }
        }}
      />
    </div>
  );
});

export type DepartmentRelationEditorHandle = { save: () => Promise<void>; reset: () => void };

type ServiceCard = { mainId: string; itemIds: string[] };

export const DepartmentServicesEditor = forwardRef<
  DepartmentRelationEditorHandle,
  { doctorId: string; departmentIds: string[]; departments: Department[]; canWrite: boolean }
>(function DepartmentServicesEditor({ doctorId, departmentIds, departments, canWrite }, ref) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["doctor-department-services", doctorId],
    queryFn: async () => {
      const [services, departmentLinks, items, doctorLinks, doctorItems] = await Promise.all([
        db.from("professional_services").select("id,title,slug,published").order("title"),
        db.from("professional_service_departments").select("professional_service_id,department_id"),
        db
          .from("professional_service_items")
          .select(
            "professional_service_id,individual_service_id,display_order,individual_services!professional_service_items_individual_service_id_fkey(id,title)",
          )
          .order("display_order"),
        db.from("professional_service_doctors").select("professional_service_id").eq("doctor_id", doctorId),
        db
          .from("doctor_service_items")
          .select("professional_service_id,individual_service_id,display_order")
          .eq("doctor_id", doctorId)
          .order("display_order"),
      ]);
      const failure = [services, departmentLinks, items, doctorLinks, doctorItems].find((result) => result.error)?.error;
      if (failure) throw failure;
      return {
        services: services.data ?? [],
        departmentLinks: departmentLinks.data ?? [],
        items: items.data ?? [],
        doctorLinks: doctorLinks.data ?? [],
        doctorItems: doctorItems.data ?? [],
      };
    },
  });
  const [cards, setCards] = useState<ServiceCard[]>([]);
  const [baseline, setBaseline] = useState<ServiceCard[]>([]);
  const [draft, setDraft] = useState<{ index: number | null; mainId: string; itemIds: string[] } | null>(null);
  const [dialogDepartment, setDialogDepartment] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mainIds: string[] = (query.data?.doctorLinks ?? []).map((row: any) => row.professional_service_id);
    const next: ServiceCard[] = mainIds.map((mainId) => ({
      mainId,
      itemIds: (query.data?.doctorItems ?? [])
        .filter((row: any) => row.professional_service_id === mainId)
        .map((row: any) => row.individual_service_id),
    }));
    setCards(next);
    setBaseline(next);
    setError(null);
  }, [query.data]);

  const save = async () => {
    const { error: removeItems } = await db.from("doctor_service_items").delete().eq("doctor_id", doctorId);
    if (removeItems) throw removeItems;
    const { error: removeMains } = await db.from("professional_service_doctors").delete().eq("doctor_id", doctorId);
    if (removeMains) throw removeMains;
    if (cards.length) {
      const { error: insertMains } = await db
        .from("professional_service_doctors")
        .insert(cards.map((card) => ({ doctor_id: doctorId, professional_service_id: card.mainId })));
      if (insertMains) throw insertMains;
      const rows = cards.flatMap((card) =>
        card.itemIds.map((individual_service_id, display_order) => ({
          doctor_id: doctorId,
          professional_service_id: card.mainId,
          individual_service_id,
          display_order,
        })),
      );
      if (rows.length) {
        const { error: insertItems } = await db.from("doctor_service_items").insert(rows);
        if (insertItems) throw insertItems;
      }
    }
  };
  useImperativeHandle(ref, () => ({
    save,
    reset: () => {
      setCards(baseline);
      setDraft(null);
      setError(null);
    },
  }));

  const allowedMains = useMemo(() => {
    const linkedIds = new Set(
      (query.data?.departmentLinks ?? [])
        .filter((row: any) => departmentIds.includes(row.department_id))
        .map((row: any) => row.professional_service_id),
    );
    return (query.data?.services ?? [])
      .filter((item: any) => linkedIds.has(item.id) || cards.some((card) => card.mainId === item.id))
      .map((item: any) => ({ id: item.id, name: item.title }));
  }, [departmentIds, query.data, cards]);
  const mainTitle = (id: string) =>
    (query.data?.services ?? []).find((item: any) => item.id === id)?.title ?? "Professional service";
  const itemsFor = (mainId: string) =>
    (query.data?.items ?? [])
      .filter((row: any) => row.professional_service_id === mainId)
      .map((row: any) => ({
        id: row.individual_service_id,
        name: row.individual_services?.title ?? "Service",
      }));

  const create = async (values: { name: string }) => {
    if (!dialogDepartment) return;
    const existing = (query.data?.services ?? []).find(
      (item: any) => item.title.trim().toLowerCase() === values.name.trim().toLowerCase(),
    );
    let id = existing?.id;
    if (!id) {
      const baseSlug = slugify(values.name);
      let slug = baseSlug;
      let suffix = 2;
      while ((query.data?.services ?? []).some((item: any) => item.slug === slug)) slug = `${baseSlug}-${suffix++}`;
      const { data, error: createError } = await db
        .from("professional_services")
        .insert({ title: values.name.trim(), slug, published: false })
        .select("id")
        .single();
      if (createError) throw createError;
      id = data.id;
    }
    const { error: linkError } = await db
      .from("professional_service_departments")
      .upsert({ professional_service_id: id, department_id: dialogDepartment });
    if (linkError) throw linkError;
    client.setQueryData(["doctor-department-services", doctorId], (current: any) => ({
      ...current,
      services: existing
        ? (current?.services ?? [])
        : [...(current?.services ?? []), { id, title: values.name.trim(), slug: slugify(values.name), published: false }],
      departmentLinks: [
        ...(current?.departmentLinks ?? []).filter(
          (item: any) => item.professional_service_id !== id || item.department_id !== dialogDepartment,
        ),
        { professional_service_id: id, department_id: dialogDepartment },
      ],
    }));
    setDraft({ index: null, mainId: id as string, itemIds: [] });
  };

  const usedMainIds = cards.map((card) => card.mainId);
  const draftOptions = allowedMains.filter(
    (option: Option) =>
      !usedMainIds.includes(option.id) ||
      (draft?.index !== null && cards[draft?.index ?? -1]?.mainId === option.id),
  );

  return (
    <section className="rounded-md border border-border p-4">
      <h3 className="font-semibold">Professional services</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Choose a main professional service from the doctor’s departments, then tick the individual services the doctor
        provides.
      </p>
      {!departmentIds.length ? (
        <p className="mt-3 text-sm text-muted-foreground">Select departments in Professional Information first.</p>
      ) : null}

      {cards.length ? (
        <div className="mt-4 grid gap-3">
          {cards.map((card, index) => (
            <article key={card.mainId} className="rounded-md border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h4 className="font-semibold">{mainTitle(card.mainId)}</h4>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!canWrite}
                    onClick={() => setDraft({ index, mainId: card.mainId, itemIds: card.itemIds })}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={!canWrite}
                    onClick={() => {
                      setCards((current) => current.filter((_, position) => position !== index));
                      setDraft(null);
                    }}
                  >
                    <Trash2 className="size-4" /> Remove
                  </Button>
                </div>
              </div>
              {card.itemIds.length ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {card.itemIds.map((itemId) => (
                    <li key={itemId} className="rounded-md bg-secondary px-2 py-1 text-xs font-medium">
                      {itemsFor(card.mainId).find((item: Option) => item.id === itemId)?.name ?? "Service"}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No individual services selected yet.</p>
              )}
            </article>
          ))}
        </div>
      ) : null}

      {draft ? (
        <div className="mt-4 rounded-md border border-dashed border-border p-4">
          <Label>Main professional service</Label>
          <SearchableSingleSelect
            label="Main professional service"
            options={draftOptions}
            value={draft.mainId}
            onChange={(value) => setDraft((current) => (current ? { ...current, mainId: value, itemIds: [] } : current))}
            placeholder="Select a main professional service"
            disabled={!canWrite}
          />
          {draft.mainId ? (
            <fieldset className="mt-4">
              <legend className="text-sm font-medium">Individual services</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {itemsFor(draft.mainId).map((item: Option) => {
                  const checked = draft.itemIds.includes(item.id);
                  return (
                    <label key={item.id} className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1 size-4"
                        checked={checked}
                        disabled={!canWrite}
                        onChange={() =>
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  itemIds: checked
                                    ? current.itemIds.filter((id) => id !== item.id)
                                    : [...current.itemIds, item.id],
                                }
                              : current,
                          )
                        }
                      />
                      <span>{item.name}</span>
                    </label>
                  );
                })}
              </div>
              {!itemsFor(draft.mainId).length ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  This main service has no individual services yet.
                </p>
              ) : null}
            </fieldset>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!canWrite || !draft.mainId}
              onClick={() => {
                setCards((current) => {
                  const next = [...current];
                  const entry = { mainId: draft.mainId, itemIds: draft.itemIds };
                  if (draft.index !== null) next[draft.index] = entry;
                  else if (!next.some((card) => card.mainId === entry.mainId)) next.push(entry);
                  return next;
                });
                setDraft(null);
              }}
            >
              Done
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <AddButton
          label={cards.length ? "Add Another Professional Service" : "Add Professional Service"}
          onClick={() => setDraft({ index: null, mainId: "", itemIds: [] })}
        />
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
        {departmentIds.map((id) => (
          <AddButton
            key={id}
            label={`Add Professional Service for ${departments.find((item) => item.id === id)?.name ?? "Department"}`}
            onClick={() => setDialogDepartment(id)}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Only add a new main professional service when it does not already exist in the list above.
      </p>

      {query.isError || error ? (
        <p className="mt-3 text-sm text-destructive">{error ?? userFacingDataError(query.error)}</p>
      ) : null}
      <AddOptionDialog
        open={Boolean(dialogDepartment)}
        kind="service"
        departmentName={departments.find((item) => item.id === dialogDepartment)?.name ?? "department"}
        onOpenChange={(open) => !open && setDialogDepartment(null)}
        onSave={async (values) => {
          setError(null);
          try {
            await create(values);
            setDialogDepartment(null);
          } catch (cause) {
            setError(userFacingDataError(cause));
            throw cause;
          }
        }}
      />
    </section>
  );
});

export const DepartmentSpecializationsEditor = forwardRef<
  DepartmentRelationEditorHandle,
  { doctorId: string; departmentIds: string[]; canWrite: boolean }
>(function DepartmentSpecializationsEditor({ doctorId, departmentIds, canWrite }, ref) {
  const query = useQuery({
    queryKey: ["doctor-department-specialization-content", doctorId],
    queryFn: async () => {
      const { data, error } = await db
        .from("doctor_specializations")
        .select("id,title,description,icon,icon_override_url,enabled,display_order,department_id,specialization_id,department_specializations(name,description,default_icon_url)")
        .eq("doctor_id", doctorId)
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });
  const [rows, setRows] = useState<any[]>([]);
  const [baseline, setBaseline] = useState<any[]>([]);
  const uploaded = useRef(new Set<string>());
  const removed = useRef(new Set<string>());
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setRows(structuredClone(query.data ?? []));
    setBaseline(structuredClone(query.data ?? []));
    setError(null);
  }, [query.data]);
  const save = async () => {
    for (const [display_order, row] of rows.entries()) {
      const { department_specializations: _definition, ...rest } = row;
      void _definition;
      const { error: updateError } = await db.from("doctor_specializations").update({
        description: rest.description || null,
        icon_override_url: rest.icon_override_url || null,
        enabled: rest.enabled !== false,
        display_order,
      }).eq("id", row.id);
      if (updateError) throw updateError;
    }
    const retained = new Set(rows.map((row) => managedPath(row.icon_override_url)).filter(Boolean));
    const stale = [...new Set([...removed.current, ...uploaded.current])].filter((path) => !retained.has(path));
    if (stale.length) await supabase.storage.from(bucket).remove(stale);
    uploaded.current.clear();
    removed.current.clear();
    await query.refetch();
  };
  useImperativeHandle(ref, () => ({
    save,
    reset: () => {
      const paths = [...uploaded.current];
      if (paths.length) void supabase.storage.from(bucket).remove(paths);
      uploaded.current.clear();
      removed.current.clear();
      setRows(structuredClone(baseline));
    },
  }));
  const upload = async (rowId: string, current: string, file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError("Choose a JPG, PNG, or WebP image up to 5 MB.");
      return;
    }
    setError(null);
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `specializations/${crypto.randomUUID()}/specialization.${extension}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) return setError(userFacingDataError(uploadError));
    const next = imageUrl(path);
    const response = await fetch(next, { cache: "no-store" });
    if (!response.ok) {
      await supabase.storage.from(bucket).remove([path]);
      return setError("The uploaded image could not be verified.");
    }
    const previous = managedPath(current);
    if (previous) removed.current.add(previous);
    uploaded.current.add(path);
    setRows((items) => items.map((item) => item.id === rowId ? { ...item, icon_override_url: next } : item));
  };
  const visibleRows = rows.filter((row) => !row.department_id || departmentIds.includes(row.department_id));
  return (
    <section className="border-t border-border pt-6">
      <h3 className="text-lg font-semibold">Specializations</h3>
      <p className="mt-1 text-sm text-muted-foreground">Selected in Professional Information and scoped to the chosen departments.</p>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {visibleRows.map((row) => {
          const definition = row.department_specializations;
          const icon = row.icon_override_url || definition?.default_icon_url || row.icon;
          return (
            <article key={row.id} className="rounded-md border border-border p-4">
              <h4 className="font-semibold">{definition?.name || row.title}</h4>
              <Label className="mt-4 block">Description</Label>
              <Textarea className="mt-1" value={row.description ?? definition?.description ?? ""} disabled={!canWrite} onChange={(event) => setRows((items) => items.map((item) => item.id === row.id ? { ...item, description: event.target.value } : item))} />
              {icon ? <img src={icon} alt="" className="mt-3 size-16 rounded-md border border-border object-contain p-1" /> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <label>
                  <span className="sr-only">Upload specialization icon</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={!canWrite} onChange={(event) => void upload(row.id, row.icon_override_url ?? "", event.target.files?.[0])} />
                  <span className={cn("inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium", !canWrite && "pointer-events-none opacity-50")}><Upload className="size-4" /> {icon ? "Replace icon" : "Upload icon"}</span>
                </label>
                {row.icon_override_url ? <Button type="button" size="sm" variant="ghost" onClick={() => { const path = managedPath(row.icon_override_url); if (path) removed.current.add(path); setRows((items) => items.map((item) => item.id === row.id ? { ...item, icon_override_url: "" } : item)); }}><Trash2 className="size-4" /> Remove</Button> : null}
              </div>
            </article>
          );
        })}
      </div>
      {!visibleRows.length ? <p className="mt-4 text-sm text-muted-foreground">No specializations selected for these departments.</p> : null}
    </section>
  );
});

function SearchableMultiSelect({ label, options, selected, onChange, placeholder, disabled }: { label: string; options: Option[]; selected: string[]; onChange: (ids: string[]) => void; placeholder: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" role="combobox" aria-expanded={open} aria-label={label} disabled={disabled} className="w-full justify-between font-normal">
            {selected.length ? `${selected.length} selected` : placeholder}<ChevronsUpDown className="size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder={`Search ${label.toLowerCase()}`} />
            <CommandList>
              <CommandEmpty>No matching options.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const active = selected.includes(option.id);
                  return <CommandItem key={option.id} value={option.name} onSelect={() => onChange(active ? selected.filter((id) => id !== option.id) : [...selected, option.id])}><Check className={cn("size-4", active ? "opacity-100" : "opacity-0")} />{option.name}</CommandItem>;
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected.length ? <div className="mt-2 flex flex-wrap gap-2">{selected.map((id) => { const option = options.find((item) => item.id === id); return option ? <span key={id} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium">{option.name}<button type="button" aria-label={`Remove ${option.name}`} disabled={disabled} onClick={() => onChange(selected.filter((item) => item !== id))}><X className="size-3" /></button></span> : null; })}</div> : null}
    </div>
  );
}

function SearchableSingleSelect({ label, options, value, onChange, placeholder, disabled }: { label: string; options: Option[]; value: string; onChange: (id: string) => void; placeholder: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((item) => item.id === value);
  return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button type="button" variant="outline" role="combobox" aria-expanded={open} aria-label={label} disabled={disabled} className="mt-2 w-full justify-between font-normal">{selected?.name ?? placeholder}<ChevronsUpDown className="size-4 opacity-50" /></Button></PopoverTrigger><PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0"><Command><CommandInput placeholder={`Search ${label.toLowerCase()}`} /><CommandList><CommandEmpty>No matching options.</CommandEmpty><CommandGroup>{options.map((option) => <CommandItem key={option.id} value={option.name} onSelect={() => { onChange(option.id); setOpen(false); }}><Check className={cn("size-4", option.id === value ? "opacity-100" : "opacity-0")} />{option.name}</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent></Popover>;
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <Button type="button" size="sm" variant="ghost" className="mt-2" onClick={onClick}><Plus className="size-4" /> {label}</Button>;
}

function AddOptionDialog({ open, kind, departmentName, onOpenChange, onSave }: { open: boolean; kind: "designation" | "qualification" | "specialization" | "service"; departmentName: string; onOpenChange: (open: boolean) => void; onSave: (values: { name: string; description?: string }) => Promise<void> }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const title = kind === "service" ? "Professional Service" : kind[0]?.toUpperCase() + kind.slice(1);
  useEffect(() => { if (!open) { setName(""); setDescription(""); } }, [open]);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Add New {title}</DialogTitle><DialogDescription>This option will belong to {departmentName} and become reusable.</DialogDescription></DialogHeader><div><Label htmlFor="new-option-name">Name</Label><Input id="new-option-name" className="mt-2" value={name} onChange={(event) => setName(event.target.value)} /></div>{kind === "specialization" ? <div><Label htmlFor="new-option-description">Description</Label><Textarea id="new-option-description" className="mt-2" value={description} onChange={(event) => setDescription(event.target.value)} /></div> : null}<DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="button" disabled={!name.trim() || busy} onClick={() => { setBusy(true); void onSave({ name, description }).finally(() => setBusy(false)); }}>{busy ? "Adding…" : "Add"}</Button></DialogFooter></DialogContent></Dialog>;
}