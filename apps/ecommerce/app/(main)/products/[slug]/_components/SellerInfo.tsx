import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

interface SellerInfoProps {
  name: string;
  rating: number | null;
  reviewCount: number | null;
}

export function SellerInfo({ name, rating, reviewCount }: SellerInfoProps) {
  const t = useTranslations("product");

  return (
    <div className="rounded-lg border bg-gray-50 p-4">
      <h3 className="text-sm font-medium text-gray-600 mb-2">
        {t("soldBy")}
      </h3>
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
          <span className="font-bold text-primary text-sm">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-medium text-gray-900">{name}</p>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">
              {rating != null && rating > 0
                ? `${rating.toFixed(1)} (${reviewCount ?? 0} ${t("storeRatings")})`
                : t("noStoreRatingsYet")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
