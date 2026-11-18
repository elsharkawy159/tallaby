/**
 * Tallaby Pay settlement: the callback of Tallaby's own EasyKash account
 * (ROADMAP.md F-100c, design §5, §6.2). Server-only.
 *
 * Trust chain (design §10): the HMAC with Tallaby's secret proves EasyKash
 * sent it; the Inquiry API with Tallaby's key proves the payment is PAID and
 * gives the amount; the order, store, seller, fee and hold come from our own
 * reference and order row, never from the callback. The order claim, the
 * `tallaby_pay_sales` row and the `sale` ledger entry commit in ONE
 * transaction, so an order is never paid without its earnings, nor the other
 * way round. Replays stop at the advisory lock + the guarded order claim, and
 * the sale's unique (order, purpose) and easykash_ref and the entry claim are
 * backstops. Hold days are 0 (owner, 2026-11-18): the net only goes to
 * `pending` here; the release on delivery is F-100d.
 */
import { db, eq, orders, sql, stores, tallabyPaySales } from "@workspace/db";

import { isEasykashPaidStatus, readEasykashCallback, verifyEasykashSignature } from "../easykash/easykash.lib";
import { EasykashApiError, inquireEasykashPayment } from "../easykash/easykash.server";
import { notifyDeposit } from "../orders/cod-deposit.server";
import { parseTallabyPayReference, type GatewayEvent } from "../payments/store-gateways.lib";
import {
  claimGatewayPayment,
  isDepositOrder,
  type GatewayCallOptions,
  type GatewayWebhookResult,
} from "../payments/store-gateways.server";
import { piastresToAmount, splitTallabyPay } from "./fee.lib";
import { ensureTallabyPayWallet, postTallabyPayEntry } from "./ledger.server";
import { isValidEasykashRef, readTallabyPaySettleTarget, tallabyPayTransactionId, type TallabyPaySettleTarget } from "./settle.lib";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const IGNORED: GatewayWebhookResult = { status: 200, body: { received: true, outcome: "ignored" } };
const SETTLE_FAILED: GatewayWebhookResult = { status: 500, body: { error: "Payment settlement failed" } };

/** Server-only env (design §2.3, rule 10): never `NEXT_PUBLIC_*`, never logged. */
function env(name: "TALLABY_EASYKASH_HMAC_SECRET" | "TALLABY_EASYKASH_API_KEY"): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

/**
 * `GET|POST /api/webhooks/tallaby-pay/easykash` (apps/backend). EasyKash
 * calls it only for paid payments; it may retry, so every non-final problem
 * is a 500 and every final one a 200. Bodies are never logged (buyer data).
 */
export async function handleTallabyPayCallback(raw: unknown, options: GatewayCallOptions = {}): Promise<GatewayWebhookResult> {
  const fields = readEasykashCallback(raw);
  if (!fields.customerReference || !fields.signatureHash) return { status: 400, body: { error: "Invalid callback payload" } };

  // The secret is Tallaby's, not a store's, so the signature comes first:
  // nothing is read for an unsigned call.
  const hmacSecret = env("TALLABY_EASYKASH_HMAC_SECRET");
  if (!hmacSecret) {
    console.error("[tallaby-pay] TALLABY_EASYKASH_HMAC_SECRET is not set");
    return SETTLE_FAILED;
  }
  if (!verifyEasykashSignature(fields, hmacSecret)) {
    console.error("[tallaby-pay] callback signature failed");
    return { status: 401, body: { error: "Invalid signature" } };
  }
  if (!isValidEasykashRef(fields.easykashRef)) return { status: 400, body: { error: "Invalid callback payload" } };

  const orderId = parseTallabyPayReference(fields.customerReference);
  if (!orderId) return IGNORED;
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) return IGNORED;

  const read = readTallabyPaySettleTarget(order, isDepositOrder(order));
  if ("skip" in read) {
    if (read.skip !== "no_snapshot") return IGNORED;
    // Never credit at a guessed rate; 500 keeps EasyKash retrying while it is fixed.
    console.error("[tallaby-pay] order has no fee snapshot", { orderId });
    return SETTLE_FAILED;
  }
  const { target } = read;

  const apiKey = env("TALLABY_EASYKASH_API_KEY");
  if (!apiKey) {
    console.error("[tallaby-pay] TALLABY_EASYKASH_API_KEY is not set");
    return SETTLE_FAILED;
  }
  // The signed string covers no currency or timestamp, so a replay verifies:
  // only EasyKash's own answer moves money.
  let inquiry: Awaited<ReturnType<typeof inquireEasykashPayment>>;
  try {
    inquiry = await inquireEasykashPayment(apiKey, fields.customerReference, options);
  } catch (error) {
    console.error("[tallaby-pay] inquiry failed", { orderId, status: error instanceof EasykashApiError ? error.status : undefined });
    return { status: 500, body: { error: "Payment inquiry failed" } };
  }
  if (!inquiry || (isEasykashPaidStatus(inquiry.status) && inquiry.amountPiastres === null)) {
    console.error("[tallaby-pay] inquiry unreadable", { orderId });
    return { status: 500, body: { error: "Payment inquiry failed" } };
  }
  if (!isEasykashPaidStatus(inquiry.status)) return { status: 200, body: { received: true, outcome: "not_paid" } };

  // The store's owner, from our own rows (rule 5); the ledger re-checks it.
  const [store] = await db.select({ sellerId: stores.sellerId }).from(stores).where(eq(stores.id, order.storeId!)).limit(1);
  if (!store?.sellerId) {
    console.error("[tallaby-pay] order store not found", { orderId });
    return SETTLE_FAILED;
  }

  const event: GatewayEvent = {
    transactionId: `easykash:${fields.easykashRef}`,
    reference: fields.customerReference,
    status: "SUCCESS",
    amountPiastres: inquiry.amountPiastres!,
    currency: order.currency || "EGP",
  };
  const paymentData = {
    provider: "tallaby_pay",
    collector: "tallaby",
    integrationId: target.integrationId,
    ...(target.purpose === "deposit" && { purpose: "deposit" }),
    event,
  };

  const outcome = await db.transaction(async (tx) => {
    // Exact amount match, the guarded paid claim, the payments row and the
    // plan order fee: the same lines as the seller gateways.
    const claimed = await claimGatewayPayment(tx, {
      order,
      purpose: target.purpose,
      event,
      transactionId: tallabyPayTransactionId(fields.easykashRef),
      paymentData,
    });
    if (claimed === "paid" || claimed === "deposit_paid") {
      await creditTallabyPaySale(tx, {
        orderId: order.id,
        storeId: order.storeId!,
        sellerId: store.sellerId,
        target,
        paidPiastres: event.amountPiastres,
        easykashRef: fields.easykashRef,
        customerReference: fields.customerReference,
        paymentMethod: inquiry.paymentMethod ?? (fields.PaymentMethod || null),
      });
    }
    return claimed;
  });

  if (outcome === "mismatch") {
    // Recorded in payments as pending with the reason; never confirmed (Admin reviews it).
    console.error("[tallaby-pay] payment not applied", { orderId, purpose: target.purpose });
  }
  if (outcome === "duplicate") {
    // A replay of a credited payment is normal. A second, different payment
    // for an order already paid is money in Tallaby's account with no sale:
    // flag it (the paid-twice path is F-100d).
    const [sale] = await db
      .select({ id: tallabyPaySales.id })
      .from(tallabyPaySales)
      .where(eq(tallabyPaySales.easykashRef, fields.easykashRef))
      .limit(1);
    if (!sale) console.error("[tallaby-pay] paid again for an order already paid; not credited", { orderId, purpose: target.purpose });
    return { status: 200, body: { received: true, duplicate: true } };
  }
  if (outcome === "not_found" || outcome === "foreign") return IGNORED;
  if (outcome === "deposit_paid") await notifyDeposit(order.id, "deposit_paid");
  return {
    status: 200,
    body: { received: true, outcome },
    ...(outcome === "paid" && { paidOrderId: order.id }),
  };
}

/**
 * The sale row and its `sale` entry (+net to pending), inside the callback's
 * transaction: any failure rolls the order claim back with it. Gross is the
 * amount EasyKash confirmed (equal to the order total or the deposit, checked
 * by the claim); fee and net come from the order's snapshot.
 */
async function creditTallabyPaySale(
  tx: Tx,
  input: {
    orderId: string;
    storeId: string;
    sellerId: string;
    target: TallabyPaySettleTarget;
    paidPiastres: number;
    easykashRef: string;
    customerReference: string;
    paymentMethod: string | null;
  },
): Promise<void> {
  const { feePiastres, netPiastres } = splitTallabyPay(input.paidPiastres, input.target.snapshot.feeBps);
  const walletId = await ensureTallabyPayWallet(tx, input.storeId, input.sellerId);
  const [sale] = await tx
    .insert(tallabyPaySales)
    .values({
      walletId,
      storeId: input.storeId,
      sellerId: input.sellerId.toLowerCase(),
      orderId: input.orderId,
      purpose: input.target.purpose,
      easykashRef: input.easykashRef,
      customerReference: input.customerReference,
      paymentMethod: input.paymentMethod?.slice(0, 100) ?? null,
      gross: piastresToAmount(input.paidPiastres),
      fee: piastresToAmount(feePiastres),
      net: piastresToAmount(netPiastres),
      feeBps: input.target.snapshot.feeBps,
      holdDays: input.target.snapshot.holdDays,
      status: "pending",
      paidAt: sql`now()`,
    })
    .returning({ id: tallabyPaySales.id });
  await postTallabyPayEntry(tx, {
    storeId: input.storeId,
    sellerId: input.sellerId,
    kind: "sale",
    pendingPiastres: netPiastres,
    saleId: sale!.id,
    referenceType: "sale",
    referenceId: sale!.id,
    description: input.target.purpose === "deposit" ? "Tallaby Pay deposit" : "Tallaby Pay sale",
    metadata: { orderId: input.orderId, purpose: input.target.purpose, feeBps: input.target.snapshot.feeBps },
  });
}
