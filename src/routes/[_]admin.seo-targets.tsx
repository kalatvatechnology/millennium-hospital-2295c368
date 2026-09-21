import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { DataTable, FilterSelect, SearchField, type Column } from "@/components/admin/ui";
import { createPageMeta } from "@/lib/seo";
import { useAdminSession } from "@/hooks/use-admin-session";
import { SEO_KEYWORD_CATEGORIES } from "@/lib/seo/types";
import { listTargetKeywords, listWebsiteKeywords } from "@/lib/data/seo-repository";

export const Route = createFileRoute("/_admin/seo-targets")({
  head: () => ({
    meta: [
      ...createPageMeta("Target keywords", "Keywords the hospital intentionally wants to target."),
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: TargetKeywords,
});

function TargetKeywords() {
  const { can } = useAdminSession();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const targets = useQuery({ queryKey: ["seo-targets"], queryFn: listTargetKeywords });
  const keywords = useQuery({ queryKey: ["seo-keywords"], queryFn: listWebsiteKeywords });

  const websiteSet = useMemo(
    () => new Set((keywords.data ?? []).map((row) => row.normalized)),
    [keywords.data],
  );

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (targets.data ?? []).filter(
      (row) =>
        (!term || row.keyword.toLowerCase().includes(term)) &&
        (type === "all" || row.keywordType === type),
    );
  }, [targets.data, search, type]);

  const columns: Column<(typeof rows)[number]>[] = [
    {
      key: "keyword",
      header: "Target keyword",
      cell: (row) => (
        <Link
          to="/_admin/seo-target/$targetId"
          params={{ targetId: row.id }}
          className="font-medium text-primary underline"
        >
          {row.keyword}
        </Link>
      ),
    },
    { key: "type", header: "Type", cell: (row) => row.keywordType },
    { key: "intent", header: "Search intent", cell: (row) => row.searchIntent },
    { key: "priority", header: "Priority", cell: (row) => row.priority },
    { key: "status", header: "Status", cell: (row) => row.status },
    {
      key: "usage",
      header: "Found on website",
      cell: (row) => (websiteSet.has(row.normalized) ? "Yes" : "Not in keyword list"),
    },
  ];

  return (
    <AdminShell
      title="Target keywords"
      description="The keywords your team has chosen to target. These are separate from the keywords already found in your website content and from Google search queries."
      requires="seo.read"
      actions={
        can("seo.manage") ? (
          <Button asChild>
            <Link to="/_admin/seo-target/$targetId" params={{ targetId: "new" }}>
              <Plus className="size-4" /> Add target keyword
            </Link>
          </Button>
        ) : null
      }
    >
      <div className="flex flex-wrap items-end gap-4">
        <SearchField
          value={search}
          onChange={setSearch}
          label="Search target keywords"
          placeholder="Search target keywords"
        />
        <FilterSelect
          label="Keyword type"
          value={type}
          onChange={setType}
          options={[
            { value: "all", label: "All types" },
            ...SEO_KEYWORD_CATEGORIES.map((value) => ({ value, label: value })),
          ]}
        />
      </div>
      <div className="mt-6">
        <DataTable
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          isPending={targets.isPending}
          isError={targets.isError}
          emptyTitle="No target keywords yet"
          emptyDescription="Add the keywords the hospital wants to be found for."
        />
      </div>
    </AdminShell>
  );
}
