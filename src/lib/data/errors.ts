export type DataErrorKind = "permission" | "authentication" | "invalid_value" | "unavailable" | "query";

export class DataAccessError extends Error {
  constructor(public readonly kind: DataErrorKind, message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = "DataAccessError";
  }
}

export function classifyDataError(error: unknown): DataAccessError {
  if (error instanceof DataAccessError) return error;
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();
  if (normalized.includes("permission") || normalized.includes("row-level security") || normalized.includes("42501")) {
    return new DataAccessError("permission", "You do not have permission to complete this action.", error);
  }
  if (normalized.includes("jwt") || normalized.includes("unauthorized") || normalized.includes("authentication")) {
    return new DataAccessError("authentication", "Your session has expired. Please sign in again.", error);
  }
  if (normalized.includes("enum") || normalized.includes("invalid input value")) {
    return new DataAccessError("invalid_value", "That status or option is not supported.", error);
  }
  if (normalized.includes("does not exist") || normalized.includes("schema cache")) {
    return new DataAccessError("unavailable", "This feature is not available on the connected backend.", error);
  }
  return new DataAccessError("query", "We couldn't load or save this information. Please try again.", error);
}

export function userFacingDataError(error: unknown): string {
  return classifyDataError(error).message;
}
