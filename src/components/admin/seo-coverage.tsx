import { Link } from "@tanstack/react-router";
import { Check, Minus, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/admin/seo-ui";
import { useAdminSession } from "@/hooks/use-admin-session";
import { seoFixTarget } from "@/lib/seo/fix-links";
import {
  COVERAGE_STATUS_LABELS,
  type CoverageEvidence,
  type CoverageResult,
  type CoverageStatus,
  type StatusCounts,
} from "@/lib/seo/coverage";
import { SEO_TARGET_TYPE_LABELS, SEO_TARGET_TYPES, type SeoTargetType } from "@/lib/seo/types";

const TONES: Record<CoverageStatus, { dot: string; className: string }> = {
  covered: { dot: "bg-primary", className: "bg-primary/10 text-primary" },
  partially_covered: { dot: "bg-warning-foreground", className: "bg-warning text-warning-foreground" },
  review_needed: { dot: "bg-warning-foreground", className: "bg-warning text-warning-foreground" },
  not_covered: { dot: "bg-destructive", className: "bg-destructive/10 text-destructive" },
  needs_setup: { dot: "bg-muted-foreground", className: "bg-muted text-muted-foreground" },
};

/** Calculated coverage status — styled like the existing SEO StatusPill. */
export function CoverageStatusPill({ status }: { status: CoverageStatus }) {
  const tone = TONES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold",
        tone.className,
      )}
    >
      <span className={cn("size-2 rounded-full", tone.dot)} aria-hidden />
      {COVERAGE_STATUS_LABELS[status]}
    </span>
  );
}

export function CoverageSummaryCards({ counts }: { counts: StatusCounts }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <MetricCard label="Total target keywords" value={counts.total} />
      <MetricCard label="Covered" value={counts.covered} />
      <MetricCard label="Partially covered" value={counts.partially_covered} />
      <MetricCard label="Not covered" value={counts.not_covered} />
      <MetricCard label="Needs setup" value={counts.needs_setup} />
      <MetricCard label="Review needed" value={counts.review_needed} />
    </div>
  );
}

function EvidenceIcon({ result }: { result: CoverageEvidence["result"] }) {
  if (result === "pass") return <Check className="size-4 text-primary" aria-label="Pass" />;
  if (result === "fail") return <X className="size-4 text-destructive" aria-label="Missing" />;
  if (result === "warn")
    return <TriangleAlert className="size-4 text-warning-foreground" aria-label="Review" />;
  return <Minus className="size-4 text-muted-foreground" aria-label="Not applicable" />;
}

/** Read-only explanation of one keyword's coverage, with existing "Fix issue" links. */
export function CoverageDetail({ result }: { result: CoverageResult }) {
  const { can } = useAdminSession();
  const entity = result.entity;
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <CoverageStatusPill status={result.status} />
        {result.paused ? (
          <span className="text-xs text-muted-foreground">Paused — excluded from gap counts.</span>
        ) : null}
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Primary target</dt>
          <dd className="font-medium">
            {result.primaryType
              ? `${SEO_TARGET_TYPE_LABELS[result.primaryType]} → ${result.primaryLabel ?? "Unavailable record"}`
              : "Not set"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Location</dt>
          <dd className="font-medium">
            {result.location
              ? `${result.location.name}${result.locationSource === "keyword" ? " (named in keyword)" : ""}`
              : "None — generic keyword"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Target URL</dt>
          <dd className="break-all font-medium">{result.resolvedUrl ?? "—"}</dd>
        </div>
      </dl>
      {result.location ? (
        <p className="text-sm text-muted-foreground">
          Core phrase checked on the page: <span className="font-medium text-foreground">“{result.corePhrase}”</span>
        </p>
      ) : null}

      <ul className="grid">
        {result.evidence.map((item) => {
          const fix =
            entity && item.fixIssueKey && (item.result === "fail" || item.result === "warn")
              ? seoFixTarget(item.fixIssueKey, entity)
              : null;
          const link = fix && !("manual" in fix) ? fix : null;
          return (
            <li
              key={item.key}
              className="flex flex-wrap items-start justify-between gap-3 border-b border-border py-3 text-sm last:border-0"
            >
              <div className="flex min-w-0 gap-3">
                <span className="mt-0.5">
                  <EvidenceIcon result={item.result} />
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-muted-foreground">{item.detail}</p>
                  {link?.publishNote ? (
                    <p className="text-xs text-muted-foreground">{link.publishNote}</p>
                  ) : null}
                </div>
              </div>
              {link && can(link.permission) ? (
                <Button asChild size="sm" variant="outline">
                  <Link
                    to={link.link.to as never}
                    params={link.link.params as never}
                    search={link.link.search as never}
                  >
                    Fix issue →
                  </Link>
                </Button>
              ) : fix && "manual" in fix ? (
                <span className="text-xs text-muted-foreground">{fix.reason}</span>
              ) : null}
            </li>
          );
        })}
      </ul>

      {result.conflicts.length ? (
        <div className="grid gap-2">
          <p className="text-sm font-semibold">Competing pages</p>
          {result.conflicts.map((conflict, index) => (
            <div key={index} className="rounded-md border border-border p-3 text-sm">
              <p>{conflict.detail}</p>
              {conflict.pages.length ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {conflict.pages.map((page) => `${page.label}${page.path ? ` (${page.path})` : ""}`).join(" · ")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-2">
        <p className="text-sm font-semibold">Recommendation</p>
        {result.recommendations.length ? (
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            {result.recommendations.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No action needed.</p>
        )}
      </div>
    </div>
  );
}

/** Status counts per primary target type (dashboard breakdown). */
export function CoverageTypeBreakdown({
  counts,
}: {
  counts: Record<SeoTargetType, StatusCounts & { gaps: number }>;
}) {
  const headers = ["Covered", "Partial", "Review", "Not covered", "Setup", "Gaps"];
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-background">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-muted text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Primary target</th>
            <th className="px-4 py-3 text-right font-medium">Keywords</th>
            {headers.map((label) => (
              <th key={label} className="px-4 py-3 text-right font-medium">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SEO_TARGET_TYPES.map((type) => {
            const row = counts[type];
            return (
              <tr key={type} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{SEO_TARGET_TYPE_LABELS[type]}</td>
                <td className="px-4 py-3 text-right">{row.total}</td>
                <td className="px-4 py-3 text-right">{row.covered}</td>
                <td className="px-4 py-3 text-right">{row.partially_covered}</td>
                <td className="px-4 py-3 text-right">{row.review_needed}</td>
                <td className="px-4 py-3 text-right">{row.not_covered}</td>
                <td className="px-4 py-3 text-right">{row.needs_setup}</td>
                <td className="px-4 py-3 text-right font-semibold">{row.gaps}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
