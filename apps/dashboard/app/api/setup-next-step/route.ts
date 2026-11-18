import { NextResponse } from "next/server";
import { loadSetupNextStep } from "@/app/[locale]/(main)/_components/setup-next-step.server";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";

/**
 * The header's "Next step" button (owner, 2026-11-18) asks again after each
 * page change and after a setup action, so it updates without a reload. The
 * seller and store come from the session only; nothing is read from the client.
 */
export async function GET() {
  let sellerId: string;
  try {
    sellerId = (await requireSeller()).sellerId;
  } catch (error) {
    if (isAccessError(error)) return new NextResponse(null, { status: 401 });
    throw error;
  }
  const next = await loadSetupNextStep(sellerId);
  return NextResponse.json(next, { headers: { "Cache-Control": "no-store" } });
}
