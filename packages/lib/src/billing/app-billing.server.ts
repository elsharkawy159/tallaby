import { and, db, eq, isNull, lte, or, sellerNotifications, sql, storeAppInstalls, stores, walletTransactions } from "@workspace/db";
import {
  DuplicateStoreWalletEntryError,
  getStoreWalletSummary,
  postStoreWalletEntry,
  STORE_WALLET_REFERENCE_TYPES,
  StoreWalletCurrencyError,
  StoreWalletLimitError,
  StoreWalletNotActiveError,
} from "@workspace/db/wallet";
import { getStoreApp, isStoreAppLive, storeAppPricing } from "../integrations/catalog";
import {
  appChargeAmount,
  appChargeReference,
  isPaidAppPricing,
  isValidAppPricing,
  isValidAppUsageEvent,
  type AppCharge,
  type AppPricing,
  type AppPricingModel,
  type AppUsageUnit,
} from "./app-pricing.lib";
import { addOneMonth, PLAN_GRACE_DAYS } from "./billing.lib";
import { getBillingState } from "./billing.server";

/**
 * Store app installs and their charges from the USD store wallet (ROADMAP.md
 * F-47; docs/superpowers/specs/2026-11-03-apps-marketplace-design.md).
 * Server-only. Callers pass the session's seller and an explicit store; every
 * query filters on both. No app charge may take the wallet past its limit.
 */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type InstallRow = typeof storeAppInstalls.$inferSelect;

/** What the engine needs from a catalog entry. Tests pass their own, so no paid app has to ship. */
/** What the seller reads on their wallet ledger. */
const APP_CHARGE_DESCRIPTIONS: Record<string, string> = {
  customer_notifications: "Order notifications",
};

export type BillableApp = { key: string; pricing: AppPricing; live: boolean };
export type AppResolver = (key: string) => BillableApp | null;

const catalogApp: AppResolver = (key) => {
  const app = getStoreApp(key);
  return app ? { key: app.key, pricing: storeAppPricing(app), live: isStoreAppLive(app) } : null;
};

type AppTarget = { sellerId: string; storeId: string; appKey: string };

export type AppInstallError =
  | "not_available"
  | "not_live"
  | "not_found"
  | "already_installed"
  | "insufficient_balance"
  | "wallet_inactive"
  | "wallet_not_usd";

export type AppInstallResult = { success: true } | { success: false; error: AppInstallError };
export type AppUninstallResult = { success: true; endsAt: string | null } | { success: false; error: "not_installed" };
export type AppUsageResult =
  | { charged: true }
  | { charged: false; reason: "duplicate" | "invalid" | "not_installed" | "insufficient_balance" | "wallet_not_usd" };

const liveInstall = ({ sellerId, storeId, appKey }: AppTarget) =>
  and(
    eq(storeAppInstalls.sellerId, sellerId),
    eq(storeAppInstalls.storeId, storeId),
    eq(storeAppInstalls.appKey, appKey),
    isNull(storeAppInstalls.uninstalledAt),
  );

async function charge(
  tx: Tx,
  target: AppTarget,
  usdCents: number,
  what: AppCharge,
  extra: { actorId?: string | null; orderId?: string | null; quantity?: number; metadata?: Record<string, unknown> } = {},
) {
  const referenceType = STORE_WALLET_REFERENCE_TYPES.storeApp;
  const referenceId = appChargeReference(target.storeId, target.appKey, what);
  // The wallet checks the balance before the claim, so a retry of a paid charge
  // on a short wallet would read as "can't pay". The unique index still decides a race.
  const [paid] = await tx
    .select({ id: walletTransactions.id })
    .from(walletTransactions)
    .where(
      and(
        eq(walletTransactions.sellerId, target.sellerId),
        eq(walletTransactions.type, "service_charge"),
        eq(walletTransactions.referenceType, referenceType),
        eq(walletTransactions.referenceId, referenceId),
      ),
    );
  if (paid) throw new DuplicateStoreWalletEntryError(target.sellerId, "service_charge", referenceType, referenceId);

  return postStoreWalletEntry(tx, {
    sellerId: target.sellerId,
    storeId: target.storeId,
    orderId: extra.orderId ?? null,
    type: "service_charge",
    amount: appChargeAmount(usdCents, extra.quantity ?? 1),
    currency: "USD",
    referenceType,
    referenceId,
    description: APP_CHARGE_DESCRIPTIONS[target.appKey] ?? `App: ${target.appKey}`,
    metadata: { appKey: target.appKey, model: what.model, usdCents, ...extra.metadata },
    createdBy: extra.actorId ?? null,
    enforceNegativeLimit: true,
  });
}

function walletRefusal(error: unknown): "insufficient_balance" | "wallet_inactive" | "wallet_not_usd" | null {
  if (error instanceof StoreWalletLimitError) return "insufficient_balance";
  if (error instanceof StoreWalletNotActiveError) return "wallet_inactive";
  if (error instanceof StoreWalletCurrencyError) return "wallet_not_usd";
  return null;
}

/**
 * Installs an app. A paid one refuses before the USD switch. This is the
 * entry point for the dashboard; `resolveApp` is only for tests.
 */
export async function installStoreApp(
  input: AppTarget & { actorId: string },
  resolveApp: AppResolver = catalogApp,
): Promise<AppInstallResult> {
  const app = resolveApp(input.appKey);
  if (!app || !app.live) return { success: false, error: "not_available" };
  if (isPaidAppPricing(app.pricing) && !(await getBillingState()).usdLive) return { success: false, error: "not_live" };
  return chargeAndInstallApp(input, app);
}

/** The install itself, below the USD switch check. Callers use `installStoreApp`. */
export async function chargeAndInstallApp(
  input: AppTarget & { actorId: string },
  app: BillableApp,
  now: Date = new Date(),
): Promise<AppInstallResult> {
  const { pricing } = app;
  if (!isValidAppPricing(pricing)) return { success: false, error: "not_available" };
  try {
    return await db.transaction(async (tx): Promise<AppInstallResult> => {
      const [store] = await tx
        .select({ id: stores.id })
        .from(stores)
        .where(and(eq(stores.id, input.storeId), eq(stores.sellerId, input.sellerId), isNull(stores.deletedAt)));
      if (!store) return { success: false, error: "not_found" };

      const [existing] = await tx.select().from(storeAppInstalls).where(liveInstall(input)).for("update");
      if (existing) {
        // Removed but still paid for: installing again just keeps it, with no charge.
        if (!existing.cancelAtPeriodEnd) return { success: false, error: "already_installed" };
        await tx
          .update(storeAppInstalls)
          .set({ cancelAtPeriodEnd: false, updatedAt: now.toISOString() })
          .where(eq(storeAppInstalls.id, existing.id));
        return { success: true };
      }

      const monthly = pricing.model === "monthly";
      const inserted = await tx
        .insert(storeAppInstalls)
        .values({
          sellerId: input.sellerId,
          storeId: input.storeId,
          appKey: input.appKey,
          pricingModel: pricing.model,
          priceUsdCents: isPaidAppPricing(pricing) ? pricing.usdCents : 0,
          usageUnit: pricing.model === "usage" ? pricing.unit : null,
          currentPeriodStart: monthly ? now.toISOString() : null,
          currentPeriodEnd: monthly ? addOneMonth(now).toISOString() : null,
          installedBy: input.actorId,
        })
        .onConflictDoNothing()
        .returning({ id: storeAppInstalls.id });
      // A double click: the other request won the unique index and took the charge.
      if (!inserted.length) return { success: false, error: "already_installed" };

      if (pricing.model === "one_time") {
        try {
          await charge(tx, input, pricing.usdCents, { model: "one_time" }, { actorId: input.actorId });
        } catch (error) {
          // A bought app stays bought: the claim is taken, so this reinstall is free.
          if (!(error instanceof DuplicateStoreWalletEntryError)) throw error;
        }
      } else if (monthly) {
        await charge(tx, input, pricing.usdCents, { model: "monthly", periodStart: now }, { actorId: input.actorId });
      }
      return { success: true };
    });
  } catch (error) {
    const refusal = walletRefusal(error);
    if (refusal) return { success: false, error: refusal };
    throw error;
  }
}

function endInstall(tx: Tx, installId: string, reason: "seller" | "payment_failed" | "retired", stamp: string) {
  return tx
    .update(storeAppInstalls)
    .set({ uninstalledAt: stamp, uninstallReason: reason, graceUntil: null, cancelAtPeriodEnd: false, updatedAt: stamp })
    .where(eq(storeAppInstalls.id, installId));
}

/**
 * Removes an app. A monthly app in a paid period stays until the period ends,
 * with no refund (`endsAt`); everything else goes right away.
 */
export async function uninstallStoreApp(target: AppTarget, now: Date = new Date()): Promise<AppUninstallResult> {
  return db.transaction(async (tx): Promise<AppUninstallResult> => {
    const [install] = await tx.select().from(storeAppInstalls).where(liveInstall(target)).for("update");
    if (!install) return { success: false, error: "not_installed" };

    const stamp = now.toISOString();
    const paidUntil = install.currentPeriodEnd ? new Date(install.currentPeriodEnd) : null;
    if (install.pricingModel === "monthly" && !install.graceUntil && paidUntil && paidUntil > now) {
      await tx
        .update(storeAppInstalls)
        .set({ cancelAtPeriodEnd: true, updatedAt: stamp })
        .where(eq(storeAppInstalls.id, install.id));
      return { success: true, endsAt: paidUntil.toISOString() };
    }
    await endInstall(tx, install.id, "seller", stamp);
    return { success: true, endsAt: null };
  });
}

/**
 * Bills one usage event. Call it before the action, and run the action only on
 * `charged` or `duplicate` (a retry of an event already paid for).
 */
export async function chargeAppUsage(target: AppTarget & { eventId: string; quantity?: number }): Promise<AppUsageResult> {
  const quantity = target.quantity ?? 1;
  if (!isValidAppUsageEvent(target.eventId, quantity)) return { charged: false, reason: "invalid" };
  try {
    return await db.transaction(async (tx): Promise<AppUsageResult> => {
      const [install] = await tx.select().from(storeAppInstalls).where(liveInstall(target));
      if (!install || install.pricingModel !== "usage") return { charged: false, reason: "not_installed" };
      await charge(
        tx,
        target,
        install.priceUsdCents,
        { model: "usage", eventId: target.eventId },
        { quantity, metadata: { unit: install.usageUnit, quantity } },
      );
      return { charged: true };
    });
  } catch (error) {
    if (error instanceof DuplicateStoreWalletEntryError) return { charged: false, reason: "duplicate" };
    const refusal = walletRefusal(error);
    if (refusal === "wallet_not_usd") return { charged: false, reason: "wallet_not_usd" };
    if (refusal) return { charged: false, reason: "insufficient_balance" };
    throw error;
  }
}

async function notify(tx: Tx, install: InstallRow, type: "app_renewed" | "app_renewal_failed" | "app_ended", key: string) {
  await tx
    .insert(sellerNotifications)
    .values({
      sellerId: install.sellerId,
      storeId: install.storeId,
      type,
      data: { appKey: install.appKey, storeId: install.storeId },
      dedupeKey: `${type}:${install.id}:${key}`,
    })
    .onConflictDoNothing();
}

async function startGrace(tx: Tx, install: InstallRow, now: Date) {
  await tx
    .update(storeAppInstalls)
    .set({ graceUntil: new Date(now.getTime() + PLAN_GRACE_DAYS * 86_400_000).toISOString(), updatedAt: now.toISOString() })
    .where(eq(storeAppInstalls.id, install.id));
  await notify(tx, install, "app_renewal_failed", now.toISOString());
}

/**
 * Bills a store's per-order apps inside the order's transaction. It never
 * fails the order over money: a wallet that can't pay forgives this order's
 * charge and puts the app in grace, and a charge that succeeds ends grace.
 */
export async function chargeStoreAppsForOrder(
  tx: Tx,
  order: { sellerId: string; storeId: string; orderId: string },
  now: Date = new Date(),
): Promise<{ charged: number; forgiven: number }> {
  const counts = { charged: 0, forgiven: 0 };
  const installs = await tx
    .select()
    .from(storeAppInstalls)
    .where(
      and(
        eq(storeAppInstalls.sellerId, order.sellerId),
        eq(storeAppInstalls.storeId, order.storeId),
        eq(storeAppInstalls.pricingModel, "per_order"),
        isNull(storeAppInstalls.uninstalledAt),
      ),
    );
  for (const install of installs) {
    const target = { sellerId: order.sellerId, storeId: order.storeId, appKey: install.appKey };
    try {
      await charge(tx, target, install.priceUsdCents, { model: "per_order", orderId: order.orderId }, { orderId: order.orderId });
      counts.charged += 1;
      if (install.graceUntil) {
        await tx
          .update(storeAppInstalls)
          .set({ graceUntil: null, updatedAt: now.toISOString() })
          .where(eq(storeAppInstalls.id, install.id));
      }
    } catch (error) {
      if (error instanceof DuplicateStoreWalletEntryError) continue;
      if (!walletRefusal(error)) throw error;
      counts.forgiven += 1;
      if (!install.graceUntil) await startGrace(tx, install, now);
    }
  }
  return counts;
}

export type AppRenewalOutcome = "renewed" | "grace" | "ended" | "skipped";

/** One install's turn in the daily job. Locks the row, so a second run finds nothing to do. */
export async function renewOneApp(
  installId: string,
  now: Date = new Date(),
  resolveApp: AppResolver = catalogApp,
): Promise<AppRenewalOutcome> {
  return db.transaction(async (tx): Promise<AppRenewalOutcome> => {
    const [install] = await tx.select().from(storeAppInstalls).where(eq(storeAppInstalls.id, installId)).for("update");
    if (!install || install.uninstalledAt) return "skipped";
    const stamp = now.toISOString();
    const graceOver = Boolean(install.graceUntil && new Date(install.graceUntil) <= now);

    const end = async (reason: "seller" | "payment_failed" | "retired", key: string) => {
      await endInstall(tx, install.id, reason, stamp);
      await notify(tx, install, "app_ended", key);
      return "ended" as const;
    };

    if (install.pricingModel !== "monthly") {
      if (!graceOver) return "skipped";
      // Per-order grace: nothing here retries a charge, so see whether the wallet can pay the next one.
      const wallet = await getStoreWalletSummary(tx, install.sellerId);
      const walletCents = wallet ? Math.round(Number(wallet.balance) * 100) : 0;
      if (wallet?.status === "active" && walletCents >= install.priceUsdCents) {
        await tx.update(storeAppInstalls).set({ graceUntil: null, updatedAt: stamp }).where(eq(storeAppInstalls.id, install.id));
        return "renewed";
      }
      return end("payment_failed", stamp);
    }

    const periodEnd = new Date(install.currentPeriodEnd!);
    if (periodEnd > now) return "skipped";
    if (install.cancelAtPeriodEnd) return end("seller", install.currentPeriodEnd!);
    if (!resolveApp(install.appKey)) return end("retired", install.currentPeriodEnd!);

    const target = { sellerId: install.sellerId, storeId: install.storeId, appKey: install.appKey };
    try {
      await charge(tx, target, install.priceUsdCents, { model: "monthly", periodStart: periodEnd });
    } catch (error) {
      if (error instanceof DuplicateStoreWalletEntryError) {
        // Already charged for this period: only the dates were left behind.
      } else if (error instanceof StoreWalletLimitError || error instanceof StoreWalletNotActiveError) {
        if (graceOver) return end("payment_failed", install.currentPeriodEnd!);
        if (!install.graceUntil) await startGrace(tx, install, now);
        return "grace";
      } else {
        throw error;
      }
    }

    await tx
      .update(storeAppInstalls)
      .set({
        currentPeriodStart: periodEnd.toISOString(),
        currentPeriodEnd: addOneMonth(periodEnd).toISOString(),
        graceUntil: null,
        updatedAt: stamp,
      })
      .where(eq(storeAppInstalls.id, install.id));
    await notify(tx, install, "app_renewed", install.currentPeriodEnd!);
    return "renewed";
  });
}

/** The daily job (plan-renewals cron). Does nothing before the USD switch. One failure never stops the others. */
export async function renewDueApps(now: Date = new Date()): Promise<Record<AppRenewalOutcome | "failed", number>> {
  const counts = { renewed: 0, grace: 0, ended: 0, skipped: 0, failed: 0 };
  if (!(await getBillingState()).usdLive) return counts;
  const stamp = now.toISOString();
  const due = await db
    .select({ id: storeAppInstalls.id })
    .from(storeAppInstalls)
    .where(
      and(
        isNull(storeAppInstalls.uninstalledAt),
        // A closed account (F-82, 0157) is never charged while it waits for its purge.
        sql`NOT EXISTS (SELECT 1 FROM account_deletion_requests a WHERE a.user_id = ${storeAppInstalls.sellerId} AND a.status = 'scheduled')`,
        or(
          and(eq(storeAppInstalls.pricingModel, "monthly"), lte(storeAppInstalls.currentPeriodEnd, stamp)),
          lte(storeAppInstalls.graceUntil, stamp),
        ),
      ),
    );
  for (const { id } of due) {
    try {
      counts[await renewOneApp(id, now)] += 1;
    } catch (error) {
      counts.failed += 1;
      console.error("[apps] renewal failed", id, error instanceof Error ? error.message : error);
    }
  }
  return counts;
}

export type StoreAppInstallSummary = {
  appKey: string;
  pricingModel: AppPricingModel;
  usageUnit: AppUsageUnit | null;
  priceUsdCents: number;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  graceUntil: string | null;
};

/** A store's live installs, for the Apps page. */
export async function listStoreAppInstalls(sellerId: string, storeId: string): Promise<StoreAppInstallSummary[]> {
  const rows = await db
    .select({
      appKey: storeAppInstalls.appKey,
      pricingModel: storeAppInstalls.pricingModel,
      usageUnit: storeAppInstalls.usageUnit,
      priceUsdCents: storeAppInstalls.priceUsdCents,
      currentPeriodEnd: storeAppInstalls.currentPeriodEnd,
      cancelAtPeriodEnd: storeAppInstalls.cancelAtPeriodEnd,
      graceUntil: storeAppInstalls.graceUntil,
    })
    .from(storeAppInstalls)
    .where(and(eq(storeAppInstalls.sellerId, sellerId), eq(storeAppInstalls.storeId, storeId), isNull(storeAppInstalls.uninstalledAt)));
  return rows as StoreAppInstallSummary[];
}
