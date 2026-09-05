const DEFAULT_TIMEOUT_MS = 8000;

/**
 * supabase-js never times out its own fetch calls — a slow/unreachable
 * Auth or PostgREST endpoint hangs the calling request forever. Every
 * Supabase client in this app (browser, server, middleware) is created with
 * this as `global.fetch` so auth checks fail fast instead of hanging the
 * whole page (or the proxy, which blocks every navigation).
 */
export function createTimeoutFetch(timeoutMs: number = DEFAULT_TIMEOUT_MS): typeof fetch {
  return (input, init) =>
    fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(timeoutMs) });
}
