import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/admin-shell";
import { NotConnectedPanel } from "@/components/admin/seo-ui";
import { createPageMeta } from "@/lib/seo";
import { listSeoDataSources } from "@/lib/data/seo-repository";
import { LoadingState } from "@/components/shared/page";

export const Route = createFileRoute("/_admin/seo-analytics")({
  head: () => ({
    meta: [
      ...createPageMeta("SEO analytics", "Google Search and traffic data for the hospital website."),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SeoAnalytics,
});

const GSC_METRICS = [
  "Search clicks",
  "Search impressions",
  "Click-through rate",
  "Average position",
  "Search queries",
  "Top pages",
];
const GA4_METRICS = [
  "Users",
  "Sessions",
  "Organic users",
  "Organic sessions",
  "Landing pages",
  "Engagement",
  "Traffic source",
  "Device",
  "Location",
  "Conversions and events",
];

function SeoAnalytics() {
  const sources = useQuery({ queryKey: ["seo-data-sources"], queryFn: listSeoDataSources });
  const statusOf = (key: string) =>
    sources.data?.find((source) => source.key === key)?.status ?? "not_connected";

  return (
    <AdminShell
      title="SEO analytics"
      description="Google Search and website traffic figures appear here once the Google services are connected."
      requires="seo.read"
    >
      {sources.isPending ? (
        <LoadingState />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="grid gap-4">
            <h2 className="text-xl font-semibold">Google Search Console</h2>
            {statusOf("google_search_console") === "connected" ? (
              <p className="text-sm text-muted-foreground">
                Connected. Search figures will be shown here.
              </p>
            ) : (
              <NotConnectedPanel
                title="Google Search Console is not connected."
                description="Connect Google Search Console to view search clicks, impressions, click-through rate, average position, search queries and top pages. No figures are shown until then."
              />
            )}
            <ul className="grid gap-2 text-sm text-muted-foreground">
              {GSC_METRICS.map((metric) => (
                <li key={metric} className="flex justify-between border-b border-border py-2">
                  <span>{metric}</span>
                  <span className="font-medium">No data</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="grid gap-4">
            <h2 className="text-xl font-semibold">Google Analytics 4</h2>
            {statusOf("google_analytics_4") === "connected" ? (
              <p className="text-sm text-muted-foreground">
                Connected. Traffic figures will be shown here.
              </p>
            ) : (
              <NotConnectedPanel
                title="Google Analytics 4 is not connected."
                description="Connect Google Analytics 4 to view visitors, sessions, organic traffic, landing pages, engagement and conversions."
              />
            )}
            <ul className="grid gap-2 text-sm text-muted-foreground">
              {GA4_METRICS.map((metric) => (
                <li key={metric} className="flex justify-between border-b border-border py-2">
                  <span>{metric}</span>
                  <span className="font-medium">No data</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
      <p className="mt-8 text-sm text-muted-foreground">
        Google search queries are different from the website keywords found in your own content and
        from the target keywords your team chooses. They will be listed separately once Search
        Console is connected.
      </p>
    </AdminShell>
  );
}
