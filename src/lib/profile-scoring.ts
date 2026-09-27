/**
 * Reusable weighted profile scoring. Departments use it today; Doctors, Professional
 * Services and Blogs can supply their own section definitions later without UI changes.
 */
export type ScoredSection<K extends string = string> = {
  key: K;
  label: string;
  weight: number;
  /** Sections switched off in the CMS are excluded and the other weights rescale. */
  applicable: boolean;
  /** 0–1 share of this section that is filled in. */
  score: number;
};

export type ReadinessState = "ready" | "attention" | "not_ready";

export function weightedCompletion<K extends string>(sections: ScoredSection<K>[]) {
  const active = sections.filter((s) => s.applicable && s.weight > 0);
  const total = active.reduce((sum, s) => sum + s.weight, 0);
  if (!total) return 100;
  const earned = active.reduce((sum, s) => sum + s.weight * Math.min(1, Math.max(0, s.score)), 0);
  return Math.round((earned / total) * 100);
}

/** Share of truthy checks, used to give partial credit inside a section. */
export const share = (...checks: unknown[]) =>
  checks.length ? checks.filter(Boolean).length / checks.length : 1;

export function relativeUpdated(value: string | null | undefined, now = new Date()) {
  if (!value) return "Not updated yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not updated yet";
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((day(now) - day(date)) / 86_400_000);
  if (diff === 0) return "Updated today";
  if (diff === 1) return "Updated yesterday";
  return `Updated ${date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
}
