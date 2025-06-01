"use client";
import { useState, useEffect } from "react";
// import { useParams } from "react-router-dom";
// import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Heart,
  Star,
  ShoppingCart,
  Truck,
  Shield,
  RotateCcw,
  Plus,
  Minus,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
// import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  title: string;
  description: string;
  base_price: number;
  average_rating: number;
  review_count: number;
  brand?: {
    name: string;
  };
  images: Array<{
    url: string;
    alt_text: string;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    title: string;
    comment: string;
    created_at: string;
    users: {
      first_name: string;
      last_name: string;
    };
  }>;
}

const SingleProduct = () => {
  // const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  // const { addToCart } = useCart();
  // const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  // const { toast } = useToast();

  // useEffect(() => {
  //   const fetchProduct = async () => {
  //     if (!slug) return;

  //     const { data, error } = await supabase
  //       .from("products")
  //       .select(
  //         `
  //         id,
  //         title,
  //         description,
  //         base_price,
  //         average_rating,
  //         review_count,
  //         brands (name),
  //         product_images (url, alt_text),
  //         reviews (
  //           id,
  //           rating,
  //           title,
  //           comment,
  //           created_at,
  //           users (first_name, last_name)
  //         )
  //       `
  //       )
  //       .eq("slug", slug)
  //       .eq("is_active", true)
  //       .single();

  //     if (error) {
  //       console.error("Error fetching product:", error);
  //       toast({
  //         title: "Product not found",
  //         description: "The product you're looking for doesn't exist.",
  //         variant: "destructive",
  //       });
  //     } else {
  //       const transformedProduct = {
  //         ...data,
  //         images: data.product_images || [],
  //         brand: data.brands,
  //       };
  //       setProduct(transformedProduct);
  //     }
  //     setLoading(false);
  //   };

  //   fetchProduct();
  // }, [slug, toast]);

  // const handleAddToCart = () => {
  //   if (product) {
  //     addToCart(product.id, quantity);
  //   }
  // };

  // const handleWishlistToggle = () => {
  //   if (product) {
  //     if (isInWishlist(product.id)) {
  //       removeFromWishlist(product.id);
  //     } else {
  //       addToWishlist(product.id);
  //     }
  //   }
  // };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <p className="text-gray-600">
              The product you're looking for doesn't exist.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img
                src={product.images[selectedImage]?.url || "/placeholder.svg"}
                alt={product.images[selectedImage]?.alt_text || product.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 ${
                    selectedImage === index
                      ? "border-primary"
                      : "border-gray-200"
                  }`}
                >
                  <img
                    src={image.url}
                    alt={image.alt_text}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              {product.brand && (
                <Badge variant="secondary" className="mb-2">
                  {product.brand.name}
                </Badge>
              )}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.title}
              </h1>

              {/* Rating */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(product.average_rating || 0)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {product.average_rating} ({product.review_count} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="text-3xl font-bold text-primary mb-6">
                ${product.base_price}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">Quantity:</span>
              <div className="flex items-center border rounded-md">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-100"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-gray-100"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            {/* <div className="flex space-x-4">
              <Button onClick={handleAddToCart} className="flex-1" size="lg">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
              <Button
                onClick={handleWishlistToggle}
                variant="outline"
                size="lg"
                className={
                  isInWishlist(product.id) ? "text-red-500 border-red-500" : ""
                }
              >
                <Heart
                  className={`h-5 w-5 ${isInWishlist(product.id) ? "fill-current" : ""}`}
                />
              </Button>
            </div> */}

            {/* Features */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center space-x-3">
                  <Truck className="h-5 w-5 text-green-600" />
                  <span className="text-sm">
                    Free shipping on orders over $50
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="text-sm">2-year warranty included</span>
                </div>
                <div className="flex items-center space-x-3">
                  <RotateCcw className="h-5 w-5 text-purple-600" />
                  <span className="text-sm">30-day return policy</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="reviews">
                Reviews ({product.review_count})
              </TabsTrigger>
              <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {product.description}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <div className="space-y-6">
                {product.reviews.map((review) => (
                  <div key={review.id} className="border-b pb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-medium">
                            {review.users.first_name} {review.users.last_name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {review.title && (
                      <h4 className="font-medium mb-2">{review.title}</h4>
                    )}
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="shipping" className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Shipping Information</h3>
                  <p className="text-gray-700">
                    Free standard shipping on orders over $50. Express shipping
                    available for $9.99. Orders are processed within 1-2
                    business days.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Return Policy</h3>
                  <p className="text-gray-700">
                    30-day hassle-free returns. Items must be in original
                    condition with tags attached. Return shipping is free for
                    defective items.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SingleProduct;
