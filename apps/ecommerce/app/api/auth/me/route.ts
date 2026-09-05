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
    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    // 503 (not 500) so the client can keep the current viewer on transient
    // failures instead of treating this as a confirmed signed-out response.
    return NextResponse.json({ user: null }, { status: 503 });
  }
}
