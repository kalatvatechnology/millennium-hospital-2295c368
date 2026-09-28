import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DataTable, FilterSelect, SearchField, type Column } from "@/components/admin/ui";
import {
  CoverageDetail,
  CoverageStatusPill,
  CoverageSummaryCards,
} from "@/components/admin/seo-coverage";
import { LoadingState } from "@/components/shared/page";
import { createPageMeta } from "@/lib/seo";
import { useSeoCoverage } from "@/hooks/use-seo-coverage";
import {
  COVERAGE_STATUSES,
  COVERAGE_STATUS_LABELS,
  countStatuses,
  groupCoverage,
  isGap,
  type CoverageDimension,
  type CoverageGroup,
  type CoverageResult,
} from "@/lib/seo/coverage";
import { SEO_TARGET_TYPE_LABELS } from "@/lib/seo/types";

export const Route = createFileRoute("/_admin/seo-coverage")({
  head: () => ({
    meta: [
      ...createPageMeta(
        "SEO coverage",
        "How well each target keyword is covered on its intended page.",
      ),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SeoCoverage,
});

const VIEWS: { value: "keywords" | CoverageDimension | "conflicts"; label: string }[] = [
  { value: "keywords", label: "Keywords" },
  { value: "page", label: "Target pages" },
  { value: "department", label: "Departments" },
  { value: "professional_service", label: "Professional services" },
  { value: "hospital_service", label: "Hospital services" },
  { value: "doctor", label: "Doctors" },
  { value: "location_context", label: "Locations" },
  { value: "website_page", label: "Website pages" },
  { value: "blog_post", label: "Blog" },
  { value: "conflicts", label: "Targeting conflicts" },
];

function SeoCoverage() {
  const coverage = useSeoCoverage();
  const [view, setView] = useState<(typeof VIEWS)[number]["value"]>("keywords");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const counts = countStatuses(coverage.results);
  const activeGaps = coverage.results.filter(isGap).length;

  const keywordRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return coverage.results.filter(
      (row) =>
        (!term || row.keyword.toLowerCase().includes(term)) &&
        (status === "all" || row.status === status) &&
        (view !== "conflicts" || row.conflicts.length > 0),
    );
  }, [coverage.results, search, status, view]);

  const groups = useMemo(
    () =>
      view === "keywords" || view === "conflicts"
        ? []
        : groupCoverage(coverage.results, view as CoverageDimension),
    [coverage.results, view],
  );

  const keywordColumns: Column<CoverageResult>[] = [
    {
      key: "keyword",
      header: "Keyword",
      cell: (row) => (
        <Link
          to="/_admin/seo-target/$targetId"
          params={{ targetId: row.targetId }}
          className="font-medium text-primary underline"
        >
          {row.keyword}
        </Link>
      ),
    },
    {
      key: "target",
      header: "Primary target",
      cell: (row) =>
        row.primaryType
          ? `${SEO_TARGET_TYPE_LABELS[row.primaryType]} → ${row.primaryLabel ?? "Unavailable"}`
          : "Not set",
    },
    { key: "location", header: "Location", cell: (row) => row.location?.name ?? "—" },
    { key: "coverage", header: "Coverage", cell: (row) => <CoverageStatusPill status={row.status} /> },
    {
      key: "action",
      header: "Action",
      cell: (row) => (
        <button
          type="button"
          className="text-left text-sm text-primary underline"
          onClick={() => setOpenId(openId === row.targetId ? null : row.targetId)}
        >
          {openId === row.targetId ? "Hide evidence" : row.recommendations[0] ?? "View evidence"}
        </button>
      ),
    },
  ];

  const groupColumns: Column<CoverageGroup>[] = [
    {
      key: "label",
      header: VIEWS.find((item) => item.value === view)?.label ?? "Group",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.label}</p>
          {row.path ? <p className="text-xs text-muted-foreground">{row.path}</p> : null}
        </div>
      ),
    },
    { key: "total", header: "Keywords", cell: (row) => row.counts.total },
    { key: "covered", header: "Covered", cell: (row) => row.counts.covered },
    { key: "partial", header: "Partial", cell: (row) => row.counts.partially_covered },
    { key: "review", header: "Review", cell: (row) => row.counts.review_needed },
    { key: "not", header: "Not covered", cell: (row) => row.counts.not_covered },
    { key: "gaps", header: "Gaps", cell: (row) => <span className="font-semibold">{row.gaps}</span> },
    {
      key: "keywords",
      header: "Keywords with gaps",
      cell: (row) =>
        row.results
          .filter(isGap)
          .map((item) => item.keyword)
          .join(", ") || "—",
    },
  ];

  const open = openId ? coverage.byTarget.get(openId) : undefined;

  return (
    <AdminShell
      title="SEO coverage"
      description="How well the website covers each target keyword on its intended page. Calculated from live content — separate from keyword status and from Google data."
      requires="seo.read"
    >
      {coverage.isPending ? (
        <LoadingState />
      ) : (
        <div className="grid gap-8">
          <CoverageSummaryCards counts={counts} />
          <p className="text-sm text-muted-foreground">
            {activeGaps} active keyword{activeGaps === 1 ? "" : "s"} need work. Paused keywords are
            evaluated but not counted as gaps.
          </p>

          <div className="flex flex-wrap items-end gap-4">
            <FilterSelect
              label="View by"
              value={view}
              onChange={(next) => setView(next as typeof view)}
              options={VIEWS.map((item) => ({ value: item.value, label: item.label }))}
            />
            {view === "keywords" || view === "conflicts" ? (
              <>
                <SearchField
                  value={search}
                  onChange={setSearch}
                  label="Search keywords"
                  placeholder="Search keywords"
                />
                <FilterSelect
                  label="Coverage"
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: "all", label: "All coverage" },
                    ...COVERAGE_STATUSES.map((value) => ({ value, label: COVERAGE_STATUS_LABELS[value] })),
                  ]}
                />
              </>
            ) : null}
          </div>

          {view === "keywords" || view === "conflicts" ? (
            <DataTable
              rows={keywordRows}
              columns={keywordColumns}
              getRowId={(row) => row.targetId}
              isError={coverage.isError}
              emptyTitle={view === "conflicts" ? "No targeting conflicts" : "No target keywords"}
              emptyDescription={
                view === "conflicts"
                  ? "No keyword competes with another page."
                  : "Add target keywords to see how well they are covered."
              }
            />
          ) : (
            <DataTable
              rows={groups}
              columns={groupColumns}
              getRowId={(row) => row.key}
              isError={coverage.isError}
              emptyTitle="Nothing to show"
              emptyDescription="No target keywords point at this kind of page yet."
            />
          )}

          {open ? (
            <section className="rounded-lg border border-border bg-background p-5">
              <h2 className="mb-4 text-lg font-semibold">Evidence — {open.keyword}</h2>
              <CoverageDetail result={open} />
            </section>
          ) : null}
        </div>
      )}
    </AdminShell>
  );
}
