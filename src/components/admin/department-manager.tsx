/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Eye, ImageOff, MoreHorizontal, Pencil, Plus } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { FilterSelect, Pagination, SearchField } from "@/components/admin/ui";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/page";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminSession } from "@/hooks/use-admin-session";
import { supabase } from "@/integrations/supabase/client";
import { listRecords, type ContentType } from "@/lib/admin-content";
import { classifyDataError } from "@/lib/data/errors";
import { getDepartmentInsight, type DepartmentInsight } from "@/lib/department-dashboard";
import { relativeUpdated } from "@/lib/profile-scoring";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

async function relationshipCounts() {
  // Saved relationship rows only; unsaved editor changes are never counted.
  const [doctors, services, faqs, media] = await Promise.all([
    supabase.from("doctor_departments").select("department_id").limit(5000),
    supabase.from("professional_service_departments").select("department_id").limit(5000),
    supabase.from("department_faqs").select("department_id").limit(5000),
    supabase.from("media_departments").select("department_id").limit(5000),
  ]);
  for (const r of [doctors, services, faqs, media]) if (r.error) throw classifyDataError(r.error);
  const tally = (rows: { department_id: string }[]) =>
    rows.reduce<Record<string, number>>((acc, r) => ((acc[r.department_id] = (acc[r.department_id] ?? 0) + 1), acc), {});
  return { doctors: tally(doctors.data ?? []), services: tally(services.data ?? []), faqs: tally(faqs.data ?? []), media: tally(media.data ?? []) };
}

const READINESS = {
  ready: { label: "Ready", tone: "positive" },
  attention: { label: "Needs attention", tone: "warning" },
  not_ready: { label: "Not ready", tone: "critical" },
} as const;

export function DepartmentManager({ type }: { type: ContentType }) {
  const { can } = useAdminSession();
  const canWrite = can("content.write");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [readiness, setReadiness] = useState("all");
  const [seo, setSeo] = useState("all");
  const [page, setPage] = useState(1);

  const records = useQuery({ queryKey: ["admin-content", type.table], queryFn: () => listRecords(type) });
  const counts = useQuery({ queryKey: ["admin-department-counts"], queryFn: relationshipCounts });

  const enriched = useMemo(
    () =>
      (records.data ?? []).map((row) => ({
        row,
        insight: getDepartmentInsight(row, {
          doctors: counts.data?.doctors[row["id"]] ?? 0,
          services: counts.data?.services[row["id"]] ?? 0,
          faqs: counts.data?.faqs[row["id"]] ?? 0,
          media: counts.data?.media[row["id"]] ?? 0,
        }),
      })),
    [records.data, counts.data],
  );

  const metrics = useMemo(() => {
    const total = enriched.length;
    const published = enriched.filter((e) => e.insight.published).length;
    const avg = total ? Math.round(enriched.reduce((s, e) => s + e.insight.percentage, 0) / total) : 0;
    return { total, published, drafts: total - published, avg };
  }, [enriched]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return enriched.filter(({ row, insight }) => {
      if (term && !`${row["name"] ?? ""} ${row["slug"] ?? ""} ${row["short_description"] ?? ""}`.toLowerCase().includes(term)) return false;
      if (status !== "all" && (status === "published") !== insight.published) return false;
      if (readiness !== "all" && insight.readiness !== readiness) return false;
      if (seo !== "all" && (seo === "ready") !== insight.seoReady) return false;
      return true;
    });
  }, [enriched, search, status, readiness, seo]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const reset = <T,>(fn: (v: T) => void) => (v: T) => (fn(v), setPage(1));

  return (
    <AdminShell
      title={type.label}
      description={type.description}
      requires="content.read"
      actions={
        canWrite ? (
          <Button asChild>
            <Link to="/_admin/content/$contentType/$recordId" params={{ contentType: type.key, recordId: "new" }}>
              <Plus className="size-4" /> Add Department
            </Link>
          </Button>
        ) : null
      }
    >
      <dl className="grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-background lg:grid-cols-4">
        {[
          ["Total departments", metrics.total],
          ["Published", metrics.published],
          ["Drafts", metrics.drafts],
          ["Average completion", `${metrics.avg}%`],
        ].map(([label, value], i) => (
          <div
            key={label}
            className={cn(
              "px-5 py-4",
              i % 2 === 1 && "border-l border-border",
              i >= 2 && "border-t border-border lg:border-t-0",
              i === 2 && "lg:border-l",
            )}
          >
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</dt>
            <dd
              className={cn(
                "mt-1.5 font-semibold tabular-nums leading-none text-foreground",
                i === 3 ? "text-3xl text-primary" : "text-2xl",
              )}
            >
              {records.isPending || counts.isPending ? "—" : value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 grid gap-3 rounded-lg border border-border bg-background p-3 sm:grid-cols-3 sm:p-4 xl:grid-cols-[minmax(0,1fr)_11rem_11rem_11rem] [&_label]:text-xs [&_label]:font-medium [&_label]:text-muted-foreground [&>div]:min-w-0">
        <div className="sm:col-span-3 xl:col-span-1 [&>div]:min-w-0">
          <SearchField value={search} onChange={reset(setSearch)} placeholder="Search departments" />
        </div>
        <FilterSelect label="Status" value={status} onChange={reset(setStatus)} options={[
          { value: "all", label: "All" },
          { value: "published", label: "Published" },
          { value: "draft", label: "Draft" },
        ]} />
        <FilterSelect label="Readiness" value={readiness} onChange={reset(setReadiness)} options={[
          { value: "all", label: "All" },
          { value: "ready", label: "Ready" },
          { value: "attention", label: "Needs attention" },
          { value: "not_ready", label: "Not ready" },
        ]} />
        <FilterSelect label="SEO" value={seo} onChange={reset(setSeo)} options={[
          { value: "all", label: "All" },
          { value: "ready", label: "Ready" },
          { value: "attention", label: "Needs attention" },
        ]} />
      </div>

      <div className="mt-5">
        {records.isPending ? (
          <LoadingState />
        ) : records.isError ? (
          <ErrorState />
        ) : rows.length === 0 ? (
          <EmptyState title="No departments found" description="Try a different search or filter." />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-background">
            {rows.map(({ row, insight }) => (
              <DepartmentRow key={row["id"]} row={row} insight={insight} canWrite={canWrite} countsReady={!counts.isPending} />
            ))}
          </ul>
        )}
        <Pagination page={currentPage} pageCount={pageCount} total={filtered.length} onPageChange={setPage} />
      </div>
    </AdminShell>
  );
}

const READINESS_STYLE = {
  ready: { dot: "bg-success", text: "text-success-foreground" },
  attention: { dot: "bg-warning", text: "text-warning-foreground" },
  not_ready: { dot: "bg-destructive", text: "text-destructive" },
} as const;

function DepartmentRow({ row, insight, canWrite, countsReady }: { row: Record<string, any>; insight: DepartmentInsight; canWrite: boolean; countsReady: boolean }) {
  const ready = READINESS[insight.readiness];
  const readyStyle = READINESS_STYLE[insight.readiness];
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const editParams = { departmentId: String(row["id"]), section: "identity" };
  const [firstIssue, ...moreIssues] = insight.attention;
  return (
    <li className="grid grid-cols-[5rem_minmax(0,1fr)] gap-x-4 gap-y-3 px-4 py-3.5 transition-colors hover:bg-surface/40 md:grid-cols-[5rem_minmax(0,1fr)_9.5rem_auto] md:items-center xl:grid-cols-[5rem_minmax(0,1fr)_11rem_auto] xl:gap-x-6 xl:px-5">
      <div className="aspect-video w-20 overflow-hidden rounded-md border border-border bg-surface">
        {insight.cardImage ? (
          <img src={insight.cardImage} alt="" className="size-full object-cover" loading="lazy" />
        ) : (
          <div
            className="grid size-full place-items-center content-center gap-0.5 text-muted-foreground"
            title="Card / OG image missing"
          >
            <ImageOff className="size-3.5" aria-hidden />
            <span className="text-[10px] font-medium leading-none">Image required</span>
            <span className="sr-only">Card / OG image missing</span>
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate text-[15px] font-semibold leading-tight text-foreground">{row["name"] || "Untitled"}</p>
          <span
            className={cn(
              "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium leading-none",
              insight.published ? "bg-success/10 text-success-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {insight.published ? "Published" : "Draft"}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{row["short_description"] || "No short description yet"}</p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
          <span>{countsReady ? `${plural(insight.doctors, "Doctor")} · ${plural(insight.services, "Service")}` : "Counting…"}</span>
          <span aria-hidden>·</span>
          <span className={cn("font-medium", insight.seoReady ? "text-success-foreground" : "text-foreground")}>
            SEO {insight.seoReady ? "ready" : "needs attention"}
          </span>
          <span aria-hidden className="hidden xl:inline">·</span>
          <span className="hidden xl:inline">{relativeUpdated(insight.updatedAt)}</span>
        </p>
        {firstIssue ? (
          <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs">
            <span className="shrink-0 font-semibold text-warning-foreground">Attention</span>
            <span aria-hidden className="text-muted-foreground">·</span>
            <span className="truncate text-foreground">{firstIssue}</span>
            {moreIssues.length ? (
              canWrite ? (
                <Link
                  to="/_admin/departments/$departmentId/$section"
                  params={editParams}
                  title={moreIssues.join(" · ")}
                  aria-label={`${moreIssues.length} more issues for ${row["name"]}: ${moreIssues.join(", ")}`}
                  className="shrink-0 rounded font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  +{moreIssues.length} more
                </Link>
              ) : (
                <span className="shrink-0 text-muted-foreground" title={moreIssues.join(" · ")}>+{moreIssues.length} more</span>
              )
            ) : null}
          </p>
        ) : null}
      </div>

      <div className="col-start-2 md:col-start-auto">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Profile</span>
          {countsReady ? (
            <span className="text-right leading-none">
              <span className="text-xl font-semibold tabular-nums text-foreground">{insight.percentage}%</span>
              <span className="ml-1 hidden text-xs text-muted-foreground xl:inline">complete</span>
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Calculating…</span>
          )}
        </div>
        <progress value={countsReady ? insight.percentage : 0} max={100} aria-label={`${row["name"]} profile completion`} className="mt-2 h-1 w-full overflow-hidden rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary" />
        <p className={cn("mt-2 flex items-center gap-1.5 text-xs font-medium", readyStyle.text)}>
          <span aria-hidden className={cn("size-1.5 rounded-full", readyStyle.dot)} />
          {ready.label}
        </p>
      </div>

      <div className="col-start-2 flex items-center gap-1.5 md:col-start-auto md:justify-end">
        {canWrite ? (
          <Button asChild size="sm" variant="outline">
            <Link to="/_admin/departments/$departmentId/$section" params={editParams} aria-label={`Edit ${row["name"]}`}>
              <Pencil className="size-4" /> Edit
            </Link>
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">View only</span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="size-8" aria-label={`More actions for ${row["name"]}`}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canWrite ? (
              <DropdownMenuItem asChild>
                <Link to="/_admin/departments/$departmentId/$section" params={editParams}><Pencil className="size-4" /> Edit</Link>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem asChild>
              <a href={`/departments/${row["slug"]}?preview=1`} target="_blank" rel="noreferrer"><Eye className="size-4" /> Preview draft</a>
            </DropdownMenuItem>
            {insight.published ? (
              <DropdownMenuItem asChild>
                <a href={`/departments/${row["slug"]}`} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /> View public page</a>
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
