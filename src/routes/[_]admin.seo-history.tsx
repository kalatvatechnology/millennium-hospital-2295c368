import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/admin-shell";
import { DataTable, type Column } from "@/components/admin/ui";
import { createPageMeta } from "@/lib/seo";
import { listSeoHistory, listSeoScans } from "@/lib/data/seo-repository";

export const Route = createFileRoute("/_admin/seo-history")({
  head: () => ({
    meta: [
      ...createPageMeta("SEO history", "A record of SEO changes and website keyword scans."),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SeoHistory,
});

function SeoHistory() {
  const history = useQuery({ queryKey: ["seo-history"], queryFn: listSeoHistory });
  const scans = useQuery({ queryKey: ["seo-scans"], queryFn: listSeoScans });

  const changeColumns: Column<NonNullable<typeof history.data>[number]>[] = [
    { key: "when", header: "Date", cell: (row) => new Date(row.createdAt).toLocaleString() },
    { key: "who", header: "Staff member", cell: (row) => row.actorEmail ?? "Unknown" },
    { key: "entity", header: "Record", cell: (row) => row.entityTable ?? "—" },
    { key: "change", header: "Change", cell: (row) => row.summary ?? row.action },
  ];

  const scanColumns: Column<NonNullable<typeof scans.data>[number]>[] = [
    { key: "when", header: "Scan date", cell: (row) => new Date(row.startedAt).toLocaleString() },
    { key: "pages", header: "Pages scanned", cell: (row) => row.pagesScanned },
    { key: "keywords", header: "Keywords found", cell: (row) => row.keywordsDetected },
    { key: "sources", header: "Content scanned", cell: (row) => row.sources.length },
  ];

  return (
    <AdminShell
      title="SEO history"
      description="SEO changes recorded in the existing activity log, plus every website keyword scan."
      requires="seo.read"
    >
      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">Recorded SEO changes</h2>
        <DataTable
          rows={history.data ?? []}
          columns={changeColumns}
          getRowId={(row) => row.id}
          isPending={history.isPending}
          isError={history.isError}
          emptyTitle="No SEO changes recorded yet"
          emptyDescription="Changes to keywords and SEO records appear here as they happen."
        />
      </section>
      <section className="mt-10 grid gap-4">
        <h2 className="text-xl font-semibold">Website keyword scans</h2>
        <DataTable
          rows={scans.data ?? []}
          columns={scanColumns}
          getRowId={(row) => row.id}
          isPending={scans.isPending}
          isError={scans.isError}
          emptyTitle="No scans have been run yet"
          emptyDescription="Run a scan from the SEO dashboard to build the website keyword list."
        />
      </section>
    </AdminShell>
  );
}
