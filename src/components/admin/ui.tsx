import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/page";
import { cn } from "@/lib/utils";
import { userFacingDataError } from "@/lib/data/errors";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  isPending,
  isError,
  emptyTitle,
  emptyDescription,
}: {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  isPending?: boolean;
  isError?: boolean;
  emptyTitle: string;
  emptyDescription?: string;
}) {
  if (isPending) return <LoadingState />;
  if (isError) return <ErrorState />;
  if (rows.length === 0)
    return <EmptyState title={emptyTitle} description={emptyDescription ?? ""} />;
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-background shadow-[var(--shadow-sm)]">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={getRowId(row)}>
              {columns.map((column) => (
                <TableCell key={column.key} className={column.className}>
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  label = "Search",
  placeholder = "Search",
}: {
  value: string;
  onChange: (next: string) => void;
  label?: string;
  placeholder?: string;
}) {
  return (
    <div className="min-w-56 flex-1">
      <Label htmlFor="admin-search">{label}</Label>
      <div className="relative mt-2">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="admin-search"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
    </div>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = `filter-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className="min-w-44">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="mt-2 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function StatusBadge({
  status,
  tone = "neutral",
}: {
  status: string;
  tone?: "neutral" | "positive" | "warning" | "critical";
}) {
  const classes = {
    neutral: "bg-muted text-muted-foreground",
    positive: "bg-primary/10 text-primary",
    warning: "bg-warning text-warning-foreground",
    critical: "bg-destructive/10 text-destructive",
  } as const;
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium capitalize", classes[tone])}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  total,
}: {
  page: number;
  pageCount: number;
  onPageChange: (next: number) => void;
  total: number;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Page {page} of {pageCount} · {total} records
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}

export function AdminError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive"
    >
      {message}
    </p>
  );
}

export function AdminDataError({ error }: { error: unknown }) {
  return <AdminError message={error ? userFacingDataError(error) : null} />;
}
