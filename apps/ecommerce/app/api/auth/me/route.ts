import { NextResponse } from "next/server";
import { getAuthUserDisplay } from "@/lib/auth/current-user";

/**
 * Client-side viewer lookup for AuthProvider.
 *
 * Served as a Route Handler (not a Server Action) so a broken or still-
 * compiling page cannot take the navbar auth refresh down with it —
 * Server Actions POST to the current page URL and hang when that page 500s.
 */
export async function GET() {
  try {
    const user = await getAuthUserDisplay();
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
        location: "api/auth/me/route.ts:GET",
        message: "api/auth/me resolved",
        data: {
          hasUser: Boolean(user),
          userIdPrefix: user?.id?.slice(0, 8) ?? null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return NextResponse.json({ user });
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
        location: "api/auth/me/route.ts:GET:error",
        message: "api/auth/me threw",
        data: {
          errorName: error instanceof Error ? error.name : "unknown",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    console.error("GET /api/auth/me error:", error);
    // 503 (not 500) so the client can keep the current viewer on transient
    // failures instead of treating this as a confirmed signed-out response.
    return NextResponse.json({ user: null }, { status: 503 });
  }
}
