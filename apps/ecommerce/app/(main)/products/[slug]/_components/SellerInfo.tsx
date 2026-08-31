import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

interface SellerInfoProps {
  name: string;
  rating: number | null;
  reviewCount: number | null;
}

export function SellerInfo({ name, rating, reviewCount }: SellerInfoProps) {
  const t = useTranslations("product");
  const hasRating = rating != null && rating > 0;

  if (name.trim().toLowerCase() === "tallaby") {
    return null;
  }

  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-gray-600">
      <span>{t("soldBy")}</span>
      <span className="font-medium text-gray-900">{name}</span>
      {hasRating && (
        <span className="inline-flex items-center gap-1 text-gray-500">
          <Star className="h-3.5 w-3.5 text-yellow-400 fill-current shrink-0" />
          <span>{rating.toFixed(1)}</span>
          <span className="text-gray-400">({reviewCount ?? 0})</span>
        </span>
      )}
    </p>
  );
}
