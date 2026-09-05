import type {
  products,
  brands,
  categories,
  reviews,
  reviewVotes,
  reviewComments,
  productQuestions,
  productAnswers,
  users,
  sellers,
  productVariants,
} from "@workspace/db";
import type { MergedProduct } from "@/lib/product-translations";

export interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// Type based on actual Drizzle query return with relations from getProductBySlug
export type Product = MergedProduct<typeof products.$inferSelect> & {
  title: string;
  description: string | null;
  content: string | null;
  bulletPoints: unknown;
  slug: string;
  brand: typeof brands.$inferSelect | null;
  category: typeof categories.$inferSelect | null;
  seller: Pick<
    typeof sellers.$inferSelect,
    | "id"
    | "displayName"
    | "slug"
    | "storeRating"
    | "positiveRatingPercent"
    | "totalRatings"
    | "freeDelivery"
  > | null;
  productVariants?: Array<typeof productVariants.$inferSelect>;
  reviews?: Array<
    typeof reviews.$inferSelect & {
      user: Pick<typeof users.$inferSelect, "fullName" | "avatarUrl"> | null;
      reviewVotes?: Array<typeof reviewVotes.$inferSelect>;
      reviewComments?: Array<
        typeof reviewComments.$inferSelect & {
          user: Pick<typeof users.$inferSelect, "fullName" | "avatarUrl"> | null;
        }
      >;
    }
  >;
  productQuestions?: Array<
    typeof productQuestions.$inferSelect & {
      productAnswers?: Array<typeof productAnswers.$inferSelect>;
    }
  >;
  relatedProducts?: Array<
    MergedProduct<typeof products.$inferSelect> & {
      brand: typeof brands.$inferSelect | null;
      productVariants?: Array<{
        id: string;
        localized?: unknown;
        option1?: string | null;
        option2?: string | null;
        option3?: string | null;
        images?: unknown;
        imageUrl?: string | null;
        position?: number | null;
      }>;
    }
  >;
};

export type Review = typeof reviews.$inferSelect & {
  user: Pick<typeof users.$inferSelect, "fullName" | "avatarUrl"> | null;
  reviewVotes?: Array<typeof reviewVotes.$inferSelect>;
  reviewComments?: Array<
    typeof reviewComments.$inferSelect & {
      user: Pick<typeof users.$inferSelect, "fullName" | "avatarUrl"> | null;
    }
  >;
};

export type ProductQuestion = typeof productQuestions.$inferSelect & {
  productAnswers?: Array<typeof productAnswers.$inferSelect>;
};
