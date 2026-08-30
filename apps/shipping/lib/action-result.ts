/**
 * The response envelope every server action in this app returns, matching the
 * convention in .planning/codebase/CONVENTIONS.md.
 *
 * Actions annotate their return type with these rather than letting TypeScript
 * infer a union of differently-shaped object literals — an inferred union
 * widens `success` to `boolean` and so cannot be narrowed at the call site,
 * which makes `result.data` unreachable for callers.
 */
export interface ActionResult<T = never> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * For actions that return a collection. `data` is non-optional and empty on
 * failure, so a caller can render the list without a null check — an empty
 * table next to an error message is the right thing to show either way.
 */
export interface ListResult<T> {
  success: boolean;
  data: T[];
  error?: string;
}

export interface PaginatedResult<T> extends ListResult<T> {
  totalCount: number;
}

/** Logs with a consistent prefix and returns a message safe to show the user. */
export function actionError(context: string, error: unknown): string {
  console.error(`${context}:`, error);
  return error instanceof Error ? error.message : "Something went wrong";
}
