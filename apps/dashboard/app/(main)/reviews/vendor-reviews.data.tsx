import { getSellerReviews } from "@/actions/reviews";
import { getSellerQuestions } from "@/actions/products";
import {
  VendorReviewsTabs,
  VendorQASection,
  type VendorReviewRow,
} from "./reviews.chunks";

function mapReviewRows(reviews: any[]): VendorReviewRow[] {
  return reviews.map((r: any) => {
    const user = r.user || {};
    const product = r.product || {};
    const order = r.order || {};

    const customerName =
      user.fullName ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.email ||
      "Customer";

    return {
      id: r.id,
      createdAt: r.createdAt,
      rating: Number(r.rating ?? 0),
      title: r.title ?? null,
      content: r.content ?? r.comment ?? null,
      customerName,
      customerEmail: user.email ?? null,
      customerAvatar: user.avatar ?? null,
      productTitle: product.title ?? order.orderNumber ?? "Store review",
      productImage: product.images?.[0] ?? null,
      productSlug: product.slug ?? null,
      orderNumber: order.orderNumber ?? null,
      reviewType: r.reviewType ?? "product",
      replied: Array.isArray(r.reviewComments) && r.reviewComments.length > 0,
    } satisfies VendorReviewRow;
  });
}

export async function VendorReviewsData() {
  const [productRes, storeRes, qres] = await Promise.all([
    getSellerReviews({ limit: 100, offset: 0, reviewType: "product" }),
    getSellerReviews({ limit: 100, offset: 0, reviewType: "store" }),
    getSellerQuestions({ limit: 100, offset: 0 }),
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
    <div className="space-y-6">
      <VendorReviewsTabs
        productRows={mapReviewRows(productReviews)}
        storeRows={mapReviewRows(storeReviews)}
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
    </div>
  );
}
