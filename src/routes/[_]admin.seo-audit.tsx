import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatusPill } from "@/components/admin/seo-ui";
import { LoadingState } from "@/components/shared/page";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { createPageMeta } from "@/lib/seo";
import {
  keywordGaps,
  napChecks,
  onPageIssues,
  overallStatus,
  potentialOverlap,
} from "@/lib/seo/audit";
import {
  fetchSeoEntities,
  listAllKeywordUsage,
  listSeoLocations,
  listTargetKeywords,
  listWebsiteKeywords,
} from "@/lib/data/seo-repository";

export const Route = createFileRoute("/_admin/seo-audit")({
  head: () => ({
    meta: [
      ...createPageMeta("SEO audit", "On-page, local and content SEO checks for the website."),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SeoAudit,
});

function SeoAudit() {
  const entities = useQuery({ queryKey: ["seo-entities"], queryFn: fetchSeoEntities });
  const keywords = useQuery({ queryKey: ["seo-keywords"], queryFn: listWebsiteKeywords });
  const usage = useQuery({ queryKey: ["seo-keyword-usage"], queryFn: listAllKeywordUsage });
  const targets = useQuery({ queryKey: ["seo-targets"], queryFn: listTargetKeywords });
  const locations = useQuery({ queryKey: ["seo-locations"], queryFn: listSeoLocations });

  const issues = useMemo(() => onPageIssues(entities.data ?? []), [entities.data]);
  const gaps = useMemo(
    () => keywordGaps(targets.data ?? [], entities.data ?? [], keywords.data ?? []),
    [targets.data, entities.data, keywords.data],
  );
  const overlap = useMemo(() => {
    const map = new Map<string, { entityLabel: string; entityPath: string | null }[]>();
    for (const row of usage.data ?? []) {
      map.set(row.keywordId, [
        ...(map.get(row.keywordId) ?? []),
        { entityLabel: row.entityLabel, entityPath: row.entityPath },
      ]);
    }
    return potentialOverlap(keywords.data ?? [], map);
  }, [keywords.data, usage.data]);
  const nap = useMemo(() => napChecks(locations.data ?? []), [locations.data]);

  if (entities.isPending) {
    return (
      <AdminShell title="SEO audit" requires="seo.read">
        <LoadingState />
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="SEO audit"
      description="Checks run against the real content saved in the CMS. Nothing here is estimated."
      requires="seo.read"
    >
      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">On-page SEO</h2>
          <StatusPill status={overallStatus(issues.map((issue) => issue.status))} />
        </div>
        <Accordion type="multiple" className="rounded-lg border border-border bg-background">
          {issues.map((issue) => (
            <AccordionItem key={issue.key} value={issue.key} className="px-4">
              <AccordionTrigger className="gap-3 text-left">
                <span className="flex flex-1 flex-wrap items-center justify-between gap-3">
                  <span className="font-medium">{issue.label}</span>
                  <StatusPill status={issue.status} />
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">{issue.detail}</p>
                {issue.entities.length ? (
                  <ul className="mt-3 grid gap-1 text-sm">
                    {issue.entities.map((entity) => (
                      <li key={`${issue.key}-${entity.label}`}>
                        {entity.label}
                        {entity.path ? (
                          <span className="text-muted-foreground"> — {entity.path}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm">No pages affected.</p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="mt-10 grid gap-4">
        <h2 className="text-xl font-semibold">Content SEO</h2>
        <div className="rounded-lg border border-border bg-background p-5">
          <h3 className="font-semibold">Keyword gaps</h3>
          {gaps.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {targets.data?.length
                ? "Every target keyword appears in the website content."
                : "Add target keywords to see coverage gaps."}
            </p>
          ) : (
            <ul className="mt-3 grid gap-3">
              {gaps.map((gap) => (
                <li key={gap.keyword} className="border-b border-border pb-3 last:border-0">
                  <p className="font-medium">{gap.keyword}</p>
                  <p className="text-sm text-muted-foreground">
                    {gap.reason} — {gap.detail}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-lg border border-border bg-background p-5">
          <h3 className="font-semibold">Potential keyword overlap</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            These phrases appear on several important pages. Potential overlap — review
            recommended. This is not a claim that the pages compete in Google.
          </p>
          {overlap.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No overlap detected.</p>
          ) : (
            <ul className="mt-3 grid gap-3">
              {overlap.map((row) => (
                <li key={row.keyword} className="border-b border-border pb-3 last:border-0">
                  <p className="font-medium">{row.keyword}</p>
                  <p className="text-sm text-muted-foreground">
                    {row.pages.map((page) => page.label).join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-10 grid gap-4">
        <h2 className="text-xl font-semibold">Local SEO</h2>
        <ul className="grid gap-2">
          {nap.map((check) => (
            <li
              key={check.label}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-4"
            >
              <div>
                <p className="font-medium">{check.label}</p>
                <p className="text-sm text-muted-foreground">{check.detail}</p>
              </div>
              <StatusPill status={check.status} />
            </li>
          ))}
          <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-4">
            <div>
              <p className="font-medium">Google Business Profile</p>
              <p className="text-sm text-muted-foreground">Not connected.</p>
            </div>
            <StatusPill status="attention" />
          </li>
        </ul>
      </section>

      <section className="mt-10 grid gap-2">
        <h2 className="text-xl font-semibold">Technical SEO</h2>
        <p className="text-sm text-muted-foreground">
          Sitemap, robots and indexing checks are on the Technical SEO page. Broken links and
          structured data have not been checked yet.
        </p>
      </section>
    </AdminShell>
  );
}
