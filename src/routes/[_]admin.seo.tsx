import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { InlineNotice, MetricCard, StatusPill } from "@/components/admin/seo-ui";
import { LoadingState } from "@/components/shared/page";
import { createPageMeta } from "@/lib/seo";
import { useAdminSession } from "@/hooks/use-admin-session";
import { userFacingDataError } from "@/lib/data/errors";
import { onPageIssues, overallStatus } from "@/lib/seo/audit";
import {
  fetchSeoEntities,
  listSeoDataSources,
  listSeoScans,
  listTargetKeywords,
  listWebsiteKeywords,
  runWebsiteKeywordScan,
} from "@/lib/data/seo-repository";

export const Route = createFileRoute("/_admin/seo")({
  head: () => ({
    meta: [
      ...createPageMeta("SEO dashboard", "An overview of the hospital website's SEO health."),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SeoDashboard,
});

function SeoDashboard() {
  const { can, profile } = useAdminSession();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const keywords = useQuery({ queryKey: ["seo-keywords"], queryFn: listWebsiteKeywords });
  const targets = useQuery({ queryKey: ["seo-targets"], queryFn: listTargetKeywords });
  const scans = useQuery({ queryKey: ["seo-scans"], queryFn: listSeoScans });
  const sources = useQuery({ queryKey: ["seo-data-sources"], queryFn: listSeoDataSources });
  const entities = useQuery({ queryKey: ["seo-entities"], queryFn: fetchSeoEntities });

  const scan = useMutation({
    mutationFn: () => runWebsiteKeywordScan(profile?.id ?? null),
    onSuccess: (summary) => {
      setMessage({
        tone: "success",
        text: `Scan complete. ${summary.keywordsDetected} keywords found across ${summary.pagesScanned} published records.`,
      });
      void queryClient.invalidateQueries({ queryKey: ["seo-keywords"] });
      void queryClient.invalidateQueries({ queryKey: ["seo-scans"] });
    },
    onError: (error) => setMessage({ tone: "error", text: userFacingDataError(error) }),
  });

  const published = (entities.data ?? []).filter((entity) => entity.published);
  const issues = onPageIssues(entities.data ?? []);
  const withCompleteMeta = published.filter(
    (entity) => entity.seoTitle?.trim() && entity.metaDescription?.trim(),
  ).length;
  const needingAttention = published.length - withCompleteMeta;
  const openIssues = issues.filter((issue) => issue.status !== "pass");
  const localKeywords = (keywords.data ?? []).filter((row) => row.category === "local").length;
  const lastScan = scans.data?.[0];

  return (
    <AdminShell
      title="SEO dashboard"
      description="A plain overview of how the website's SEO information is set up. Google figures appear only once Google services are connected."
      requires="seo.read"
      actions={
        can("seo.manage") ? (
          <Button onClick={() => scan.mutate()} disabled={scan.isPending}>
            <RefreshCw className="size-4" />
            {scan.isPending ? "Scanning…" : "Scan website keywords"}
          </Button>
        ) : null
      }
    >
      {message ? (
        <div className="mb-6">
          <InlineNotice tone={message.tone}>{message.text}</InlineNotice>
        </div>
      ) : null}

      {entities.isPending ? (
        <LoadingState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="Published pages tracked" value={published.length} />
          <MetricCard
            label="Pages with complete SEO details"
            value={withCompleteMeta}
            hint="Both an SEO title and a meta description are set."
          />
          <MetricCard
            label="Pages needing attention"
            value={needingAttention}
            hint="Missing an SEO title or meta description."
          />
          <MetricCard label="Website keywords" value={keywords.data?.length ?? 0} />
          <MetricCard label="Target keywords" value={targets.data?.length ?? 0} />
          <MetricCard label="Local keywords" value={localKeywords} />
        </div>
      )}

      <section className="mt-10 grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">SEO checks</h2>
          <StatusPill status={overallStatus(issues.map((issue) => issue.status))} />
        </div>
        <ul className="grid gap-2">
          {openIssues.slice(0, 6).map((issue) => (
            <li
              key={issue.key}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-4"
            >
              <div>
                <p className="font-medium">{issue.label}</p>
                <p className="text-sm text-muted-foreground">
                  {issue.entities.length} page(s) affected
                </p>
              </div>
              <StatusPill status={issue.status} />
            </li>
          ))}
          {openIssues.length === 0 && !entities.isPending ? (
            <li className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
              Every on-page check passed.
            </li>
          ) : null}
        </ul>
        <Link to="/_admin/seo-audit" className="text-sm font-semibold text-primary underline">
          Open the full SEO audit
        </Link>
      </section>

      <section className="mt-10 grid gap-4">
        <h2 className="text-xl font-semibold">Data sources</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(sources.data ?? []).map((source) => (
            <div key={source.key} className="rounded-lg border border-border bg-background p-4">
              <p className="font-medium">{source.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {source.status === "connected" ? "Connected" : "Not connected"}
              </p>
              {source.notes ? (
                <p className="mt-2 text-sm text-muted-foreground">{source.notes}</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <p className="mt-8 text-sm text-muted-foreground">
        {lastScan
          ? `Last scanned: ${new Date(lastScan.startedAt).toLocaleString()}`
          : "The website keywords have not been scanned yet."}
      </p>
    </AdminShell>
  );
}
