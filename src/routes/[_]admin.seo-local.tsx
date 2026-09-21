import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/admin-shell";
import { NotConnectedPanel, StatusPill } from "@/components/admin/seo-ui";
import { LoadingState } from "@/components/shared/page";
import { createPageMeta } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { napChecks } from "@/lib/seo/audit";
import { listSeoLocations, listWebsiteKeywords } from "@/lib/data/seo-repository";

export const Route = createFileRoute("/_admin/seo-local")({
  head: () => ({
    meta: [
      ...createPageMeta("Local SEO", "Location details used for local search."),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LocalSeo,
});

function LocalSeo() {
  const locations = useQuery({ queryKey: ["seo-locations"], queryFn: listSeoLocations });
  const keywords = useQuery({ queryKey: ["seo-keywords"], queryFn: listWebsiteKeywords });
  const localKeywords = (keywords.data ?? []).filter((row) => row.category === "local");
  const checks = napChecks(locations.data ?? []);

  return (
    <AdminShell
      title="Local SEO"
      description="Name, address and phone details taken from your existing location records."
      requires="seo.read"
    >
      {locations.isPending ? (
        <LoadingState />
      ) : (
        <>
          <section className="grid gap-4">
            <h2 className="text-xl font-semibold">Hospital locations</h2>
            {(locations.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No location records exist yet.</p>
            ) : (
              <ul className="grid min-w-0 gap-4 lg:grid-cols-2">
                {(locations.data ?? []).map((location) => (
                  <li
                    key={location.id}
                    className="min-w-0 rounded-lg border border-border bg-background p-5"
                  >
                    <p className="font-semibold">{siteConfig.name}</p>
                    <p className="text-sm text-muted-foreground">{location.name}</p>
                    <dl className="mt-3 grid min-w-0 gap-1 text-sm">
                      <div className="flex gap-2">
                        <dt className="w-24 shrink-0 text-muted-foreground">Address</dt>
                        <dd className="min-w-0 break-words">{location.address ?? "Not set"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-24 shrink-0 text-muted-foreground">Phone</dt>
                        <dd>{location.phone ?? "Not set"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-24 shrink-0 text-muted-foreground">Map</dt>
                        <dd className="min-w-0 break-all">{location.mapUrl ?? "Not set"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-24 shrink-0 text-muted-foreground">Published</dt>
                        <dd>{location.published ? "Yes" : "No"}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-10 grid gap-3">
            <h2 className="text-xl font-semibold">Name, address and phone consistency</h2>
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
          </section>

          <section className="mt-10 grid gap-3">
            <h2 className="text-xl font-semibold">Location keywords</h2>
            {localKeywords.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No location keywords were found in the last website scan.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {localKeywords.slice(0, 40).map((keyword) => (
                  <li
                    key={keyword.id}
                    className="rounded-full bg-secondary px-3 py-1 text-sm text-foreground"
                  >
                    {keyword.keyword} · {keyword.usageCount}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-10">
            <NotConnectedPanel
              title="Google Business Profile is not connected."
              description="Connect Google Business Profile to view business details, local insights and Google reviews here."
            />
          </section>
        </>
      )}
    </AdminShell>
  );
}
