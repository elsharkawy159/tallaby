"use server";

import { and, db, eq, isNull, sellers } from "@workspace/db";
import { heardAboutUsInputSchema } from "@workspace/lib/sellers";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";

/**
 * Saves the "where did you hear about us" pop-up answer (0099). The seller
 * comes from the session; the first answer wins, so a second tab or a replay
 * never overwrites it.
 */

export type HeardAboutUsResult = { success: true } | { success: false; error: "invalidInput" | "forbidden" | "generic" };

export async function saveHeardAboutUs(input: unknown): Promise<HeardAboutUsResult> {
  const parsed = heardAboutUsInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalidInput" };
  try {
    const seller = await requireSeller();
    await db
      .update(sellers)
      .set({
        heardAboutUs: parsed.data.source,
        heardAboutUsOther: parsed.data.other,
        heardAboutUsAt: new Date().toISOString(),
      })
      .where(and(eq(sellers.id, seller.sellerId), isNull(sellers.heardAboutUsAt)));
    return { success: true };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "forbidden" };
    console.error("[heard-about-us] save failed");
    return { success: false, error: "generic" };
  }
}
