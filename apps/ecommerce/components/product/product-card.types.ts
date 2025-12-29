export interface ProductCardProps {
  id?: string;
  title?: string;
  name?: string; // legacy/demo shape support
  slug?: string;
  images?: Array<string | { url?: string } | unknown>;
  // legacy shape support
  base_price?: number;
  sale_price?: number | null;
  average_rating?: number | null;
  review_count?: number;
  // new API shape
  averageRating?: number | null;
  reviewCount?: number;
  price?:
    | number
    | {
        base?: number | null;
        list?: number | null;
        final?: number | null;
        discountType?: string | null;
        discountValue?: number | null;
      }
    | null;
  quantity?: number | string;
  maxOrderQuantity?: number | string;
}

export interface AddToCartButtonProps {
  productId: string;
  quantity?: number;
  variantId?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  showIcon?: boolean;
  showText?: boolean;
  stock: number | string;
}

export interface WishlistButtonProps {
  productId: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  showText?: boolean;
  onSuccess?: () => void;
}

export interface QuantitySelectorProps {
  className?: string;
  size?: "sm" | "default" | "lg" | "xl";
  showRemoveButton?: boolean;
  onQuantityChange?: (quantity: number) => void;
  productStock?: number | string;
  maxOrderQuantity?: number | string | null;
  cartItemId?: string;
  initialQuantity?: number;
}
