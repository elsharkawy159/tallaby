import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SETUP_DISMISS_COOKIE } from "@/app/(main)/_components/home.shared";
import { syncSetupPrompts } from "@/app/(main)/_components/setup-prompts.data";
import { parseSetupPromptEvent } from "@/app/(main)/_components/setup-prompts.lib";
import { requireSeller } from "@/lib/auth/require-seller.server";

/**
 * The guided setup prompts' state (ROADMAP.md F-44). A route, not a server
 * action, so it runs after the page has loaded and never holds up a navigation.
 */
export async function POST(request: Request) {
  try {
    const seller = await requireSeller();
    const body = (await request.json().catch(() => null)) as { event?: unknown } | null;
    const guideDismissed = (await cookies()).get(SETUP_DISMISS_COOKIE)?.value === "1";
    const result = await syncSetupPrompts(seller.sellerId, parseSetupPromptEvent(body?.event), guideDismissed);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ prompt: null, finished: false }, { status: 500 });
  }
}
