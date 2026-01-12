"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Star,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  HelpCircle,
  Image as ImageIcon,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  X,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import type { Product, Review, ProductQuestion } from "./product-page.types";
import Image from "next/image";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { Input, Textarea, Checkbox } from "@workspace/ui/components";
import type { User } from "@supabase/supabase-js";
import { submitProductQuestion } from "@/actions/products";
import { voteReview, createReviewComment } from "@/actions/reviews";
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
  FormLabel,
} from "@workspace/ui/components/form";
import { Dialog, DialogContent } from "@workspace/ui/components/dialog";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

// Zod schema for question form
const questionFormSchema = z.object({
  question: z
    .string()
    .min(10, "Question must be at least 10 characters long")
    .max(500, "Question must be less than 500 characters")
    .trim(),
});

type QuestionFormData = z.infer<typeof questionFormSchema>;

// Zod schema for review comment form
const reviewCommentSchema = z.object({
  comment: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment must be less than 1000 characters")
    .trim(),
  isAnonymous: z.boolean().default(false),
});

type ReviewCommentFormData = z.infer<typeof reviewCommentSchema>;

interface ProductTabsProps {
  product: Product;
  user: User | null;
}

export const ProductTabs = ({ product, user }: ProductTabsProps) => {
  const t = useTranslations("product");
  const tCommon = useTranslations("common");
  const tToast = useTranslations("toast");
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set()
  );
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set()
  );
  const [commentForms, setCommentForms] = useState<Set<string>>(new Set());
  const [votingReviews, setVotingReviews] = useState<Set<string>>(new Set());
  const [commentingReviews, setCommentingReviews] = useState<Set<string>>(
    new Set()
  );
  const [isPending, startTransition] = useTransition();
  const { open: openAuthDialog } = useAuthDialog();
  const router = useRouter();
  const [mediaPreview, setMediaPreview] = useState<{
    isOpen: boolean;
    mediaItems: string[];
    currentIndex: number;
  }>({
    isOpen: false,
    mediaItems: [],
    currentIndex: 0,
  });

  // Form setup with react-hook-form
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      question: "",
    },
  });

  // Store comment form data in state
  const [commentFormsData, setCommentFormsData] = useState<
    Record<string, { comment: string; isAnonymous: boolean }>
  >({});

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
          toast.success(tToast("questionSubmitted"));
          // Refresh the page to show the new question (after moderation)
          router.refresh();
        } else {
          toast.error(result.error || tToast("failedToSubmitQuestion"));
        }
      } catch (error) {
        console.error("Error submitting question:", error);
        toast.error(tToast("unexpectedError"));
      }
    });
  };

  const handleVoteReview = (reviewId: string, isHelpful: boolean) => {
    if (!user) {
      openAuthDialog("signin");
      return;
    }

    setVotingReviews((prev) => new Set(prev).add(reviewId));
    startTransition(async () => {
      try {
        const result = await voteReview({ reviewId, isHelpful });
        if (result.success) {
          router.refresh();
        } else {
          toast.error(result.error || tToast("failedToVote"));
        }
      } catch (error) {
        console.error("Error voting on review:", error);
        toast.error(tToast("unexpectedError"));
      } finally {
        setVotingReviews((prev) => {
          const next = new Set(prev);
          next.delete(reviewId);
          return next;
        });
      }
    });
  };

  const handleToggleCommentForm = (reviewId: string) => {
    if (!user) {
      openAuthDialog("signin");
      return;
    }

    setCommentForms((prev) => {
      const next = new Set(prev);
      if (next.has(reviewId)) {
        next.delete(reviewId);
      } else {
        next.add(reviewId);
      }
      return next;
    });
  };

  const handleSubmitComment = (reviewId: string) => {
    const formData = commentFormsData[reviewId];
    if (!formData || !formData.comment.trim()) {
      toast.error(t("pleaseEnterComment"));
      return;
    }

    setCommentingReviews((prev) => new Set(prev).add(reviewId));
    startTransition(async () => {
      try {
        const result = await createReviewComment({
          reviewId,
          comment: formData.comment.trim(),
          isAnonymous: formData.isAnonymous,
        });

        if (result.success) {
          setCommentFormsData((prev) => {
            const next = { ...prev };
            delete next[reviewId];
            return next;
          });
          setCommentForms((prev) => {
            const next = new Set(prev);
            next.delete(reviewId);
            return next;
          });
          toast.success(t("commentAddedSuccessfully"));
          router.refresh();
        } else {
          toast.error(result.error || t("failedToAddComment"));
        }
      } catch (error) {
        console.error("Error submitting comment:", error);
        toast.error(t("failedToAddComment"));
      } finally {
        setCommentingReviews((prev) => {
          const next = new Set(prev);
          next.delete(reviewId);
          return next;
        });
      }
    });
  };

  const updateCommentFormData = (
    reviewId: string,
    data: Partial<{ comment: string; isAnonymous: boolean }>
  ) => {
    setCommentFormsData((prev) => ({
      ...prev,
      [reviewId]: {
        comment: prev[reviewId]?.comment || "",
        isAnonymous: prev[reviewId]?.isAnonymous || false,
        ...data,
      },
    }));
  };

  const toggleComments = (reviewId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(reviewId)) {
        next.delete(reviewId);
      } else {
        next.add(reviewId);
      }
      return next;
    });
  };

  const getUserVote = (review: Review) => {
    if (!user || !review.reviewVotes) return null;
    return review.reviewVotes.find((vote) => vote.userId === user.id);
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

  // Helper function to check if file is a video
  const isVideoFile = (filePath: string): boolean => {
    const extension = filePath.split(".").pop()?.toLowerCase();
    return (
      extension === "mp4" ||
      extension === "webm" ||
      extension === "ogg" ||
      extension === "mov"
    );
  };

  // Helper function to check if file is an image
  const isImageFile = (filePath: string): boolean => {
    const extension = filePath.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(
      extension || ""
    );
  };

  return (
    <>
      <section className="bg-white py-6 lg:py-8">
        <div className="container space-y-12 lg:space-y-16">
          {/* FAQ Section */}
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <div className="space-y-4 lg:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-lg lg:text-xl font-bold text-gray-900">
                    {t("frequentlyAskedQuestions")}
                  </h3>
                  <Button variant="outline" size="sm" className="w-fit">
                    {t("viewMore")}
                  </Button>
                </div>

                <div className="space-y-3 lg:space-y-4">
                  {hasQuestions ? (
                    product.productQuestions!.map(
                      (question: ProductQuestion) => {
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
                            {expandedQuestions.has(question.id) &&
                              bestAnswer && (
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
                      }
                    )
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <HelpCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm lg:text-base">
                        {t("noQuestions")} {t("beFirstToAsk")}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 lg:space-y-6">
                <div className="border border-gray-200 rounded-lg p-4 lg:p-6">
                  <h4 className="font-semibold text-gray-900 mb-3 lg:mb-4 text-sm lg:text-base">
                    {t("haveAQuestion")}
                  </h4>
                  {!user ? (
                    <div className="space-y-3 lg:space-y-4">
                      <p className="text-sm lg:text-base text-gray-600">
                        {t("pleaseSignInToAsk")}
                      </p>
                      <Button
                        onClick={() => openAuthDialog("signin")}
                        className="w-full"
                      >
                        {t("signInToAskQuestion")}
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
                                  placeholder={t("typeYourQuestion")}
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
                          {isPending ? t("submitting") : t("sendQuestion")}
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
                    {t("customerReviews")}
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
                              src={getPublicUrl(
                                review.user.avatarUrl,
                                "avatars"
                              )}
                              alt={review.user.fullName || "User"}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-base lg:text-lg font-semibold text-gray-600">
                              {review.user?.fullName
                                ?.charAt(0)
                                ?.toUpperCase() || "U"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                            <span className="font-semibold text-gray-900 text-sm lg:text-base">
                              {review.user?.fullName || t("anonymous")}
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
                      <div className="flex flex-col gap-3">
                        {Array.isArray(review.images) &&
                          review.images.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                              {(review.images as string[])
                                .slice(0, 5)
                                .map((filePath, i) => {
                                  const fileUrl = getPublicUrl(
                                    filePath,
                                    "products"
                                  );
                                  const isVideo = isVideoFile(filePath);
                                  const isImage = isImageFile(filePath);

                                  return (
                                    <div
                                      key={i}
                                      className="relative w-16 h-16 lg:w-36 lg:h-36 rounded-lg border border-gray-200 overflow-hidden bg-gray-100 group cursor-pointer"
                                      onClick={() => {
                                        setMediaPreview({
                                          isOpen: true,
                                          mediaItems: review.images as string[],
                                          currentIndex: i,
                                        });
                                      }}
                                    >
                                      {isVideo ? (
                                        <div className="relative w-full h-full">
                                          <video
                                            src={fileUrl}
                                            className="w-full h-full object-cover"
                                            controls={false}
                                            preload="metadata"
                                          >
                                            {t("videoNotSupported")}
                                          </video>
                                        </div>
                                      ) : isImage ? (
                                        <Image
                                          src={fileUrl}
                                          alt={`Review ${isImage ? "image" : "media"} ${i + 1}`}
                                          width={150}
                                          height={150}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                          <ImageIcon className="h-6 w-6 text-gray-400" />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          )}

                        {/* Voting Section */}
                        {user && (
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5"
                                onClick={() =>
                                  handleVoteReview(review.id, true)
                                }
                                disabled={votingReviews.has(review.id)}
                              >
                                <ThumbsUp
                                  className={`h-4 w-4 ${
                                    getUserVote(review)?.isHelpful === true
                                      ? "fill-current text-blue-600"
                                      : ""
                                  }`}
                                />
                                <span>{review.helpfulCount || 0}</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5"
                                onClick={() =>
                                  handleVoteReview(review.id, false)
                                }
                                disabled={votingReviews.has(review.id)}
                              >
                                <ThumbsDown
                                  className={`h-4 w-4 ${
                                    getUserVote(review)?.isHelpful === false
                                      ? "fill-current text-red-600"
                                      : ""
                                  }`}
                                />
                                <span>{review.unhelpfulCount || 0}</span>
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleCommentForm(review.id)}
                            >
                              <MessageCircle className="h-4 w-4 mr-1.5" />
                              {t("comment")}
                            </Button>
                          </div>
                        )}

                        {/* Comments Section */}
                        {review.reviewComments &&
                          review.reviewComments.length > 0 && (
                            <div className="border-t pt-3 mt-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleComments(review.id)}
                                className="mb-2"
                              >
                                {expandedComments.has(review.id) ? (
                                  <ChevronUp className="h-4 w-4 mr-1.5" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 mr-1.5" />
                                )}
                                {review.reviewComments.length}{" "}
                                {review.reviewComments.length === 1
                                  ? t("comment")
                                  : t("comments")}
                              </Button>
                              {expandedComments.has(review.id) && (
                                <div className="space-y-3 mt-2">
                                  {review.reviewComments.map((comment) => (
                                    <div
                                      key={comment.id}
                                      className="bg-gray-50 rounded-lg p-3"
                                    >
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm text-gray-900">
                                          {comment.isAnonymous
                                            ? t("anonymous")
                                            : comment.user?.fullName ||
                                              t("user")}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {formatDate(comment.createdAt)}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-700">
                                        {comment.comment}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                        {/* Comment Form */}
                        {commentForms.has(review.id) && user && (
                          <div className="border-t pt-4 mt-4 space-y-3">
                            <div className="space-y-2">
                              <Textarea
                                placeholder={t("writeComment")}
                                value={
                                  commentFormsData[review.id]?.comment || ""
                                }
                                onChange={(e) =>
                                  updateCommentFormData(review.id, {
                                    comment: e.target.value,
                                  })
                                }
                                className="min-h-20"
                              />
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`anonymous-${review.id}`}
                                  checked={
                                    commentFormsData[review.id]?.isAnonymous ||
                                    false
                                  }
                                  onCheckedChange={(checked) =>
                                    updateCommentFormData(review.id, {
                                      isAnonymous: checked === true,
                                    })
                                  }
                                />
                                <label
                                  htmlFor={`anonymous-${review.id}`}
                                  className="text-sm text-gray-600 cursor-pointer"
                                >
                                  {t("postAsAnonymous")}
                                </label>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSubmitComment(review.id)}
                                disabled={commentingReviews.has(review.id)}
                              >
                                {commentingReviews.has(review.id) && (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                {tCommon("submit")}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleToggleCommentForm(review.id)
                                }
                              >
                                {tCommon("cancel")}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm lg:text-base">
                      {t("noReviews")} {t("beTheFirst")}
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
                      {t("basedOnRatings", { count: product.reviewCount ?? 0 })}
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
                    {t("leaveReview")}
                  </h4>
                  <p className="text-xs lg:text-sm text-gray-600 mb-3 lg:mb-4">
                    {t("leaveReviewDescription")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("leaveReviewNote")}
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
                {t("productGallery")}
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

      {/* Media Preview Dialog */}
      <Dialog
        open={mediaPreview.isOpen}
        onOpenChange={(open) =>
          setMediaPreview((prev) => ({ ...prev, isOpen: open }))
        }
        modal={false}
      >
        <DialogContent
          className="max-w-[60vw] max-h-[60vh] w-full h-full p-0 gap-0 bg-black/70 border-black backdrop-blur-sm"
          showCloseButton={true}
        >
          {mediaPreview.mediaItems.length > 0 && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close Button */}
              <button
                onClick={() =>
                  setMediaPreview((prev) => ({ ...prev, isOpen: false }))
                }
                className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Previous Button */}
              {mediaPreview.mediaItems.length > 1 && (
                <button
                  onClick={() =>
                    setMediaPreview((prev) => ({
                      ...prev,
                      currentIndex:
                        prev.currentIndex > 0
                          ? prev.currentIndex - 1
                          : prev.mediaItems.length - 1,
                    }))
                  }
                  className="absolute left-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}

              {/* Next Button */}
              {mediaPreview.mediaItems.length > 1 && (
                <button
                  onClick={() =>
                    setMediaPreview((prev) => ({
                      ...prev,
                      currentIndex:
                        prev.currentIndex < prev.mediaItems.length - 1
                          ? prev.currentIndex + 1
                          : 0,
                    }))
                  }
                  className="absolute right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                  aria-label="Next"
                >
                  <ChevronRight className="h-6 w-6 rtl:rotate-180" />
                </button>
              )}

              {/* Media Counter */}
              {mediaPreview.mediaItems.length > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {mediaPreview.currentIndex + 1} /{" "}
                  {mediaPreview.mediaItems.length}
                </div>
              )}

              {/* Media Display */}
              <div className="w-full h-full flex items-center justify-center p-4">
                {(() => {
                  const currentMedia =
                    mediaPreview.mediaItems[mediaPreview.currentIndex];
                  if (!currentMedia) return null;
                  const currentUrl = getPublicUrl(currentMedia, "products");
                  const isVideo = isVideoFile(currentMedia);
                  const isImage = isImageFile(currentMedia);

                  return (
                    <div className="max-w-full max-h-full flex items-center justify-center">
                      {isVideo ? (
                        <video
                          src={currentUrl}
                          className="max-w-full max-h-[50vh] object-contain"
                          controls
                          autoPlay
                        >
                          {t("videoNotSupported")}
                        </video>
                      ) : isImage ? (
                        <Image
                          src={currentUrl}
                          alt={`Review media ${mediaPreview.currentIndex + 1}`}
                          width={1200}
                          height={1200}
                          className="max-w-full max-h-[50vh] object-contain"
                          unoptimized
                        />
                      ) : (
                        <div className="text-white text-center">
                          Unsupported file type
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
