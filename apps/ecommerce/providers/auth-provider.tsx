"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AuthenticatedUserDisplay } from "@/lib/auth/auth-user.types";

const AUTH_CHANGED_EVENT = "tallaby:auth-changed";

/** Minimum gap between tab-focus re-checks, so switching tabs does not fire a
 * lookup every time. */
const FOCUS_REFRESH_INTERVAL_MS = 30_000;

/** Cap hung lookups so the navbar never stays blank forever. */
const REFRESH_TIMEOUT_MS = 8_000;

export interface AuthUserState {
  user: AuthenticatedUserDisplay | null;
  isLoading: boolean;
  /** Re-reads the viewer from the server. */
  refresh: () => Promise<void>;
  /** Apply a known viewer immediately (e.g. right after sign-in). */
  applyUser: (nextUser: AuthenticatedUserDisplay | null) => void;
}

const AuthUserContext = createContext<AuthUserState | null>(null);

/**
 * Tells every mounted `useAuthUser()` that the viewer changed.
 *
 * Sign in, sign out and avatar upload all run as server actions, so the state
 * they change lives in cookies and the database rather than anywhere the
 * browser can observe. Nothing fires on its own, which is why the navbar used
 * to keep its signed-out state (and keep linking to `/auth`) until a full page
 * reload. Call this right after any server-side auth or profile mutation.
 */
export function notifyAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

async function fetchCurrentUserDisplay(): Promise<AuthenticatedUserDisplay | null> {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`auth/me failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    user: AuthenticatedUserDisplay | null;
  };
  return payload.user ?? null;
}

/**
 * Resolves the viewer once per page and shares the result.
 *
 * Why the client resolves this at all: every route under (main) is ISR-rendered
 * (`revalidate = 60` for the homepage, up to 3600 elsewhere) and this app does
 * not enable cacheComponents/PPR, so any `cookies()` read in the layout that
 * hosts the header would turn the entire storefront dynamic. The header is the
 * one part of that static shell that must know who is signed in, so it — and
 * only it — is resolved after hydration. `/sell` and `/contact` already rely on
 * the same trade-off for the same reason.
 *
 * Lookup goes through `/api/auth/me` rather than a Server Action: actions POST
 * to the current page URL, so a page compile/runtime 500 leaves the promise
 * hanging and the navbar stuck in its loading (blank) state.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUserDisplay | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Guards against an older in-flight lookup resolving after a newer one and
  // overwriting the fresher answer.
  const requestIdRef = useRef(0);
  const lastRefreshAtRef = useRef(0);

  const applyUser = useCallback((nextUser: AuthenticatedUserDisplay | null) => {
    requestIdRef.current += 1;
    setUser(nextUser);
    setIsLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    lastRefreshAtRef.current = Date.now();

    // #region agent log
    fetch("http://127.0.0.1:7624/ingest/6c4132ee-ad2b-461c-81f7-d283121d1f71", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "7135eb",
      },
      body: JSON.stringify({
        sessionId: "7135eb",
        runId: "post-fix",
        hypothesisId: "F",
        location: "auth-provider.tsx:refresh:start",
        message: "AuthProvider refresh started",
        data: { requestId, via: "api/auth/me" },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    try {
      const nextUser = await Promise.race([
        fetchCurrentUserDisplay(),
        new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error("auth refresh timed out")),
            REFRESH_TIMEOUT_MS
          );
        }),
      ]);
      // #region agent log
      fetch("http://127.0.0.1:7624/ingest/6c4132ee-ad2b-461c-81f7-d283121d1f71", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "7135eb",
        },
        body: JSON.stringify({
          sessionId: "7135eb",
          runId: "post-fix",
          hypothesisId: "F",
          location: "auth-provider.tsx:refresh:result",
          message: "AuthProvider refresh result",
          data: {
            requestId,
            hasUser: Boolean(nextUser),
            userIdPrefix: nextUser?.id?.slice(0, 8) ?? null,
            isStale: requestId !== requestIdRef.current,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      if (requestId !== requestIdRef.current) return;
      setUser(nextUser);
    } catch (error) {
      // #region agent log
      fetch("http://127.0.0.1:7624/ingest/6c4132ee-ad2b-461c-81f7-d283121d1f71", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "7135eb",
        },
        body: JSON.stringify({
          sessionId: "7135eb",
          runId: "post-fix",
          hypothesisId: "F",
          location: "auth-provider.tsx:refresh:error",
          message: "AuthProvider refresh threw",
          data: {
            requestId,
            errorName: error instanceof Error ? error.name : "unknown",
            errorMessage:
              error instanceof Error ? error.message.slice(0, 120) : "unknown",
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      if (requestId !== requestIdRef.current) return;
      console.error("Failed to resolve current user:", error);
      // Keep the current viewer on transient failures (timeout / network).
      // A confirmed signed-out response ({ user: null }) still clears above.
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const handleAuthChanged = () => {
      // #region agent log
      fetch("http://127.0.0.1:7624/ingest/6c4132ee-ad2b-461c-81f7-d283121d1f71", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "7135eb",
        },
        body: JSON.stringify({
          sessionId: "7135eb",
          runId: "post-fix",
          hypothesisId: "B",
          location: "auth-provider.tsx:auth-changed",
          message: "AUTH_CHANGED_EVENT received",
          data: {},
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      void refresh();
    };

    // A sign in/out that happened in another tab only shows up in the cookies,
    // so re-check when this tab comes back to the foreground.
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastRefreshAtRef.current < FOCUS_REFRESH_INTERVAL_MS) {
        return;
      }
      void refresh();
    };

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refresh]);

  const value = useMemo<AuthUserState>(
    () => ({ user, isLoading, refresh, applyUser }),
    [user, isLoading, refresh, applyUser]
  );

  return (
    <AuthUserContext.Provider value={value}>{children}</AuthUserContext.Provider>
  );
}

export function useAuthUserContext(): AuthUserState {
  const context = useContext(AuthUserContext);
  if (!context) {
    throw new Error("useAuthUser must be used inside <AuthProvider>");
  }
  return context;
}
