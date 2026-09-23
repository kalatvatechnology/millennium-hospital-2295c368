import {
  DEFAULT_APPOINTMENT_TEXT,
  WEEK_DAYS,
  formatTime,
  normalizeSchedule,
} from "@/components/admin/consultation-schedule-editor";

export type ScheduleGroup = { days: string; value: string; closed: boolean };

const SHORT = WEEK_DAYS.map((d) => d.slice(0, 3));

/** Label a set of day indexes using the shortest form: "Mon–Thu", "Mon, Wed, Fri", "Mon–Wed, Sat". */
function dayLabel(indexes: number[]): string {
  const runs: number[][] = [];
  for (const i of indexes) {
    const last = runs[runs.length - 1];
    if (last && last[last.length - 1] === i - 1) last.push(i);
    else runs.push([i]);
  }
  return runs
    .map((run) =>
      run.length === 1 ? SHORT[run[0]!] : `${SHORT[run[0]!]}–${SHORT[run[run.length - 1]!]}`,
    )
    .join(", ");
}

/**
 * Presentation-only grouping of a stored weekly schedule. Days are merged only when
 * status, times and appointment text are identical. Returns null when no schedule is stored.
 */
export function groupSchedule(raw: unknown): ScheduleGroup[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const days = normalizeSchedule(raw);
  if (!days.some((d) => d.status !== "unavailable")) return null;

  const groups = new Map<string, { indexes: number[]; value: string; closed: boolean }>();
  days.forEach((d, index) => {
    const value =
      d.status === "available"
        ? `${formatTime(d.start)} – ${formatTime(d.end)}`
        : d.status === "appointment"
          ? d.text.trim() || DEFAULT_APPOINTMENT_TEXT
          : "Closed";
    const key = `${d.status}|${value}`;
    const group = groups.get(key) ?? { indexes: [], value, closed: d.status === "unavailable" };
    group.indexes.push(index);
    groups.set(key, group);
  });

  return [...groups.values()]
    .sort((a, b) => Number(a.closed) - Number(b.closed) || a.indexes[0]! - b.indexes[0]!)
    .map((g) => ({ days: dayLabel(g.indexes), value: g.value, closed: g.closed }));
}
