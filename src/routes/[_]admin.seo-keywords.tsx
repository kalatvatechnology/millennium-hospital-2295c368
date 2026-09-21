import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  FilterSelect,
  Pagination,
  SearchField,
  type Column,
} from "@/components/admin/ui";
import { InlineNotice } from "@/components/admin/seo-ui";
import { createPageMeta } from "@/lib/seo";
import { useAdminSession } from "@/hooks/use-admin-session";
import { userFacingDataError } from "@/lib/data/errors";
import { SEO_ENTITY_LABELS, SEO_KEYWORD_CATEGORIES } from "@/lib/seo/types";
import {
  listAllKeywordUsage,
  listSeoScans,
  listWebsiteKeywords,
  runWebsiteKeywordScan,
} from "@/lib/data/seo-repository";

export const Route = createFileRoute("/_admin/seo-keywords")({
  head: () => ({
    meta: [
      ...createPageMeta(
        "Website keywords",
        "Keywords and phrases found in the hospital's own website content.",
      ),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: WebsiteKeywords,
});

const PAGE_SIZE = 25;

function WebsiteKeywords() {
  const { can, profile } = useAdminSession();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [pageType, setPageType] = useState("all");
  const [sort, setSort] = useState("usage");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const keywords = useQuery({ queryKey: ["seo-keywords"], queryFn: listWebsiteKeywords });
  const usage = useQuery({ queryKey: ["seo-keyword-usage"], queryFn: listAllKeywordUsage });
  const scans = useQuery({ queryKey: ["seo-scans"], queryFn: listSeoScans });

  const scan = useMutation({
    mutationFn: () => runWebsiteKeywordScan(profile?.id ?? null),
    onSuccess: (summary) => {
      setMessage({
        tone: "success",
        text: `Scan complete. ${summary.keywordsDetected} keywords found across ${summary.pagesScanned} published records.`,
      });
      void queryClient.invalidateQueries({ queryKey: ["seo-keywords"] });
      void queryClient.invalidateQueries({ queryKey: ["seo-keyword-usage"] });
      void queryClient.invalidateQueries({ queryKey: ["seo-scans"] });
    },
    onError: (error) => setMessage({ tone: "error", text: userFacingDataError(error) }),
  });

  const usedIn = useMemo(() => {
    const map = new Map<string, { labels: Set<string>; types: Set<string> }>();
    for (const row of usage.data ?? []) {
      const entry = map.get(row.keywordId) ?? { labels: new Set(), types: new Set() };
      entry.labels.add(row.entityLabel);
      entry.types.add(row.entityType);
      map.set(row.keywordId, entry);
    }
    return map;
  }, [usage.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = (keywords.data ?? []).filter((row) => {
      if (term && !row.keyword.includes(term)) return false;
      if (category !== "all" && row.category !== category) return false;
      if (pageType !== "all" && !usedIn.get(row.id)?.types.has(pageType)) return false;
      return true;
    });
    return [...list].sort((a, b) =>
      sort === "alphabetical"
        ? a.keyword.localeCompare(b.keyword)
        : sort === "pages"
          ? b.pageCount - a.pageCount
          : b.usageCount - a.usageCount,
    );
  }, [keywords.data, search, category, pageType, sort, usedIn]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const lastScan = scans.data?.[0];

  const columns: Column<(typeof filtered)[number]>[] = [
    {
      key: "keyword",
      header: "Keyword or phrase",
      cell: (row) => (
        <Link
          to="/_admin/seo-keyword/$keywordId"
          params={{ keywordId: row.id }}
          className="font-medium text-primary underline"
        >
          {row.keyword}
        </Link>
      ),
    },
    { key: "category", header: "Category", cell: (row) => row.category },
    {
      key: "used",
      header: "Used in",
      cell: (row) => {
        const labels = [...(usedIn.get(row.id)?.labels ?? [])];
        return labels.length ? `${labels.slice(0, 3).join(", ")}${labels.length > 3 ? "…" : ""}` : "—";
      },
    },
    { key: "usage", header: "Usage", cell: (row) => row.usageCount, className: "text-right" },
    { key: "pages", header: "Pages", cell: (row) => row.pageCount, className: "text-right" },
    {
      key: "scanned",
      header: "Last scanned",
      cell: (row) => new Date(row.lastScannedAt).toLocaleDateString(),
    },
  ];

  return (
    <AdminShell
      title="Website keywords"
      description="Keywords and phrases that already appear in your published website content. These are not Google search queries and not your chosen target keywords."
      requires="seo.read"
      actions={
        can("seo.manage") ? (
          <Button onClick={() => scan.mutate()} disabled={scan.isPending}>
            <RefreshCw className="size-4" />
            {scan.isPending ? "Scanning…" : lastScan ? "Scan again" : "Scan website keywords"}
          </Button>
        ) : null
      }
    >
      {message ? (
        <div className="mb-6">
          <InlineNotice tone={message.tone}>{message.text}</InlineNotice>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-4">
        <SearchField
          value={search}
          onChange={(next) => {
            setSearch(next);
            setPage(1);
          }}
          label="Search keywords"
          placeholder="Search keywords"
        />
        <FilterSelect
          label="Category"
          value={category}
          onChange={(next) => {
            setCategory(next);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All categories" },
            ...SEO_KEYWORD_CATEGORIES.map((value) => ({ value, label: value })),
          ]}
        />
        <FilterSelect
          label="Content type"
          value={pageType}
          onChange={(next) => {
            setPageType(next);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All content" },
            ...Object.entries(SEO_ENTITY_LABELS).map(([value, label]) => ({ value, label })),
          ]}
        />
        <FilterSelect
          label="Sort by"
          value={sort}
          onChange={setSort}
          options={[
            { value: "usage", label: "Most used" },
            { value: "pages", label: "Most pages" },
            { value: "alphabetical", label: "A to Z" },
          ]}
        />
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {lastScan
          ? `Last scanned: ${new Date(lastScan.startedAt).toLocaleString()}`
          : "No scan has been run yet, so this list is empty."}
      </p>

      <div className="mt-6">
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          isPending={keywords.isPending}
          isError={keywords.isError}
          emptyTitle="No website keywords yet"
          emptyDescription="Run a website keyword scan to build this list from your published content."
        />
        <Pagination
          page={currentPage}
          pageCount={pageCount}
          total={filtered.length}
          onPageChange={setPage}
        />
      </div>
    </AdminShell>
  );
}
