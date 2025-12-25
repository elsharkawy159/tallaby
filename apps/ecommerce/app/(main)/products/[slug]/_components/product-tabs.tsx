"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Star,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  HelpCircle,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import type { Product, Review, ProductQuestion } from "./product-page.types";
import Image from "next/image";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { Input } from "@workspace/ui/components";
import { useAuth } from "@/providers/auth-provider";
import { submitProductQuestion } from "@/actions/products";
import { useRouter } from "next/navigation";
import { useAuthDialog } from "@/hooks/use-auth-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@workspace/ui/components/form";
import { toast } from "sonner";

// Zod schema for question form
const questionFormSchema = z.object({
  question: z
    .string()
    .min(10, "Question must be at least 10 characters long")
    .max(500, "Question must be less than 500 characters")
    .trim(),
});

type QuestionFormData = z.infer<typeof questionFormSchema>;

interface ProductTabsProps {
  product: Product;
}

export const ProductTabs = ({ product }: ProductTabsProps) => {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set()
  );
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth();
  const { open: openAuthDialog } = useAuthDialog();
  const router = useRouter();

  // Form setup with react-hook-form
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      question: "",
    },
  });

  // Determine which sections have content
  const hasReviews =
    Array.isArray(product.reviews) && product.reviews.length > 0;
  const hasQuestions =
    Array.isArray(product.productQuestions) &&
    product.productQuestions.length > 0;
  const hasImages = Array.isArray(product.images) && product.images.length > 0;

  // Calculate rating distribution from actual reviews
  const ratingDistribution = useMemo(() => {
    if (!hasReviews) return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    product.reviews!.forEach((review: Review) => {
      const rating = Math.round(review.rating);
      if (rating >= 1 && rating <= 5) {
        distribution[rating as keyof typeof distribution]++;
      }
    });

    const total = product.reviews!.length;
    return {
      5: total > 0 ? Math.round((distribution[5] / total) * 100) : 0,
      4: total > 0 ? Math.round((distribution[4] / total) * 100) : 0,
      3: total > 0 ? Math.round((distribution[3] / total) * 100) : 0,
      2: total > 0 ? Math.round((distribution[2] / total) * 100) : 0,
      1: total > 0 ? Math.round((distribution[1] / total) * 100) : 0,
    };
  }, [hasReviews, product.reviews]);

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  // Format date helper
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "Recently";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    } catch {
      return "Recently";
    }
  };

  // Handle question submission
  const handleSubmitQuestion = (data: QuestionFormData) => {
    if (!user) {
      openAuthDialog("signin");
      return;
    }

    startTransition(async () => {
      try {
        const result = await submitProductQuestion(
          product.id,
          data.question.trim()
        );

        if (result.success) {
          form.reset();
          toast.success(
            "Your question has been submitted and is pending approval"
          );
          // Refresh the page to show the new question (after moderation)
          router.refresh();
        } else {
          toast.error(result.error || "Failed to submit question");
        }
      } catch (error) {
        console.error("Error submitting question:", error);
        toast.error("An unexpected error occurred. Please try again.");
      }
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const renderRatingBar = (rating: number, percentage: number) => (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 min-w-[20px]">
        <span className="text-sm font-medium text-gray-900">{rating}</span>
        <Star className="h-4 w-4 text-yellow-400 fill-current" />
      </div>
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className="bg-yellow-400 h-2 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-gray-600 min-w-[30px]">{percentage}%</span>
    </div>
  );

  return (
    <section className="bg-white py-6 lg:py-8">
      <div className="container space-y-12 lg:space-y-16">
        {/* FAQ Section */}
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="space-y-4 lg:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-lg lg:text-xl font-bold text-gray-900">
                  Frequently Asked Questions
                </h3>
                <Button variant="outline" size="sm" className="w-fit">
                  View More
                </Button>
              </div>

              <div className="space-y-3 lg:space-y-4">
                {hasQuestions ? (
                  product.productQuestions!.map((question: ProductQuestion) => {
                    const bestAnswer = question.productAnswers?.[0];
                    return (
                      <div
                        key={question.id}
                        className="border border-gray-200 rounded-lg"
                      >
                        <button
                          onClick={() => toggleQuestion(question.id)}
                          className="w-full px-4 lg:px-6 py-3 lg:py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-medium text-gray-900 text-sm lg:text-base">
                            {question.question}
                          </span>
                          {expandedQuestions.has(question.id) ? (
                            <ChevronUp className="h-4 w-4 lg:h-5 lg:w-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 lg:h-5 lg:w-5 text-gray-500" />
                          )}
                        </button>
                        {expandedQuestions.has(question.id) && bestAnswer && (
                          <div className="px-4 lg:px-6 pb-3 lg:pb-4">
                            <p className="text-gray-700 text-sm lg:text-base">
                              {bestAnswer.answer}
                            </p>
                            {/* {bestAnswer.isVerified && (
                                    <Badge
                                      variant="secondary"
                                      className="mt-2 text-xs"
                                    >
                                      Verified Answer
                                    </Badge>
                                  )} */}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <HelpCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm lg:text-base">
                      No questions yet. Ask a question below!
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 lg:space-y-6">
              <div className="border border-gray-200 rounded-lg p-4 lg:p-6">
                <h4 className="font-semibold text-gray-900 mb-3 lg:mb-4 text-sm lg:text-base">
                  Have a Question?
                </h4>
                {!user ? (
                  <div className="space-y-3 lg:space-y-4">
                    <p className="text-sm lg:text-base text-gray-600">
                      Please sign in to ask a question about this product.
                    </p>
                    <Button
                      onClick={() => openAuthDialog("signin")}
                      className="w-full"
                    >
                      Sign In to Ask a Question
                    </Button>
                  </div>
                ) : (
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(handleSubmitQuestion)}
                      className="space-y-3 lg:space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="question"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="Type your question here..."
                                disabled={isPending}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isPending}
                      >
                        {isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {isPending ? "Submitting..." : "Send Question"}
                      </Button>
                    </form>
                  </Form>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t border-gray-200 pt-8 lg:pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-4 lg:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-lg lg:text-xl font-bold text-gray-900">
                  Customer Reviews
                </h3>
                {/* <Button variant="outline" size="sm" className="w-fit">
                    Write a Review
                  </Button> */}
              </div>

              {hasReviews ? (
                product.reviews!.map((review: Review) => (
                  <div
                    key={review.id}
                    className="border border-gray-200 rounded-lg p-4 lg:p-6"
                  >
                    <div className="flex items-start gap-3 lg:gap-4 mb-3 lg:mb-4">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {review.user?.avatarUrl ? (
                          <Image
                            src={getPublicUrl(review.user.avatarUrl, "avatars")}
                            alt={review.user.fullName || "User"}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-base lg:text-lg font-semibold text-gray-600">
                            {review.user?.fullName?.charAt(0)?.toUpperCase() ||
                              "U"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                          <span className="font-semibold text-gray-900 text-sm lg:text-base">
                            {review.user?.fullName || "Anonymous"}
                          </span>
                          <span className="text-xs lg:text-sm text-gray-500">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 mb-3 lg:mb-4 text-sm lg:text-base">
                        {review.comment}
                      </p>
                    )}
                    {review.title && (
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm lg:text-base">
                        {review.title}
                      </h4>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {Array.isArray(review.images) &&
                        review.images.length > 0 && (
                          <div className="flex gap-2">
                            {(review.images as string[])
                              .slice(0, 3)
                              .map((image, i) => (
                                <div
                                  key={i}
                                  className="w-6 h-6 lg:w-8 lg:h-8 rounded-lg border border-gray-200 overflow-hidden"
                                >
                                  <Image
                                    src={getPublicUrl(image, "products")}
                                    alt={`Review image ${i + 1}`}
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                          </div>
                        )}
                      <Button variant="ghost" size="sm" className="w-fit">
                        Helpful ({review.helpfulCount || 0})
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm lg:text-base">
                    No reviews yet. Be the first to review this product!
                  </p>
                </div>
              )}

              {/* <div className="text-center">
                  <Button variant="outline">View More Reviews</Button>
                </div> */}
            </div>

            {/* Rating Summary */}
            <div className="space-y-4 lg:space-y-6">
              <div className="border border-gray-200 rounded-lg p-4 lg:p-6">
                <div className="text-center mb-3 lg:mb-4">
                  <div className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    {product.averageRating}
                  </div>
                  <div className="flex justify-center mb-2">
                    {renderStars(Math.round(product.averageRating ?? 0))}
                  </div>
                  <p className="text-xs lg:text-sm text-gray-600">
                    Based on {product.reviewCount} ratings
                  </p>
                </div>

                <div className="space-y-2 lg:space-y-3">
                  {renderRatingBar(5, ratingDistribution[5])}
                  {renderRatingBar(4, ratingDistribution[4])}
                  {renderRatingBar(3, ratingDistribution[3])}
                  {renderRatingBar(2, ratingDistribution[2])}
                  {renderRatingBar(1, ratingDistribution[1])}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 lg:p-6">
                <h4 className="font-semibold text-gray-900 mb-3 lg:mb-4 text-sm lg:text-base">
                  Leave a Review
                </h4>
                <p className="text-xs lg:text-sm text-gray-600 mb-3 lg:mb-4">
                  You can only review products you've purchased. Share your
                  experience with the product, the vendor, and the delivery.
                </p>
                <p className="text-xs text-gray-500">
                  Note: Reviews can be submitted after your order is marked as
                  delivered.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        {/* <div className="border-t border-gray-200 pt-8 lg:pt-12">
          <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-lg lg:text-xl font-bold text-gray-900">
                Product Gallery
              </h3>

            </div>

            {hasImages ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 lg:gap-4">
                {(product.images as string[]).map((image, index) => (
                  <div
                    key={index}
                    className="aspect-square bg-gray-200 rounded-lg border border-gray-200 hover:border-primary transition-colors cursor-pointer overflow-hidden"
                  >
                    <Image
                      src={getPublicUrl(image, "products")}
                      alt={`${product.title} - Image ${index + 1}`}
                      width={150}
                      height={150}
                      className="w-full h-full object-contain bg-white"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm lg:text-base">
                  No additional images available.
                </p>
              </div>
            )}
          </div>
        </div> */}
      </div>
    </section>
  );
};
