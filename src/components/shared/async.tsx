import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { ErrorState, LoadingState } from "@/components/shared/page";

export function Async<T>({
  query,
  children,
  empty,
  error,
  isEmpty,
}: {
  query: UseQueryResult<T>;
  children: (data: T) => ReactNode;
  empty?: ReactNode;
  error?: ReactNode;
  isEmpty?: (data: T) => boolean;
}) {
  if (query.isPending) return <LoadingState />;
  if (query.isError) {
    console.error(query.error);
    return error ? <>{error}</> : <ErrorState />;
  }
  const data = query.data as T;
  if (empty && isEmpty?.(data)) return <>{empty}</>;
  return <>{children(data)}</>;
}
