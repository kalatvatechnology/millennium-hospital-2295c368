import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatusPill } from "@/components/admin/seo-ui";
import { LoadingState } from "@/components/shared/page";
import { createPageMeta } from "@/lib/seo";
import type { CheckStatus } from "@/lib/seo/audit";
import { fetchSeoEntities } from "@/lib/data/seo-repository";

export const Route = createFileRoute("/_admin/seo-technical")({
  head: () => ({
    meta: [
      ...createPageMeta("Technical SEO", "Sitemap, robots and indexing checks."),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: TechnicalSeo,
});

async function checkFile(path: string) {
  try {
    const response = await fetch(path, { method: "GET" });
    return response.ok;
  } catch {
    return false;
  }
}

function TechnicalSeo() {
  const files = useQuery({
    queryKey: ["seo-technical-files"],
    queryFn: async () => ({
      robots: await checkFile("/robots.txt"),
      sitemap: await checkFile("/sitemap.xml"),
    }),
  });
  const entities = useQuery({ queryKey: ["seo-entities"], queryFn: fetchSeoEntities });

  const published = (entities.data ?? []).filter((entity) => entity.published);
  const missingCanonical = published.filter((entity) => !entity.canonicalUrl?.trim());
  const noIndex = published.filter((entity) => !entity.indexable);
  const paths = new Map<string, number>();
  for (const entity of published)
    if (entity.path) paths.set(entity.path, (paths.get(entity.path) ?? 0) + 1);
  const duplicatePaths = [...paths.entries()].filter(([, count]) => count > 1);

  const checks: { label: string; status: CheckStatus; detail: string }[] = [
    {
      label: "robots.txt",
      status: files.data?.robots ? "pass" : "problem",
      detail: files.data?.robots
        ? "robots.txt is being served."
        : "robots.txt could not be loaded.",
    },
    {
      label: "Sitemap",
      status: files.data?.sitemap ? "pass" : "attention",
      detail: files.data?.sitemap
        ? "sitemap.xml is being served."
        : "No sitemap.xml is served yet. Search engines still find pages through links.",
    },
    {
      label: "Canonical addresses",
      status: missingCanonical.length === 0 ? "pass" : "attention",
      detail: `${missingCanonical.length} published record(s) have no canonical address set.`,
    },
    {
      label: "Pages allowed in search",
      status: noIndex.length === 0 ? "pass" : "attention",
      detail: `${noIndex.length} published record(s) are set to no-index.`,
    },
    {
      label: "Duplicate addresses",
      status: duplicatePaths.length === 0 ? "pass" : "problem",
      detail: duplicatePaths.length
        ? `${duplicatePaths.length} address(es) are used by more than one record.`
        : "No duplicate addresses found.",
    },
  ];

  return (
    <AdminShell
      title="Technical SEO"
      description="Technical checks that can be verified from this website. Anything not checked is stated plainly."
      requires="seo.read"
    >
      {entities.isPending || files.isPending ? (
        <LoadingState />
      ) : (
        <>
          <ul className="grid gap-2">
            {checks.map((check) => (
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
          </ul>
          <section className="mt-10 grid gap-2">
            <h2 className="text-xl font-semibold">Not checked yet</h2>
            <ul className="grid gap-2 text-sm text-muted-foreground">
              <li>Broken links across the website</li>
              <li>Redirects</li>
              <li>Structured data</li>
              <li>Mobile and page speed measurement</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              These need a full website crawl or a connected Google service, so no result is shown
              rather than an unverified one.
            </p>
          </section>
        </>
      )}
    </AdminShell>
  );
}
