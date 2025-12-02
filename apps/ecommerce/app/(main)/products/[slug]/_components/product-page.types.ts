import type {
  products,
  brands,
  categories,
  reviews,
  productQuestions,
  productAnswers,
  users,
  sellers,
} from "@workspace/db";

export interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// Type based on actual Drizzle query return with relations from getProductBySlug
export type Product = typeof products.$inferSelect & {
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
  > | null;
  reviews?: Array<
    typeof reviews.$inferSelect & {
      user: Pick<typeof users.$inferSelect, "fullName" | "avatarUrl"> | null;
      reviewComments?: Array<unknown>;
    }
  >;
  productQuestions?: Array<
    typeof productQuestions.$inferSelect & {
      productAnswers?: Array<typeof productAnswers.$inferSelect>;
    }
  >;
  relatedProducts?: Array<typeof products.$inferSelect>;
};

export type Review = typeof reviews.$inferSelect & {
  user: Pick<typeof users.$inferSelect, "fullName" | "avatarUrl"> | null;
};

export type ProductQuestion = typeof productQuestions.$inferSelect & {
  productAnswers?: Array<typeof productAnswers.$inferSelect>;
};
