import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import {
  CheckCircle,
  Clock,
  Package,
  RotateCcw,
  AlertCircle,
  Truck,
} from "lucide-react";
import Link from "next/link";

const Returns = () => {
  const returnProcess = [
    {
      step: 1,
      title: "Initiate Return",
      description:
        "Log into your account and select the item you want to return",
      icon: Package,
      timeframe: "Within 30 days",
    },
    {
      step: 2,
      title: "Print Label",
      description: "Download and print the prepaid return shipping label",
      icon: Truck,
      timeframe: "Instant",
    },
    {
      step: 3,
      title: "Ship Item",
      description: "Package the item and drop it off at any shipping location",
      icon: RotateCcw,
      timeframe: "1-2 days",
    },
    {
      step: 4,
      title: "Processing",
      description: "We inspect the item and process your return",
      icon: Clock,
      timeframe: "3-5 business days",
    },
    {
      step: 5,
      title: "Refund",
      description: "Receive your refund via original payment method",
      icon: CheckCircle,
      timeframe: "5-7 business days",
    },
  ];

  const returnableItems = [
    {
      category: "Clothing",
      condition: "Unworn with tags",
      timeframe: "30 days",
    },
    {
      category: "Shoes",
      condition: "Unworn in original box",
      timeframe: "30 days",
    },
    {
      category: "Accessories",
      condition: "Unused in original packaging",
      timeframe: "30 days",
    },
    {
      category: "Electronics",
      condition: "Unopened or defective only",
      timeframe: "14 days",
    },
    {
      category: "Beauty Products",
      condition: "Unopened and sealed",
      timeframe: "30 days",
    },
  ];

  const nonReturnableItems = [
    "Personalized or customized items",
    "Intimate apparel and swimwear",
    "Opened beauty products (unless defective)",
    "Items damaged by misuse",
    "Gift cards and digital products",
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <DynamicBreadcrumb customLabels={{ returns: "Return Policy" }} />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Return Policy
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              We want you to love your purchase. If you're not completely
              satisfied, we offer easy returns within 30 days of purchase.
            </p>
            <Badge className="bg-accent text-black text-lg px-4 py-2">
              30-Day Return Window
            </Badge>
          </div>
        </section>

        {/* Return Process */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How to Return an Item</h2>
              <p className="text-gray-600">
                Follow these simple steps to return your purchase
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {returnProcess.map((step, index) => (
                <div key={step.step} className="text-center">
                  <div className="relative">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                    <Badge className="absolute -top-2 -right-2 bg-accent text-black">
                      {step.step}
                    </Badge>
                  </div>
                  <h3 className="font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {step.description}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {step.timeframe}
                  </Badge>
                  {index < returnProcess.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gray-300 transform -translate-x-1/2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Return Conditions */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Returnable Items */}
              <div>
                <h2 className="text-2xl font-bold mb-6">
                  What Can Be Returned
                </h2>
                <div className="space-y-4">
                  {returnableItems.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{item.category}</h3>
                            <p className="text-sm text-gray-600">
                              {item.condition}
                            </p>
                          </div>
                          <Badge variant="secondary">{item.timeframe}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Non-Returnable Items */}
              <div>
                <h2 className="text-2xl font-bold mb-6">
                  What Cannot Be Returned
                </h2>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                      <span>Non-Returnable Items</span>
                    </CardTitle>
                    <CardDescription>
                      For hygiene and safety reasons, these items cannot be
                      returned
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {nonReturnableItems.map((item, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-600">
                Common questions about our return policy
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>How long do I have to return an item?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    You have 30 days from the date of purchase to return most
                    items. Electronics have a 14-day return window.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Do I need the original receipt?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    While a receipt helps speed up the process, you can return
                    items purchased with your account without a physical
                    receipt.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How much does return shipping cost?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Return shipping is free for defective items or our errors.
                    For other returns, a $5.99 shipping fee will be deducted
                    from your refund.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>When will I receive my refund?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Refunds are typically processed within 3-5 business days
                    after we receive your return. It may take an additional 5-7
                    business days to appear on your statement.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Need Help with a Return?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Our customer service team is here to help you with any return
              questions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button
                  size="lg"
                  className="bg-accent text-black hover:bg-accent/90"
                >
                  Contact Support
                </Button>
              </Link>
              <Link href="/help">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-primary"
                >
                  View Help Center
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Returns;
