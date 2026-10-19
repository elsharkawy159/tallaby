"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { WishlistButton } from "@/components/product/wishlist-button";
import { useAuthDialog } from "@/hooks/use-auth-dialog";
import { useAuthUserContext } from "@/providers/auth-provider";

const ROUND = "size-9 rounded-full border border-(--sf-line) bg-(--sf-paper) text-(--sf-ink) shadow-none hover:bg-(--sf-shelf)";

/**
 * The wishlist heart of a builder product card (`wishlistButton` node). A
 * signed-in shopper toggles their wishlist (the same server actions as the
 * marketplace); a guest gets the sign-in dialog instead of an error.
 */
export function StoreWishlistButton({ productId }: { productId: string }) {
  const t = useTranslations("toast");
  const { user, isLoading } = useAuthUserContext();
  const { open } = useAuthDialog();

  if (!user) {
    return (
      <button
        type="button"
        className={`inline-flex items-center justify-center ${ROUND}`}
        disabled={isLoading}
        onClick={() => open("signin")}
        aria-label={t("signInToWishlist")}
      >
        <Heart className="size-4" aria-hidden />
      </button>
    );
  }
  return <WishlistButton productId={productId} size="sm" variant="outline" showText={false} className={ROUND} />;
}
