import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAdminSession } from "@/hooks/use-admin-session";
import { seoFixTarget, showViewPage } from "@/lib/seo/fix-links";
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

const ISSUE_MESSAGES: Record<string, string> = {
  "title-missing": "SEO title is missing.",
  "title-length": "SEO title is too short or too long.",
  "title-duplicate": "SEO title is the same as another page.",
  "description-missing": "Meta description is missing.",
  "description-length": "Meta description is too short or too long.",
  "description-duplicate": "Meta description is the same as another page.",
  canonical: "Canonical URL is missing.",
  heading: "Main heading is missing.",
  "image-alt": "An image has no alt text.",
  content: "Very little written content.",
  "internal-links": "No links to other pages.",
  indexable: "Page is set to no-index.",
};

function SeoAudit() {
  const { can } = useAdminSession();
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
                <p className="text-sm text-muted-foreground">
                  {issue.detail}
                  {issue.entities.length
                    ? ` ${issue.entities.length} ${issue.entities.length === 1 ? "page" : "pages"} affected.`
                    : ""}
                </p>
                {issue.entities.length ? (
                  <ul className="mt-3 grid">
                    {issue.entities.map((entity) => {
                      const fix = seoFixTarget(issue.key, entity);
                      const allowed = fix ? can(fix.permission) : false;
                      return (
                        <li
                          key={`${issue.key}-${entity.type}-${entity.id}`}
                          className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 text-sm last:border-0"
                        >
                          <div className="min-w-0">
                            <p className="font-medium">{entity.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {fix ? fix.context.join(" → ") : entity.path}
                            </p>
                            <p className="text-muted-foreground">
                              {ISSUE_MESSAGES[issue.key] ?? issue.label}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {entity.path && showViewPage(issue.key) ? (
                              <Button asChild size="sm" variant="ghost">
                                <a href={entity.path} target="_blank" rel="noreferrer">
                                  View page →
                                </a>
                              </Button>
                            ) : null}
                            {fix && allowed ? (
                              <Button asChild size="sm" variant="outline">
                                <Link
                                  to={fix.link.to as never}
                                  params={fix.link.params as never}
                                  search={fix.link.search as never}
                                >
                                  Fix issue →
                                </Link>
                              </Button>
                            ) : fix ? (
                              <span className="text-xs text-muted-foreground">
                                No edit access
                              </span>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
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
