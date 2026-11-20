import "server-only";

export class SupabaseDataError extends Error {
  constructor(operation: string) {
    super(`The ${operation} request could not be completed.`);
    this.name = "SupabaseDataError";
  }
}

export function requireSupabaseData<T>(
  result: { data: T; error: unknown | null | undefined },
  operation: string,
): T {
  if (result.error) throw new SupabaseDataError(operation);
  return result.data;
}
