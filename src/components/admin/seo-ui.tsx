import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { CheckStatus } from "@/lib/seo/audit";

export function StatusPill({ status }: { status: CheckStatus }) {
  const map: Record<CheckStatus, { label: string; dot: string; className: string }> = {
    pass: { label: "Good", dot: "bg-primary", className: "bg-primary/10 text-primary" },
    attention: {
      label: "Needs attention",
      dot: "bg-warning-foreground",
      className: "bg-warning text-warning-foreground",
    },
    problem: {
      label: "Problem",
      dot: "bg-destructive",
      className: "bg-destructive/10 text-destructive",
    },
  };
  const tone = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
        tone.className,
      )}
    >
      <span className={cn("size-2 rounded-full", tone.dot)} aria-hidden />
      {tone.label}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-5 shadow-[var(--shadow-sm)]">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
      {hint ? <p className="mt-2 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function NotConnectedPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-background p-6">
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      <p className="mt-3 inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
        Not connected
      </p>
    </div>
  );
}

export function SearchPreview({
  title,
  url,
  description,
}: {
  title: string | null;
  url: string;
  description: string | null;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="truncate text-xs text-muted-foreground">{url}</p>
      <p className="mt-1 truncate text-lg font-medium text-primary">
        {title ?? "No SEO title set"}
      </p>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
        {description ?? "No meta description set."}
      </p>
    </div>
  );
}

export function InlineNotice({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "error";
  children: ReactNode;
}) {
  const classes = {
    info: "border-border bg-muted text-foreground",
    success: "border-primary/40 bg-primary/10 text-primary",
    error: "border-destructive/40 bg-destructive/10 text-destructive",
  } as const;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-md border p-3 text-sm font-medium", classes[tone])}
    >
      {children}
    </p>
  );
}
