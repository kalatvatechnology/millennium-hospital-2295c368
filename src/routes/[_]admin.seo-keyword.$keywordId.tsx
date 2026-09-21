import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { WorkspaceLayout, WorkspaceSection } from "@/components/admin/workspace";
import { DataTable, type Column } from "@/components/admin/ui";
import { MetricCard } from "@/components/admin/seo-ui";
import { EmptyState, LoadingState } from "@/components/shared/page";
import { createPageMeta } from "@/lib/seo";
import { SEO_ENTITY_LABELS } from "@/lib/seo/types";
import {
  getWebsiteKeyword,
  listKeywordUsage,
  listTargetKeywords,
} from "@/lib/data/seo-repository";

export const Route = createFileRoute("/_admin/seo-keyword/$keywordId")({
  head: () => ({
    meta: [
      ...createPageMeta("Website keyword", "Where this keyword appears in the website content."),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: KeywordDetail,
});

function KeywordDetail() {
  const { keywordId } = Route.useParams();
  const keyword = useQuery({
    queryKey: ["seo-keyword", keywordId],
    queryFn: () => getWebsiteKeyword(keywordId),
  });
  const usage = useQuery({
    queryKey: ["seo-keyword-usage", keywordId],
    queryFn: () => listKeywordUsage(keywordId),
  });
  const targets = useQuery({ queryKey: ["seo-targets"], queryFn: listTargetKeywords });

  const matchingTarget = keyword.data
    ? targets.data?.find((target) => target.normalized === keyword.data?.normalized)
    : undefined;

  const columns: Column<NonNullable<typeof usage.data>[number]>[] = [
    { key: "where", header: "Content", cell: (row) => row.entityLabel },
    { key: "type", header: "Type", cell: (row) => SEO_ENTITY_LABELS[row.entityType] },
    { key: "field", header: "Where in the page", cell: (row) => row.field },
    { key: "count", header: "Times used", cell: (row) => row.occurrences, className: "text-right" },
    { key: "path", header: "Address", cell: (row) => row.entityPath ?? "—" },
  ];

  return (
    <AdminShell
      title={keyword.data?.keyword ?? "Website keyword"}
      description="Every place this keyword appears in the published website content."
      requires="seo.read"
    >
      <WorkspaceLayout
        backLink={
          <Link to="/_admin/seo-keywords">
            <ArrowLeft className="mr-2 size-4" /> All website keywords
          </Link>
        }
      >
        {keyword.isPending ? (
          <LoadingState />
        ) : !keyword.data ? (
          <EmptyState
            title="Keyword not found"
            description="It may have been replaced by a newer website keyword scan."
          />
        ) : (
          <div className="grid gap-8">
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard label="Category" value={keyword.data.category} />
              <MetricCard label="Occurrences" value={keyword.data.usageCount} />
              <MetricCard label="Pages" value={keyword.data.pageCount} />
            </div>

            <WorkspaceSection
              title="Where it is used"
              description="Counted from the real content saved in the CMS."
            >
              <DataTable
                rows={usage.data ?? []}
                columns={columns}
                getRowId={(row) => row.id}
                isPending={usage.isPending}
                isError={usage.isError}
                emptyTitle="No recorded usage"
              />
            </WorkspaceSection>

            <WorkspaceSection
              title="Target keyword link"
              description="Shows whether your team has chosen this phrase as a target keyword."
            >
              {matchingTarget ? (
                <p className="text-sm">
                  This is a {matchingTarget.priority} target keyword ({matchingTarget.searchIntent}{" "}
                  intent).{" "}
                  <Link
                    to="/_admin/seo-target/$targetId"
                    params={{ targetId: matchingTarget.id }}
                    className="font-semibold text-primary underline"
                  >
                    Open the target keyword
                  </Link>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This phrase is not in your target keyword list yet.
                </p>
              )}
            </WorkspaceSection>

            <WorkspaceSection
              title="Google search performance"
              description="Google Search Console is not connected, so no search data is available for this keyword."
            >
              <p className="text-sm text-muted-foreground">No data.</p>
            </WorkspaceSection>

            <p className="text-sm text-muted-foreground">
              Last scanned: {new Date(keyword.data.lastScannedAt).toLocaleString()}
            </p>
          </div>
        )}
      </WorkspaceLayout>
    </AdminShell>
  );
}
