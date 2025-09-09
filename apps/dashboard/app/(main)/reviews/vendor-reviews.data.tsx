import { getSellerReviews } from "@/actions/reviews";
import { getSellerQuestions } from "@/actions/products";
import {
  VendorReviewsTable,
  VendorQASection,
  type VendorReviewRow,
} from "./reviews.chunks";

export async function VendorReviewsData() {
  const res = await getSellerReviews({ limit: 100, offset: 0 });
  const qres = await getSellerQuestions({ limit: 100, offset: 0 });

  const reviews: any[] = Array.isArray((res as any)?.data)
    ? ((res as any).data as any[])
    : [];
  const questionsRaw: any[] = Array.isArray((qres as any)?.data)
    ? ((qres as any).data as any[])
    : [];

  const rows: VendorReviewRow[] = reviews.map((r: any) => {
    const user = r.user || {};
    const product = r.product || {};

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
      productTitle: product.title ?? "",
      productImage: product.images?.[0] ?? null,
      productSlug: product.slug ?? null,
      replied: Array.isArray(r.reviewComments) && r.reviewComments.length > 0,
    } satisfies VendorReviewRow;
  });

  return (
    <div className="space-y-6">
      <VendorReviewsTable rows={rows} />
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
