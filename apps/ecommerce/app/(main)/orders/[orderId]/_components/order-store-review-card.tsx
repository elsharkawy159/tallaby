"use client";

import { useState, useTransition } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Textarea, Input, Checkbox } from "@workspace/ui/components";
import { createStoreReview, updateReview } from "@/actions/reviews";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { StoreSellerReview } from "./order-confirmation.types";

interface OrderStoreReviewCardProps {
  orderId: string;
  seller: StoreSellerReview;
}

export function OrderStoreReviewCard({
  orderId,
  seller,
}: OrderStoreReviewCardProps) {
  const t = useTranslations("orders");
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(seller.storeReview?.rating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState(seller.storeReview?.title ?? "");
  const [comment, setComment] = useState(seller.storeReview?.comment ?? "");
  const [isAnonymous, setIsAnonymous] = useState(
    seller.storeReview?.isAnonymous ?? false
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isEdit = seller.hasStoreReview && !!seller.storeReview;

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error(t("selectRating"));
      return;
    }

    startTransition(async () => {
      try {
        if (isEdit && seller.storeReview) {
          const result = await updateReview({
            reviewId: seller.storeReview.id,
            rating,
            title: title.trim() || undefined,
            comment: comment.trim() || undefined,
            isAnonymous,
          });
          if (result.success) {
            toast.success(t("reviewUpdated"));
            setShowForm(false);
            router.refresh();
          } else {
            toast.error(result.error || t("reviewSubmitFailed"));
          }
        } else {
          const result = await createStoreReview({
            orderId,
            sellerId: seller.sellerId,
            rating,
            title: title.trim() || undefined,
            comment: comment.trim() || undefined,
            isAnonymous,
          });
          if (result.success) {
            toast.success(t("storeReviewSubmitted"));
            router.refresh();
          } else {
            toast.error(result.error || t("reviewSubmitFailed"));
          }
        }
      } catch {
        toast.error(t("unexpectedError"));
      }
    });
  };

  return (
    <div
      id={`store-review-${seller.sellerId}`}
      className="scroll-mt-24 border rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-medium text-sm">{seller.displayName}</p>
          <p className="text-xs text-muted-foreground">{t("rateThisStore")}</p>
        </div>
        {isEdit && !showForm && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
          >
            {t("editReview")}
          </Button>
        )}
      </div>

      {isEdit && !showForm ? (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 flex items-center gap-2">
            <Star className="h-4 w-4 fill-current" />
            {t("youHaveReviewedThisStore")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none"
                disabled={isPending}
              >
                <Star
                  className={`h-5 w-5 ${
                    star <= (hoverRating || rating)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
          <Input
            placeholder={t("reviewTitleOptional")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isPending}
            maxLength={100}
            className="text-sm"
          />
          <Textarea
            placeholder={t("storeReviewPlaceholder")}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isPending}
            className="min-h-20 text-sm"
            maxLength={1000}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id={`store-anonymous-${seller.sellerId}`}
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked === true)}
              disabled={isPending}
            />
            <label
              htmlFor={`store-anonymous-${seller.sellerId}`}
              className="text-xs text-gray-600 cursor-pointer"
            >
              {t("postAsAnonymous")}
            </label>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isPending || rating === 0}
            size="sm"
            className="w-full"
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isPending
              ? t("submitting")
              : isEdit
                ? t("updateReview")
                : t("submitStoreReview")}
          </Button>
        </div>
      )}
    </div>
  );
}
