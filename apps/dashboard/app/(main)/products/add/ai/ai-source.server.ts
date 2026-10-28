"use server"

import { countAiUsageSince } from "@workspace/ai"
import { and, db, eq, products, sql } from "@workspace/db"
import { requireSeller } from "@/lib/auth/require-seller.server"
import { AUTOFILL_FEATURE } from "./ai-autofill.dto"

/** The AI fill must have happened recently: the form is filled and saved in one sitting. */
const RECENT_AUTOFILL_MS = 24 * 60 * 60 * 1000

/**
 * Marks a product the seller just saved with AI changes in the form (0112),
 * for Admin › Products. Called after createProduct / updateProduct, so
 * actions/products.ts stays untouched. The product must be the session
 * seller's, and the seller must have a successful autofill call in the last
 * day; otherwise nothing is written. A product added with AI stays
 * 'autofill_add' after later AI edits. Never throws: the product is saved
 * either way.
 */
export async function markProductAiAssisted(productId: string, mode: "add" | "edit"): Promise<{ success: boolean }> {
  try {
    if (typeof productId !== "string" || (mode !== "add" && mode !== "edit")) return { success: false }
    const seller = await requireSeller({ forWrite: true })
    const used = await countAiUsageSince(seller.sellerId, AUTOFILL_FEATURE, new Date(Date.now() - RECENT_AUTOFILL_MS))
    if (used === 0) return { success: false }

    const source = mode === "add" ? sql`'autofill_add'` : sql`coalesce(${products.aiSource}, 'autofill_edit')`
    const updated = await db
      .update(products)
      .set({ aiSource: source, aiAssistedAt: new Date().toISOString() })
      .where(and(eq(products.id, productId), eq(products.sellerId, seller.sellerId)))
      .returning({ id: products.id })
    return { success: updated.length > 0 }
  } catch (error) {
    console.error("[ai] mark product failed", error instanceof Error ? error.message : error)
    return { success: false }
  }
}
