/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Eye, ImageOff, MoreHorizontal, Pencil, Plus } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { FilterSelect, Pagination, SearchField, StatusBadge } from "@/components/admin/ui";
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
  const [doctors, services] = await Promise.all([
    supabase.from("doctor_departments").select("department_id").limit(5000),
    supabase.from("professional_service_departments").select("department_id").limit(5000),
  ]);
  if (doctors.error) throw classifyDataError(doctors.error);
  if (services.error) throw classifyDataError(services.error);
  const tally = (rows: { department_id: string }[]) =>
    rows.reduce<Record<string, number>>((acc, r) => ((acc[r.department_id] = (acc[r.department_id] ?? 0) + 1), acc), {});
  return { doctors: tally(doctors.data ?? []), services: tally(services.data ?? []) };
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
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4">
        {[
          ["Total departments", metrics.total],
          ["Published", metrics.published],
          ["Drafts", metrics.drafts],
          ["Average completion", `${metrics.avg}%`],
        ].map(([label, value]) => (
          <div key={label} className="bg-background px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-primary">{records.isPending ? "—" : value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <SearchField value={search} onChange={reset(setSearch)} placeholder="Search departments" />
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

      <div className="mt-6">
        {records.isPending ? (
          <LoadingState />
        ) : records.isError ? (
          <ErrorState />
        ) : rows.length === 0 ? (
          <EmptyState title="No departments found" description="Try a different search or filter." />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-background shadow-[var(--shadow-sm)]">
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

function DepartmentRow({ row, insight, canWrite, countsReady }: { row: Record<string, any>; insight: DepartmentInsight; canWrite: boolean; countsReady: boolean }) {
  const ready = READINESS[insight.readiness];
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
  return (
    <li className="grid gap-4 p-4 md:grid-cols-[8rem_minmax(0,1fr)_11rem_auto] md:items-center">
      <div className="aspect-video w-32 overflow-hidden rounded-md border border-border bg-surface">
        {insight.cardImage ? (
          <img src={insight.cardImage} alt="" className="size-full object-cover" loading="lazy" />
        ) : (
          <div className="grid size-full place-items-center content-center gap-1 text-muted-foreground">
            <ImageOff className="size-4" aria-hidden />
            <span className="text-xs font-medium">Image required</span>
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{row["name"] || "Untitled"}</p>
          <StatusBadge status={insight.published ? "published" : "draft"} tone={insight.published ? "positive" : "neutral"} />
        </div>
        <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{row["short_description"] || "No short description yet"}</p>
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{countsReady ? `${plural(insight.doctors, "Doctor")} · ${plural(insight.services, "Service")}` : "Counting…"}</span>
          <span className={cn(insight.seoReady ? "text-primary" : "text-destructive")}>SEO • {insight.seoReady ? "Ready" : "Needs attention"}</span>
          <span>{relativeUpdated(insight.updatedAt)}</span>
        </p>
        {insight.attention.length ? (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Attention:</span> {insight.attention.slice(0, 3).join(" · ")}
            {insight.attention.length > 3 ? ` +${insight.attention.length - 3} more` : ""}
          </p>
        ) : null}
      </div>

      <div>
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">Profile</span>
          <span className="font-semibold tabular-nums">{insight.percentage}% complete</span>
        </div>
        <progress value={insight.percentage} max={100} aria-label={`${row["name"]} profile completion`} className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary" />
        <div className="mt-2"><StatusBadge status={ready.label} tone={ready.tone} /></div>
      </div>

      <div className="flex items-center gap-2 md:justify-end">
        {canWrite ? (
          <Button asChild size="sm" variant="outline">
            <Link to="/_admin/departments/$departmentId/$section" params={{ departmentId: String(row["id"]), section: "identity" }}>
              <Pencil className="size-4" /> Edit
            </Link>
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">View only</span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" aria-label={`More actions for ${row["name"]}`}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canWrite ? (
              <DropdownMenuItem asChild>
                <Link to="/_admin/departments/$departmentId/$section" params={{ departmentId: String(row["id"]), section: "identity" }}><Pencil className="size-4" /> Edit</Link>
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
