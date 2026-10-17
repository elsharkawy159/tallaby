/**
 * Idempotent creation of a seller ACCOUNT and its primary STORE at signup
 * (PLAN.md §6.3, §6.5, P2-01). Server-only.
 *
 * - The user id must come from the session (never from the client).
 * - One transaction. `INSERT … ON CONFLICT (id) DO NOTHING` makes retries and
 *   double submits safe: an existing seller is returned as `created: false`
 *   and nothing changes (never a second store, never a slug change).
 * - The primary store is created by the 0050 trigger on sellers; this adds the
 *   site scaffold (design system + home page).
 * - No fulfillment rows: resolveEffectiveFulfillment falls back to the baseline.
 * - No seller_wallet row: it is created on the first ledger entry.
 * - The caller sets user_metadata.is_seller afterwards (best effort, needs the
 *   user's Supabase session).
 */
import { and, db, eq, isNull, or, sellers, stores, sql, users } from "@workspace/db";
import { ensureStoreSiteScaffold, isStoreSubdomainTaken } from "../stores/server";
import { displayNameFromSubdomain, signupInputSchema } from "./signup.lib";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

export type EnsureSellerAccountInput = {
  userId: string;
  email: string | null | undefined;
  subdomain: string;
  phone: string;
};

export type EnsureSellerAccountError = "invalid_input" | "taken" | "no_user";

export type EnsureSellerAccountResult =
  | { success: true; data: { created: boolean; sellerId: string; storeId: string | null; subdomain: string } }
  | { success: false; error: EnsureSellerAccountError };

function pgError(error: unknown): { code?: string; constraint?: string } {
  const e = error as { code?: string; constraint_name?: string; cause?: { code?: string; constraint_name?: string } };
  return { code: e?.cause?.code ?? e?.code, constraint: e?.cause?.constraint_name ?? e?.constraint_name };
}

class SignupError extends Error {
  constructor(readonly code: EnsureSellerAccountError) {
    super(code);
  }
}

async function existingAccount(q: Queryable, userId: string) {
  const [row] = await q
    .select({ sellerId: sellers.id, subdomain: sellers.subdomain, storeId: stores.id })
    .from(sellers)
    .leftJoin(stores, and(eq(stores.sellerId, sellers.id), eq(stores.isPrimary, true)))
    .where(eq(sellers.id, userId))
    .limit(1);
  return row ?? null;
}

export async function ensureSellerAccount(
  input: EnsureSellerAccountInput,
  q: Queryable = db,
): Promise<EnsureSellerAccountResult> {
  const existing = await existingAccount(q, input.userId);
  if (existing) {
    return { success: true, data: { created: false, ...existing } };
  }

  const parsed = signupInputSchema.safeParse({ subdomain: input.subdomain, phone: input.phone });
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const { subdomain, phone } = parsed.data;
  const displayName = displayNameFromSubdomain(subdomain);

  try {
    const result = await q.transaction(async (tx) => {
      const [user] = await tx.select({ id: users.id }).from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new SignupError("no_user");

      if (await isStoreSubdomainTaken(tx, subdomain, input.userId)) throw new SignupError("taken");

      // sellers.slug is the marketplace /stores/[slug] URL. Older sellers' slugs
      // can differ from their subdomains, so a free subdomain may still be a
      // taken slug: suffix the slug instead of refusing (D17: independent).
      const [slugOwner] = await tx.select({ id: sellers.id }).from(sellers).where(eq(sellers.slug, subdomain)).limit(1);
      const slug = slugOwner ? `${subdomain}-${input.userId.slice(0, 6)}` : subdomain;

      const inserted = await tx
        .insert(sellers)
        .values({
          id: input.userId,
          businessName: displayName,
          displayName,
          slug,
          subdomain,
          businessType: "individual",
          legalAddress: { country: "EG" },
          supportEmail: input.email ?? "",
          supportPhone: phone,
          status: "approved",
          onboardingComplete: false,
          // New sellers get the 30-day no-fee trial (D5, P6-02).
          feeTrialEligible: true,
        })
        .onConflictDoNothing({ target: sellers.id })
        .returning({ id: sellers.id });

      // Lost a race with a concurrent call for the same user: theirs wins.
      if (!inserted.length) return null;

      // Promote plain customers only (same rule as become-seller.server.ts).
      await tx
        .update(users)
        .set({ role: "seller", updatedAt: sql`now()` })
        .where(and(eq(users.id, input.userId), or(isNull(users.role), eq(users.role, "customer"))));

      const [primary] = await tx
        .select({ id: stores.id })
        .from(stores)
        .where(and(eq(stores.sellerId, input.userId), eq(stores.isPrimary, true)))
        .limit(1);
      if (primary) await ensureStoreSiteScaffold(tx, primary.id);
      return { created: true, sellerId: input.userId, storeId: primary?.id ?? null, subdomain };
    });

    if (result) return { success: true, data: result };
    const winner = await existingAccount(q, input.userId);
    return winner
      ? { success: true, data: { created: false, ...winner } }
      : { success: false, error: "taken" };
  } catch (error) {
    if (error instanceof SignupError) return { success: false, error: error.code };
    const { code } = pgError(error);
    if (code === "23505") {
      // Unique violation: the same user racing (sellers_pkey) → return theirs;
      // otherwise another user took the subdomain or slug first.
      const winner = await existingAccount(q, input.userId);
      if (winner) return { success: true, data: { created: false, ...winner } };
      return { success: false, error: "taken" };
    }
    if (code === "23503") return { success: false, error: "no_user" };
    throw error;
  }
}
