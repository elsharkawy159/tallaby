"use client";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
// import { useAuth } from "@/contexts/AuthContext";
// import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Separator } from "@workspace/ui/components/separator";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";
import { Truck, CreditCard, Shield } from "lucide-react";
import Link from "next/link";
// import { useToast } from "@/hooks/use-toast";

const Checkout = () => {
  // const { cartItems, cartTotal, clearCart } = useCart();
  // const { user } = useAuth();
  // const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [loading, setLoading] = useState(false);

  const shipping =
    shippingMethod === "express"
      ? 15.99
      : shippingMethod === "overnight"
        ? 25.99
        : 5.99;
  // const tax = cartTotal * 0.08;
  // const total = cartTotal + shipping + tax;

  const steps = [
    { number: 1, title: "Shipping", icon: Truck },
    { number: 2, title: "Payment", icon: CreditCard },
    { number: 3, title: "Review", icon: Shield },
  ];

  // const handlePlaceOrder = async () => {
  //   if (!user) {
  //     toast({
  //       title: "Please sign in",
  //       description: "You need to be signed in to place an order.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     // Create order
  //     const orderNumber = `ORD-${Date.now()}`;
  //     const { data: order, error: orderError } = await supabase
  //       .from("orders")
  //       .insert({
  //         user_id: user.id,
  //         order_number: orderNumber,
  //         subtotal: cartTotal,
  //         shipping_cost: shipping,
  //         tax: tax,
  //         total_amount: total,
  //         payment_method: paymentMethod,
  //         status: "pending",
  //         payment_status: "pending",
  //       })
  //       .select()
  //       .single();

  //     if (orderError) throw orderError;

  //     // Create order items
  //     const orderItems = cartItems.map((item) => ({
  //       order_id: order.id,
  //       product_id: item.product_id,
  //       seller_id: user.id, // This should be the actual seller ID
  //       quantity: item.quantity,
  //       price: item.price,
  //       subtotal: item.price * item.quantity,
  //       total: item.price * item.quantity,
  //       commission_amount: item.price * item.quantity * 0.15,
  //       commission_rate: 0.15,
  //       seller_earning: item.price * item.quantity * 0.85,
  //       sku: `SKU-${item.product_id}`,
  //       product_name: item.product.title,
  //     }));

  //     const { error: itemsError } = await supabase
  //       .from("order_items")
  //       .insert(orderItems);

  //     if (itemsError) throw itemsError;

  //     // Clear cart
  //     await clearCart();

  //     toast({
  //       title: "Order placed successfully!",
  //       description: `Your order ${orderNumber} has been placed.`,
  //     });

  //     navigate("/profile?tab=orders");
  //   } catch (error) {
  //     console.error("Error placing order:", error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to place order. Please try again.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // if (!user) {
  //   return (
  //     <div className="min-h-screen flex flex-col">
  //
  //       <div className="flex-1 flex items-center justify-center">
  //         <div className="text-center">
  //           <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
  //           <p className="text-gray-600 mb-8">
  //             You need to be signed in to checkout.
  //           </p>
  //           <Link href="/auth">
  //             <Button>Sign In</Button>
  //           </Link>
  //         </div>
  //       </div>
  //
  //     </div>
  //   );
  // }

  // if (cartItems.length === 0) {
  //   return (
  //     <div className="min-h-screen flex flex-col">
  //
  //       <div className="flex-1 flex items-center justify-center">
  //         <div className="text-center">
  //           <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
  //           <p className="text-gray-600 mb-8">
  //             Add some items to your cart to checkout.
  //           </p>
  //           <Link href="/products">
  //             <Button>Continue Shopping</Button>
  //           </Link>
  //         </div>
  //       </div>
  //
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen flex flex-col">
      <DynamicBreadcrumb />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.number
                    ? "bg-primary border-primary text-white"
                    : "border-gray-300 text-gray-300"
                }`}
              >
                <step.icon className="h-5 w-5" />
              </div>
              <div className="ml-2 mr-8">
                <p
                  className={`text-sm font-medium ${
                    currentStep >= step.number
                      ? "text-primary"
                      : "text-gray-500"
                  }`}
                >
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-0.5 mr-8 ${
                    currentStep > step.number ? "bg-primary" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping */}
            {currentStep === 1 && (
              <div className="bg-white border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">Shipping Information</h2>

                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="John" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Doe" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      // defaultValue={user?.email}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="+1 (555) 123-4567" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input id="address" placeholder="123 Main Street" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" placeholder="New York" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" placeholder="NY" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input id="zipCode" placeholder="10001" />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium mb-4">Shipping Method</h3>
                    <RadioGroup
                      value={shippingMethod}
                      onValueChange={setShippingMethod}
                    >
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="standard" id="standard" />
                          <div>
                            <Label htmlFor="standard" className="font-medium">
                              Standard Shipping
                            </Label>
                            <p className="text-sm text-gray-600">
                              5-7 business days
                            </p>
                          </div>
                        </div>
                        <span className="font-medium">$5.99</span>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="express" id="express" />
                          <div>
                            <Label htmlFor="express" className="font-medium">
                              Express Shipping
                            </Label>
                            <p className="text-sm text-gray-600">
                              2-3 business days
                            </p>
                          </div>
                        </div>
                        <span className="font-medium">$15.99</span>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="overnight" id="overnight" />
                          <div>
                            <Label htmlFor="overnight" className="font-medium">
                              Overnight Shipping
                            </Label>
                            <p className="text-sm text-gray-600">
                              Next business day
                            </p>
                          </div>
                        </div>
                        <span className="font-medium">$25.99</span>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => setCurrentStep(2)}>
                      Continue to Payment
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 2: Payment */}
            {currentStep === 2 && (
              <div className="bg-white border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">Payment Information</h2>

                <form className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-4">Payment Method</h3>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                    >
                      <Label
                        htmlFor="cash"
                        className="flex items-center space-x-2 p-4 border rounded-lg"
                      >
                        <RadioGroupItem value="cash" id="cash" />
                        <span className="font-medium">Cash on Delivery</span>
                      </Label>
                      <Label
                        htmlFor="card"
                        className="flex items-center space-x-2 p-4 border rounded-lg"
                      >
                        <RadioGroupItem value="card" id="card" />
                        <span className="font-medium">Credit/Debit Card</span>
                      </Label>
                      <Label
                        htmlFor="paypal"
                        className="flex items-center space-x-2 p-4 border rounded-lg"
                      >
                        <RadioGroupItem value="paypal" id="paypal" />
                        <span className="font-medium">PayPal</span>
                      </Label>
                    </RadioGroup>
                  </div>

                  {paymentMethod === "card" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input id="expiry" placeholder="MM/YY" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV</Label>
                          <Input id="cvv" placeholder="123" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardName">Name on Card</Label>
                        <Input id="cardName" placeholder="John Doe" />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(1)}>
                      Back to Shipping
                    </Button>
                    <Button onClick={() => setCurrentStep(3)}>
                      Review Order
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="bg-white border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">Order Review</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-4">Order Items</h3>
                    <div className="space-y-4">
                      {/* {cartItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center space-x-4 p-4 border rounded-lg"
                        >
                          <img
                            src={
                              item.product.images[0]?.url || "/placeholder.svg"
                            }
                            alt={item.product.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">
                              {item.product.title}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <p className="font-bold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))} */}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" />
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="text-primary hover:underline"
                      >
                        Terms and Conditions
                      </Link>
                    </Label>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(2)}>
                      Back to Payment
                    </Button>
                    <Button
                      size="lg"
                      className="bg-green-600 hover:bg-green-700"
                      // onClick={handlePlaceOrder}
                      disabled={loading}
                    >
                      {loading ? "Placing Order..." : "Place Order"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border rounded-lg p-6 sticky top-4">
              <h3 className="text-lg font-bold mb-4">Order Summary</h3>

              <div className="space-y-4 mb-6">
                {/* {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <img
                      src={item.product.images[0]?.url || "/placeholder.svg"}
                      alt={item.product.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {item.product.title}
                      </p>
                      <p className="text-xs text-gray-600">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold text-sm">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))} */}
              </div>

              <Separator className="mb-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${540}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>${60}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${10}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${610}</span>
                </div>
              </div>

              <div className="mt-6 text-center text-sm text-gray-600">
                <p>🔒 Secure checkout with SSL encryption</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
