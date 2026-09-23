import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
export type DayStatus = "available" | "appointment" | "unavailable";
export type ScheduleDay = {
  day: (typeof WEEK_DAYS)[number];
  status: DayStatus;
  start: string;
  end: string;
  text: string;
};
export const DEFAULT_APPOINTMENT_TEXT = "By Appointment Only";

export function normalizeSchedule(value: unknown): ScheduleDay[] {
  const list = Array.isArray(value) ? (value as Partial<ScheduleDay>[]) : [];
  return WEEK_DAYS.map((day) => {
    const found = list.find((d) => d?.day === day);
    const status: DayStatus =
      found?.status === "available" || found?.status === "appointment" ? found.status : "unavailable";
    return {
      day,
      status,
      start: found?.start ?? "10:00",
      end: found?.end ?? "14:00",
      text: found?.text ?? "",
    };
  });
}

export function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  if (h === undefined || Number.isNaN(h)) return t;
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m ?? 0).padStart(2, "0")} ${suffix}`;
}

/** Text summary kept in consultation_availability for existing public display. */
export function scheduleSummary(schedule: ScheduleDay[]): string | null {
  const parts = schedule
    .filter((d) => d.status !== "unavailable")
    .map((d) =>
      d.status === "available"
        ? `${d.day.slice(0, 3)} ${formatTime(d.start)} – ${formatTime(d.end)}`
        : `${d.day.slice(0, 3)} ${d.text.trim() || DEFAULT_APPOINTMENT_TEXT}`,
    );
  return parts.length ? parts.join(" | ") : null;
}

const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  return `${h}:${i % 2 ? "30" : "00"}`;
});
const selectClass =
  "mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ConsultationScheduleEditor({
  id,
  value,
  onChange,
  legacyText,
}: {
  id: string;
  value: ScheduleDay[];
  onChange: (next: ScheduleDay[]) => void;
  legacyText?: string | null;
}) {
  const patch = (day: string, p: Partial<ScheduleDay>) =>
    onChange(value.map((d) => (d.day === day ? { ...d, ...p } : d)));
  return (
    <div>
      <p className="text-sm font-medium">Consultation availability</p>
      {legacyText ? (
        <p className="mt-1 text-xs text-muted-foreground">Previously saved: {legacyText}</p>
      ) : null}
      <div className="mt-2 grid gap-2">
        {value.map((d) => {
          const key = `${id}-${d.day}`;
          const invalid = d.status === "available" && d.end <= d.start;
          return (
            <div
              key={d.day}
              className="grid gap-3 rounded-md border border-border bg-secondary/40 p-3 sm:grid-cols-[7rem_11rem_minmax(0,1fr)] sm:items-end"
            >
              <p className="font-medium sm:pb-2">{d.day}</p>
              <div>
                <Label htmlFor={`${key}-status`} className="text-xs">
                  Status
                </Label>
                <select
                  id={`${key}-status`}
                  className={selectClass}
                  value={d.status}
                  onChange={(e) => patch(d.day, { status: e.target.value as DayStatus })}
                >
                  <option value="available">Available</option>
                  <option value="appointment">By Appointment</option>
                  <option value="unavailable">Not Available</option>
                </select>
              </div>
              {d.status === "available" ? (
                <div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`${key}-start`} className="text-xs">
                        Start Time
                      </Label>
                      <select
                        id={`${key}-start`}
                        className={selectClass}
                        value={d.start}
                        onChange={(e) => patch(d.day, { start: e.target.value })}
                      >
                        {TIMES.map((t) => (
                          <option key={t} value={t}>
                            {formatTime(t)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor={`${key}-end`} className="text-xs">
                        End Time
                      </Label>
                      <select
                        id={`${key}-end`}
                        className={selectClass}
                        value={d.end}
                        onChange={(e) => patch(d.day, { end: e.target.value })}
                      >
                        {TIMES.map((t) => (
                          <option key={t} value={t}>
                            {formatTime(t)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {invalid ? (
                    <p className="mt-1 text-xs text-destructive">End time must be after start time.</p>
                  ) : null}
                </div>
              ) : d.status === "appointment" ? (
                <div>
                  <Label htmlFor={`${key}-text`} className="text-xs">
                    Appointment Text
                  </Label>
                  <Input
                    id={`${key}-text`}
                    className="mt-1"
                    placeholder={DEFAULT_APPOINTMENT_TEXT}
                    value={d.text}
                    onChange={(e) => patch(d.day, { text: e.target.value })}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground sm:pb-2">Not available</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
