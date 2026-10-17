"use server";

import { db, adCampaignRequests, products, sellerWallet } from "@workspace/db";
import {
  StoreWalletLimitError,
  StoreWalletNotActiveError,
  postStoreWalletEntry,
} from "@workspace/db/wallet";
import { uniqueViolationConstraint } from "@workspace/lib/fulfillment/server";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { getUser } from "./auth";
import {
  EGYPT_MOBILE_REGEX,
  getAdPackage,
  type AdRequestStatus,
} from "@/lib/ad-packages";

export type AdRequestRow = {
  id: string;
  packageKey: string;
  amount: number;
  status: AdRequestStatus;
  payerPhone: string;
  createdAt: string;
  startsAt: string | null;
  endsAt: string | null;
  product: { id: string; title: string; image: string | null };
};

/** Error codes the client maps to `advertise.errors.*` messages. */
export type CreateAdRequestError =
  | "unauthorized"
  | "invalid_input"
  | "invalid_package"
  | "product_not_found"
  | "product_not_active"
  | "already_requested"
  | "insufficient_balance"
  | "wallet_not_active"
  | "unknown";

export type AdPaymentMethod = "vodafone_cash" | "wallet";

/** Store wallet figures the payment step needs (PLAN.md P6-11). */
export type AdWallet = { balance: number; negativeLimit: number; active: boolean };

const createAdRequestSchema = z.discriminatedUnion("paymentMethod", [
  z.object({
    paymentMethod: z.literal("vodafone_cash"),
    packageKey: z.string().min(1),
    productId: z.string().uuid(),
    payerPhone: z.string().trim().regex(EGYPT_MOBILE_REGEX),
    transferReference: z.string().trim().max(100).optional(),
  }),
  z.object({
    paymentMethod: z.literal("wallet"),
    packageKey: z.string().min(1),
    productId: z.string().uuid(),
  }),
]);

export async function getAdWallet(): Promise<AdWallet | null> {
  const session = await getUser();
  if (!session?.user?.id) return null;
  const [row] = await db
    .select({ balance: sellerWallet.balance, negativeLimit: sellerWallet.negativeLimit, status: sellerWallet.status })
    .from(sellerWallet)
    .where(eq(sellerWallet.sellerId, session.user.id));
  return {
    balance: Number(row?.balance ?? 0),
    negativeLimit: Number(row?.negativeLimit ?? 0),
    active: (row?.status ?? "active") === "active",
  };
}

export async function getSellerAdRequests(): Promise<AdRequestRow[]> {
  const session = await getUser();
  if (!session?.user?.id) return [];

  const locale = await getLocale();
  const rows = await db
    .select({
      request: adCampaignRequests,
      images: products.images,
    })
    .from(adCampaignRequests)
    .innerJoin(products, eq(products.id, adCampaignRequests.productId))
    .where(eq(adCampaignRequests.sellerId, session.user.id))
    .orderBy(desc(adCampaignRequests.createdAt));

  if (rows.length === 0) return [];

  const translations = await db.query.productTranslations.findMany({
    where: (t, { inArray }) =>
      inArray(
        t.productId,
        rows.map((r) => r.request.productId)
      ),
    columns: { productId: true, locale: true, title: true },
  });

  const titleFor = (productId: string) => {
    const own = translations.filter((t) => t.productId === productId);
    return (
      own.find((t) => t.locale === locale)?.title ??
      own.find((t) => t.locale === "ar")?.title ??
      own[0]?.title ??
      ""
    );
  };

  return rows.map(({ request, images }) => ({
    id: request.id,
    packageKey: request.packageKey,
    amount: Number(request.amount),
    status: request.status,
    payerPhone: request.payerPhone,
    createdAt: request.createdAt,
    startsAt: request.startsAt,
    endsAt: request.endsAt,
    product: {
      id: request.productId,
      title: titleFor(request.productId),
      image: Array.isArray(images) ? ((images as string[])[0] ?? null) : null,
    },
  }));
}

export async function createAdRequest(input: {
  paymentMethod?: AdPaymentMethod;
  packageKey: string;
  productId: string;
  payerPhone?: string;
  transferReference?: string;
}): Promise<
  { success: true; data: { id: string } } | { success: false; error: CreateAdRequestError }
> {
  try {
    const session = await getUser();
    if (!session?.user?.id) return { success: false, error: "unauthorized" };

    const parsed = createAdRequestSchema.safeParse({ paymentMethod: "vodafone_cash", ...input });
    if (!parsed.success) return { success: false, error: "invalid_input" };
    const { packageKey, productId } = parsed.data;

    const pkg = getAdPackage(packageKey);
    if (!pkg) return { success: false, error: "invalid_package" };

    const product = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.sellerId, session.user.id)),
      columns: { id: true, status: true },
    });
    if (!product) return { success: false, error: "product_not_found" };
    if (product.status !== "active") return { success: false, error: "product_not_active" };

    const sellerId = session.user.id;
    const amount = pkg.price.toFixed(2);

    // Paid from the store wallet: the request and its service_charge commit
    // together; the charge may not overdraw past the wallet's limit (D21).
    const created = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(adCampaignRequests)
        .values({
          sellerId,
          productId,
          packageKey: pkg.key,
          amount,
          paymentMethod: parsed.data.paymentMethod,
          payerPhone: parsed.data.paymentMethod === "vodafone_cash" ? parsed.data.payerPhone : "",
          transferReference:
            parsed.data.paymentMethod === "vodafone_cash" ? parsed.data.transferReference || null : null,
        })
        .returning({ id: adCampaignRequests.id });

      if (parsed.data.paymentMethod === "wallet") {
        await postStoreWalletEntry(tx, {
          sellerId,
          type: "service_charge",
          amount: `-${amount}`,
          referenceType: "ad_request",
          referenceId: row!.id,
          description: `Product ad: ${pkg.key}`,
          metadata: { packageKey: pkg.key, productId },
          createdBy: sellerId,
          enforceNegativeLimit: true,
        });
      }
      return row!;
    });

    revalidatePath("/marketing");
    revalidatePath("/financial");
    return { success: true, data: { id: created.id } };
  } catch (error) {
    if (error instanceof StoreWalletLimitError) return { success: false, error: "insufficient_balance" };
    if (error instanceof StoreWalletNotActiveError) return { success: false, error: "wallet_not_active" };
    // The only unique index besides the pk: one open request per product.
    if (uniqueViolationConstraint(error) !== null) {
      return { success: false, error: "already_requested" };
    }
    console.error("Error creating ad request:", error);
    return { success: false, error: "unknown" };
  }
}
