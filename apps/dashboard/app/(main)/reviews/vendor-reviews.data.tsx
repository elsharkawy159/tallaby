import { getLocale, getTranslations } from "next-intl/server";
import { getSellerReviews } from "@/actions/reviews";
import { getSellerQuestions } from "@/actions/products";
import { PageHeader } from "@/components/seller-ui";
import {
  VendorReviewsTabs,
  VendorQASection,
  type VendorReviewRow,
} from "./reviews.chunks";

type Translate = Awaited<ReturnType<typeof getTranslations>>;

function mapReviewRows(reviews: any[], t: Translate, locale: string): VendorReviewRow[] {
  return reviews.map((r: any) => {
    const user = r.user || {};
    const product = r.product || {};
    const order = r.order || {};
    const translations: any[] = product.productTranslations ?? [];
    const translation = translations.find((x) => x.locale === locale && x.title) ?? translations.find((x) => x.title);

    const customerName =
      user.fullName ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.email ||
      r.reviewerName ||
      t("customer");

    return {
      id: r.id,
      createdAt: r.createdAt,
      rating: Number(r.rating ?? 0),
      title: r.title ?? null,
      content: r.content ?? r.comment ?? null,
      customerName,
      customerEmail: user.email ?? null,
      customerAvatar: user.avatarUrl ?? null,
      productTitle: translation?.title ?? order.orderNumber ?? t("storeReview"),
      productImage: product.images?.[0] ?? null,
      productSlug: translation?.slug ?? null,
      orderNumber: order.orderNumber ?? null,
      reviewType: r.reviewType ?? "product",
      replied: Array.isArray(r.reviewComments) && r.reviewComments.length > 0,
      sellerAdded: r.source === "seller",
    } satisfies VendorReviewRow;
  });
}

export async function VendorReviewsData() {
  const [productRes, storeRes, qres, t, locale] = await Promise.all([
    getSellerReviews({ limit: 100, offset: 0, reviewType: "product" }),
    getSellerReviews({ limit: 100, offset: 0, reviewType: "store" }),
    getSellerQuestions({ limit: 100, offset: 0 }),
    getTranslations("reviews"),
    getLocale(),
  ]);

  const productReviews: any[] = Array.isArray((productRes as any)?.data)
    ? ((productRes as any).data as any[])
    : [];
  const storeReviews: any[] = Array.isArray((storeRes as any)?.data)
    ? ((storeRes as any).data as any[])
    : [];
  const questionsRaw: any[] = Array.isArray((qres as any)?.data)
    ? ((qres as any).data as any[])
    : [];

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <VendorReviewsTabs
        productRows={mapReviewRows(productReviews, t, locale)}
        storeRows={mapReviewRows(storeReviews, t, locale)}
      />
      <VendorQASection
        questions={questionsRaw.map((q: any) => ({
          id: q.id,
          question: q.question,
          isAnswered: Boolean(q.isAnswered),
          createdAt: q.createdAt,
          productId: q.productId,
          productTitle: q.productTitle,
          productImage: Array.isArray(q.productImages)
            ? q.productImages[0]
            : null,
          answers: Array.isArray(q.answers) ? q.answers : [],
        }))}
      />
    </>
  );
}
