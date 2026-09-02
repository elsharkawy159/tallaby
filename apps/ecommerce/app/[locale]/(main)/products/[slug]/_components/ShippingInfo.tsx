import { Truck, RotateCcw, Shield } from "lucide-react";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { formatPricePlain } from "@workspace/lib";

export const ShippingInfo = ({ locale = "en" }: { locale?: string }) => {
  const freeShippingLabel = formatPricePlain(FREE_SHIPPING_THRESHOLD, locale);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center space-x-3">
        <Truck className="h-5 w-5 text-green-600" />
        <span className="text-sm">
          Free shipping on orders over {freeShippingLabel}
        </span>
      </div>
      <div className="flex items-center space-x-3">
        <RotateCcw className="h-5 w-5 text-blue-600" />
        <span className="text-sm">30-day return policy</span>
      </div>
      <div className="flex items-center space-x-3">
        <Shield className="h-5 w-5 text-purple-600" />
        <span className="text-sm">2-year warranty included</span>
      </div>
    </div>
  );
};
