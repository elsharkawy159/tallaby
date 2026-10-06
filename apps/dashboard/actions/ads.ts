"use server";

import { db, adCampaignRequests, products } from "@workspace/db";
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
  | "unknown";

const createAdRequestSchema = z.object({
  packageKey: z.string().min(1),
  productId: z.string().uuid(),
  payerPhone: z.string().trim().regex(EGYPT_MOBILE_REGEX),
  transferReference: z.string().trim().max(100).optional(),
});

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
  packageKey: string;
  productId: string;
  payerPhone: string;
  transferReference?: string;
}): Promise<
  { success: true; data: { id: string } } | { success: false; error: CreateAdRequestError }
> {
  try {
    const session = await getUser();
    if (!session?.user?.id) return { success: false, error: "unauthorized" };

    const parsed = createAdRequestSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "invalid_input" };
    const { packageKey, productId, payerPhone, transferReference } = parsed.data;

    const pkg = getAdPackage(packageKey);
    if (!pkg) return { success: false, error: "invalid_package" };

    const product = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.sellerId, session.user.id)),
      columns: { id: true, status: true },
    });
    if (!product) return { success: false, error: "product_not_found" };
    if (product.status !== "active") return { success: false, error: "product_not_active" };

    const [created] = await db
      .insert(adCampaignRequests)
      .values({
        sellerId: session.user.id,
        productId,
        packageKey: pkg.key,
        amount: String(pkg.price),
        payerPhone,
        transferReference: transferReference || null,
      })
      .returning({ id: adCampaignRequests.id });

    revalidatePath("/marketing");
    return { success: true, data: { id: created.id } };
  } catch (error) {
    // The only unique index besides the pk: one open request per product.
    if (uniqueViolationConstraint(error) !== null) {
      return { success: false, error: "already_requested" };
    }
    console.error("Error creating ad request:", error);
    return { success: false, error: "unknown" };
  }
}
