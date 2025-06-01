import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";

const Wishlist = () => {
  // const { wishlistItems, loading, removeFromWishlist } = useWishlist();
  // const { addToCart } = useCart();

  // const handleAddToCart = (productId: string) => {
  //   addToCart(productId, 1);
  // };

  // const handleRemoveFromWishlist = (productId: string) => {
  //   removeFromWishlist(productId);
  // };

  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex flex-col">
  //       <Header />
  //       <div className="flex-1 flex items-center justify-center">
  //         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  //       </div>
  //       <Footer />
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Wishlist</h1>
          <Heart className="h-8 w-8 text-red-500 fill-current" />
        </div>

        {/* {wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-500 mb-8">
              Save items you love to your wishlist
            </p>
            <Link href="/products">
              <Button>Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <Card
                key={item.id}
                className="group hover:shadow-lg transition-shadow duration-300"
              >
                <CardContent className="p-0">
                  <div className="relative overflow-hidden bg-gray-100">
                    <Link href={`/product/${item.product.slug}`}>
                      <img
                        src={item.product.images[0]?.url || "/placeholder.svg"}
                        alt={
                          item.product.images[0]?.alt_text || item.product.title
                        }
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-500"
                      onClick={() => handleRemoveFromWishlist(item.product_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="p-4">
                    <Link href={`/product/${item.product.slug}`}>
                      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 hover:text-primary">
                        {item.product.title}
                      </h3>
                    </Link>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-gray-900">
                        ${item.product.base_price}
                      </span>
                    </div>

                    <Button
                      onClick={() => handleAddToCart(item.product_id)}
                      className="w-full bg-secondary hover:bg-secondary/90 text-black font-medium"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )} */}
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
