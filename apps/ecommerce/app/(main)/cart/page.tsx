"use client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { Minus, Plus, X, ShoppingBag, ArrowLeft } from "lucide-react";
import Link from "next/link";

const Cart = () => {
  // Demo cart data
  const cartItems = [
    {
      id: "1",
      product: {
        title: "Premium Cotton T-Shirt",
        images: [
          {
            url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop",
            alt_text: "Premium Cotton T-Shirt",
          },
        ],
      },
      price: 29.99,
      quantity: 2,
    },
    {
      id: "2",
      product: {
        title: "Casual Denim Jacket",
        images: [
          {
            url: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=600&h=600&fit=crop",
            alt_text: "Casual Denim Jacket",
          },
        ],
      },
      price: 89.99,
      quantity: 1,
    },
    {
      id: "3",
      product: {
        title: "Summer Floral Dress",
        images: [
          {
            url: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&h=600&fit=crop",
            alt_text: "Summer Floral Dress",
          },
        ],
      },
      price: 59.99,
      quantity: 1,
    },
  ];

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const shipping = cartTotal > 50 ? 0 : 5.99;
  const tax = cartTotal * 0.08;
  const total = cartTotal + shipping + tax;

  // Demo functions
  const updateQuantity = (id: string, quantity: number) => {
    // This would normally update the cart state
    console.log(`Update quantity for item ${id} to ${quantity}`);
  };

  const removeFromCart = (id: string) => {
    // This would normally remove the item from cart
    console.log(`Remove item ${id} from cart`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>{" "}
          /<span className="text-primary font-medium"> Shopping Cart</span>
        </nav>

        <h1 className="text-3xl font-bold mb-8">
          Shopping Cart ({itemCount} items)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row gap-4 p-6 border rounded-lg"
              >
                <div className="w-full sm:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={item.product.images[0]?.url || "/placeholder.svg"}
                    alt={item.product.images[0]?.alt_text || item.product.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">
                        {item.product.title}
                      </h3>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-lg">${item.price}</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex items-center border rounded-md">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="p-2 hover:bg-gray-100"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-4 py-2 min-w-[3rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="p-2 hover:bg-gray-100"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {shipping > 0 && (
                <p className="text-sm text-green-600 mt-3">
                  Add ${(50 - cartTotal).toFixed(2)} more for free shipping!
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link href="/checkout" className="block">
                <Button className="w-full" size="lg">
                  Proceed to Checkout
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
            </div>

            {/* Security */}
            <div className="text-center text-sm text-gray-600">
              <p>🔒 Secure checkout with SSL encryption</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Cart;
