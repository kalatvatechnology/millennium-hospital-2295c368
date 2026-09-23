/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, MapPin, Plus, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { siteConfig } from "@/config/site";
import {
  ConsultationScheduleEditor,
  normalizeSchedule,
  scheduleSummary,
  type ScheduleDay,
} from "./consultation-schedule-editor";

const db = supabase as any;
const HOSPITAL_ID = siteConfig.contact.primaryLocationId;
const CONTROLS = [
  "enabled",
  "display_order",
  "consultation_availability",
  "consultation_schedule",
  "public_name",
  "map_url",
] as const;

type LocationOption = {
  id: string;
  name: string;
  address_line: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  published: boolean;
};
type Link = {
  location_id: string;
  enabled: boolean;
  display_order: number;
  consultation_availability: string | null;
  consultation_schedule: ScheduleDay[];
  legacy_text?: string | null;
  public_name: string | null;
  map_url: string | null;
};

const hospitalFirst = (list: Link[]) =>
  [...list].sort(
    (a, b) =>
      (a.location_id === HOSPITAL_ID ? 0 : 1) - (b.location_id === HOSPITAL_ID ? 0 : 1) ||
      a.display_order - b.display_order,
  );
const area = (o?: LocationOption) => [o?.city, o?.state].filter(Boolean).join(" · ");
const address = (o?: LocationOption) =>
  [o?.address_line, o?.city, o?.state, o?.postal_code].filter(Boolean).join(", ");

export function DoctorLocationsEditor({
  doctorId,
  register,
  readOnly = false,
}: {
  doctorId: string;
  register: (save: () => Promise<void>) => void;
  readOnly?: boolean;
}) {
  const query = useQuery({
    queryKey: ["doctor-profile-relation", "locations", doctorId],
    queryFn: async () => {
      const [source, links] = await Promise.all([
        db
          .from("locations")
          .select("id,name,address_line,city,state,postal_code,published")
          .order("name"),
        db
          .from("doctor_locations")
          .select(`location_id,${CONTROLS.join(",")}`)
          .eq("doctor_id", doctorId),
      ]);
      if (source.error) throw source.error;
      if (links.error) throw links.error;
      return {
        options: (source.data ?? []) as LocationOption[],
        links: (links.data ?? []) as Link[],
      };
    },
  });
  const [links, setLinks] = useState<Link[]>([]);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  useEffect(
    () =>
      setLinks(
        hospitalFirst(query.data?.links ?? []).map((row, index) => ({
          ...row,
          consultation_schedule: normalizeSchedule(row.consultation_schedule),
          legacy_text: row.consultation_schedule ? null : row.consultation_availability,
          enabled: row.enabled !== false,
          display_order: index,
        })),
      ),
    [query.data],
  );

  const save = async () => {
    if (readOnly || !query.data) return;
    const original = query.data.links;
    for (const old of original) {
      if (old.location_id === HOSPITAL_ID) continue; // main hospital link is never removed
      if (links.some((row) => row.location_id === old.location_id)) continue;
      const { error } = await db
        .from("doctor_locations")
        .delete()
        .eq("doctor_id", doctorId)
        .eq("location_id", old.location_id);
      if (error) throw error;
    }
    for (const [index, row] of links.entries()) {
      const payload = {
        doctor_id: doctorId,
        location_id: row.location_id,
        enabled: row.enabled,
        display_order: index,
        consultation_schedule: row.consultation_schedule,
        consultation_availability:
          scheduleSummary(row.consultation_schedule) ?? (row.legacy_text || null),
        public_name: row.public_name,
        map_url: row.map_url,
      };
      const existing = original.some((old) => old.location_id === row.location_id);
      const { error } = existing
        ? await db
            .from("doctor_locations")
            .update(payload)
            .eq("doctor_id", doctorId)
            .eq("location_id", row.location_id)
        : await db.from("doctor_locations").insert(payload);
      if (error) throw error;
    }
  };
  useEffect(() => register(save));

  const options = query.data?.options ?? [];
  const byId = new Map(options.map((o) => [o.id, o]));
  const assigned = new Set(links.map((row) => row.location_id));
  const term = search.trim().toLowerCase();
  const available = options.filter(
    (o) =>
      !assigned.has(o.id) &&
      (!term || `${o.name} ${address(o)}`.toLowerCase().includes(term)),
  );
  const update = (id: string, patch: Partial<Link>) =>
    setLinks((current) => current.map((row) => (row.location_id === id ? { ...row, ...patch } : row)));
  const move = (id: string, delta: number) =>
    setLinks((current) => {
      const index = current.findIndex((row) => row.location_id === id);
      const target = index + delta;
      if (index < 0 || !current[target] || current[target].location_id === HOSPITAL_ID)
        return current;
      const next = [...current];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  const closeAdd = () => {
    setAdding(false);
    setSearch("");
    setPicked([]);
  };
  const addSelected = () => {
    setLinks((current) =>
      hospitalFirst([
        ...current,
        ...picked
          .filter((id) => !current.some((row) => row.location_id === id))
          .map((id, i) => ({
            location_id: id,
            enabled: true,
            display_order: current.length + i,
            consultation_availability: "",
            consultation_schedule: normalizeSchedule(null),
            public_name: "",
            map_url: "",
          })),
      ]),
    );
    closeAdd();
  };
  const additional = links.filter((row) => row.location_id !== HOSPITAL_ID);

  return (
    <section className="rounded-md border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold">Locations</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Assign the locations where this doctor consults. Select from locations already created
            in the Locations CMS.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {readOnly
              ? "Only Super Admins and Admins can manage locations."
              : "Changes apply only when the doctor is saved."}
          </p>
        </div>
        {!readOnly && !adding ? (
          <Button type="button" onClick={() => setAdding(true)}>
            <Plus className="size-4" /> Add Location
          </Button>
        ) : null}
      </div>

      {adding && !readOnly ? (
        <div className="mt-5 rounded-md border border-border bg-secondary p-4">
          <h4 className="font-semibold">Add location</h4>
          <Label htmlFor="location-search" className="mt-3 block">
            Search locations
          </Label>
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="location-search"
              className="pl-9"
              placeholder="Search by location name or area..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="mt-3 grid max-h-80 gap-2 overflow-y-auto">
            {available.length ? (
              available.map((o) => (
                <label
                  key={o.id}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-card p-3 text-sm"
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={picked.includes(o.id)}
                    onCheckedChange={(checked) =>
                      setPicked((current) =>
                        checked === true ? [...current, o.id] : current.filter((id) => id !== o.id),
                      )
                    }
                  />
                  <span className="min-w-0">
                    <span className="block font-medium">{o.name}</span>
                    {area(o) ? (
                      <span className="block text-muted-foreground">{area(o)}</span>
                    ) : null}
                    {o.address_line ? (
                      <span className="block text-xs text-muted-foreground">{address(o)}</span>
                    ) : null}
                    {!o.published ? (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Not published in the Locations CMS — won't show publicly.
                      </span>
                    ) : null}
                  </span>
                </label>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                {options.length && !term
                  ? "All existing locations are already assigned. Create new locations in the Locations CMS."
                  : "No matching locations."}
              </p>
            )}
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeAdd}>
              Cancel
            </Button>
            <Button type="button" disabled={!picked.length} onClick={addSelected}>
              Add selected location{picked.length > 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      ) : null}

      <h4 className="mt-6 font-semibold">Assigned Locations</h4>
      {query.isLoading ? (
        <p className="mt-2 text-sm text-muted-foreground">Loading locations…</p>
      ) : (
        <fieldset disabled={readOnly} className="mt-3 grid gap-4">
          {links.map((row, index) => {
            const o = byId.get(row.location_id);
            const isHospital = row.location_id === HOSPITAL_ID;
            const id = `loc-${row.location_id}`;
            return (
              <article key={row.location_id} className="rounded-md border border-border bg-card">
                <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
                  <div className="flex min-w-0 gap-3">
                    <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="font-semibold leading-snug">{o?.name ?? "Unknown location"}</p>
                      {area(o) ? <p className="text-sm text-muted-foreground">{area(o)}</p> : null}
                      {isHospital ? (
                        <>
                          <p className="mt-1 text-xs font-medium text-primary">
                            Main hospital · always shown first
                          </p>
                          <p className="text-xs text-muted-foreground">
                            The main hospital is required for every doctor and cannot be removed.
                          </p>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {!readOnly && !isHospital ? (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Move ${o?.name ?? "location"} up`}
                        disabled={index === 0 || links[index - 1]?.location_id === HOSPITAL_ID}
                        onClick={() => move(row.location_id, -1)}
                      >
                        <ChevronUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Move ${o?.name ?? "location"} down`}
                        disabled={index === links.length - 1}
                        onClick={() => move(row.location_id, 1)}
                      >
                        <ChevronDown className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() =>
                          setLinks((current) =>
                            current.filter((item) => item.location_id !== row.location_id),
                          )
                        }
                      >
                        <Trash2 className="size-4" /> Remove
                      </Button>
                    </div>
                  ) : null}
                </header>
                <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                  <div className="text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Location
                    </p>
                    <p className="mt-1">{address(o) || "No address on the location record."}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      From the central Location record.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:col-span-2">
                      Doctor-specific settings
                    </p>
                    <div className="sm:col-span-2">
                      <ConsultationScheduleEditor
                        id={id}
                        value={row.consultation_schedule}
                        legacyText={row.legacy_text}
                        onChange={(next) => update(row.location_id, { consultation_schedule: next })}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${id}-public-name`}>Public display name</Label>
                      <Input
                        id={`${id}-public-name`}
                        className="mt-1"
                        value={row.public_name ?? ""}
                        onChange={(e) => update(row.location_id, { public_name: e.target.value })}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Optional. Use this if the doctor should see a different location name
                        publicly.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor={`${id}-map`}>Map URL</Label>
                      <Input
                        id={`${id}-map`}
                        className="mt-1"
                        type="url"
                        value={row.map_url ?? ""}
                        onChange={(e) => update(row.location_id, { map_url: e.target.value })}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Leave blank to use the location's default map.
                      </p>
                    </div>
                    <div className="flex items-start gap-3 sm:col-span-2">
                      <Switch
                        id={`${id}-enabled`}
                        checked={row.enabled}
                        onCheckedChange={(checked) => update(row.location_id, { enabled: checked })}
                      />
                      <div>
                        <Label htmlFor={`${id}-enabled`}>Enabled</Label>
                        <p className="text-xs text-muted-foreground">
                          Turn off if this location should not currently appear on the doctor's
                          public profile.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
          {!links.length ? (
            <p className="text-sm text-muted-foreground">No locations assigned to this doctor.</p>
          ) : !additional.length ? (
            <p className="text-sm text-muted-foreground">
              No additional locations assigned to this doctor.
            </p>
          ) : null}
        </fieldset>
      )}
    </section>
  );
}
