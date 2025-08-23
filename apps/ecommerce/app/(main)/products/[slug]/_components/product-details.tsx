import { Star, Truck, RotateCcw, Calendar, CheckCircle } from "lucide-react";
import { Separator } from "@workspace/ui/components/separator";
import { ProductActions } from "./ProductActions";
import type { Product } from "../product-page.types";

interface ProductDetailsProps {
  product: Product;
}

export const ProductDetails = ({ product }: ProductDetailsProps) => {
  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        {/* Sidebar - Shipping, Seller, Actions */}
        <div className="space-y-6">
          {/* Shipping Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Shipping</h3>

            {/* Seller Info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-gray-600">
                  {product.seller.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {product.seller.name}
                </p>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600">
                    {product.seller.rating} ({product.seller.reviews} reviews)
                  </span>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Shipping Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Truck className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Free shipping
                  </p>
                  <p className="text-xs text-gray-600">On orders over $50</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Fast delivery
                  </p>
                  <p className="text-xs text-gray-600">2-3 business days</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <RotateCcw className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    30-day returns
                  </p>
                  <p className="text-xs text-gray-600">Easy return policy</p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <ProductActions product={product} />
          </div>

          {/* Trust Badges */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Why Choose Us
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-700">
                  Authentic products guaranteed
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-700">
                  Secure payment processing
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-700">
                  24/7 customer support
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
