"use client";

import { AddToCartButton as ReusableAddToCartButton } from "@/components/product";
import { trackAddToCart } from "@/actions/analytics";
import { redirect } from "next/navigation";

interface AddToCartButtonProps {
  productId: string;
  quantity: number;
  variantId?: string;
  disabled?: boolean;
  className?: string;
}

export function AddToCartButton({
  productId,
  quantity,
  variantId,
  disabled,
  className,
}: AddToCartButtonProps) {
  const handleSuccess = async () => {
    // Track analytics
    await trackAddToCart({ productId, quantity, variantId, price: 0 });

    // Redirect to cart after a short delay
    setTimeout(() => {
      redirect("/cart");
    }, 400);
  };

  return (
    <ReusableAddToCartButton
      productId={productId}
      quantity={quantity}
      variantId={variantId}
      disabled={disabled}
      className={className}
      onSuccess={handleSuccess}
    />
  );
}
