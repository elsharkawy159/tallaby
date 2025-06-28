import { Truck, RotateCcw, Shield } from "lucide-react";

export const ShippingInfo = () => {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center space-x-3">
        <Truck className="h-5 w-5 text-green-600" />
        <span className="text-sm">Free shipping on orders over $50</span>
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
