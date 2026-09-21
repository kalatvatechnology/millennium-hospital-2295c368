import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Node = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type?: string; attrs?: Record<string, unknown> }[];
  content?: Node[];
};
type Chart = {
  id?: string;
  type?: "bar" | "line" | "pie";
  title?: string;
  explanation?: string;
  labels?: string;
  values?: string;
  unit?: string;
  source?: string;
  accessibilityText?: string;
  caption?: string;
  showLegend?: boolean;
};

function safeHref(value: unknown) {
  const href = typeof value === "string" ? value.trim() : "";
  return /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(href) ? href : undefined;
}
function renderNode(node: Node, key: string): ReactNode {
  if (node.type === "text") {
    let value: ReactNode = node.text ?? "";
    for (const mark of node.marks ?? []) {
      if (mark.type === "bold") value = <strong>{value}</strong>;
      else if (mark.type === "italic") value = <em>{value}</em>;
      else if (mark.type === "underline") value = <u>{value}</u>;
      else if (mark.type === "strike") value = <s>{value}</s>;
      else if (mark.type === "link") {
        const href = safeHref(mark.attrs?.["href"]);
        if (href)
          value = (
            <a href={href} rel={href.startsWith("http") ? "noreferrer" : undefined}>
              {value}
            </a>
          );
      }
    }
    return <span key={key}>{value}</span>;
  }
  const children = node.content?.map((child, index) => renderNode(child, `${key}-${index}`));
  if (node.type === "paragraph") return <p key={key}>{children}</p>;
  if (node.type === "heading") {
    const level = Number(node.attrs?.["level"]);
    return level === 2 ? (
      <h2 key={key}>{children}</h2>
    ) : level === 3 ? (
      <h3 key={key}>{children}</h3>
    ) : (
      <h2 key={key}>{children}</h2>
    );
  }
  if (node.type === "bulletList") return <ul key={key}>{children}</ul>;
  if (node.type === "orderedList") return <ol key={key}>{children}</ol>;
  if (node.type === "listItem") return <li key={key}>{children}</li>;
  if (node.type === "blockquote") return <blockquote key={key}>{children}</blockquote>;
  if (node.type === "hardBreak") return <br key={key} />;
  if (node.type === "horizontalRule") return <hr key={key} />;
  if (node.type === "table")
    return (
      <div key={key} className="overflow-x-auto">
        <table>{children}</table>
      </div>
    );
  if (node.type === "tableRow") return <tr key={key}>{children}</tr>;
  if (node.type === "tableHeader") return <th key={key}>{children}</th>;
  if (node.type === "tableCell") return <td key={key}>{children}</td>;
  if (node.type === "image") {
    const src = safeHref(node.attrs?.["src"]);
    return src ? <img key={key} src={src} alt={String(node.attrs?.["alt"] ?? "")} /> : null;
  }
  return <span key={key}>{children}</span>;
}

export function ArticleContent({
  document,
  fallback,
}: {
  document: Record<string, unknown> | null | undefined;
  fallback: string | null | undefined;
}) {
  const node = document as Node | null | undefined;
  if (!node?.content?.length)
    return (
      <div className="whitespace-pre-line">
        {fallback ?? "The full article has not yet been published."}
      </div>
    );
  return <div>{node.content.map((child, index) => renderNode(child, String(index)))}</div>;
}

export function ArticleCharts({ charts }: { charts: unknown[] | undefined }) {
  const valid = (charts ?? []).filter((value): value is Chart =>
    Boolean(value && typeof value === "object"),
  );
  if (!valid.length) return null;
  return (
    <section aria-labelledby="article-charts" className="mx-auto mt-12 max-w-3xl">
      <h2 id="article-charts" className="text-2xl font-semibold">
        Data visualizations
      </h2>
      <div className="mt-6 grid gap-8">
        {valid.map((chart, index) => {
          const labels = (chart.labels ?? "")
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);
          const values = (chart.values ?? "").split(",").map(Number);
          const data = labels.map((name, itemIndex) => ({
            name,
            value: Number.isFinite(values[itemIndex]) ? values[itemIndex] : 0,
          }));
          if (!data.length) return null;
          return (
            <figure key={chart.id ?? index} className="border border-border p-5">
              <h3 className="font-semibold">{chart.title || "Chart"}</h3>
              {chart.explanation ? (
                <p className="mt-2 text-sm text-muted-foreground">{chart.explanation}</p>
              ) : null}
              <div
                role="img"
                aria-label={chart.accessibilityText || chart.title || "Article chart"}
                className="mt-4 h-72"
              >
                <ResponsiveContainer width="100%" height="100%">
                  {chart.type === "line" ? (
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line dataKey="value" stroke="var(--color-primary)" />
                    </LineChart>
                  ) : chart.type === "pie" ? (
                    <PieChart>
                      <Tooltip />
                      <Legend />
                      <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        fill="var(--color-primary)"
                        innerRadius={42}
                      />
                    </PieChart>
                  ) : (
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="var(--color-primary)" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
              {chart.source ? (
                <figcaption className="mt-3 text-xs text-muted-foreground">
                  Source: {chart.source}
                </figcaption>
              ) : null}
            </figure>
          );
        })}
      </div>
    </section>
  );
}
