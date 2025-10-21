"use client";

import { useState } from "react";
import {
  Star,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  HelpCircle,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import type { Product, Review, FAQ } from "./product-page.types";
import Image from "next/image";
import { getPublicUrl } from "@workspace/ui/lib/utils";

interface ProductTabsProps {
  product: Product;
}

// Mock data - in real app, this would come from API
const mockReviews: Review[] = [
  {
    id: "1",
    user: "Sarah J.",
    rating: 5,
    date: "2 weeks ago",
    comment:
      "Amazing quality! The fabric is so soft and the fit is perfect. Highly recommended!",
    helpful: 12,
    userAvatar: "/avatars/sarah.jpg",
  },
  {
    id: "2",
    user: "Mike R.",
    rating: 4,
    date: "1 month ago",
    comment:
      "Good shirt overall. Size runs a bit large, so consider ordering one size smaller.",
    helpful: 8,
    userAvatar: "/avatars/mike.jpg",
  },
  {
    id: "3",
    user: "Emma L.",
    rating: 5,
    date: "3 weeks ago",
    comment:
      "Love this shirt! Colors are vibrant and it maintains shape after washing.",
    helpful: 15,
    userAvatar: "/avatars/emma.jpg",
  },
];

const mockFAQs: FAQ[] = [
  {
    id: "1",
    question: "Is it made from cotton?",
    answer:
      "Yes, this product is made from 100% premium cotton for maximum comfort and breathability.",
  },
  {
    id: "2",
    question: "What sizes are available?",
    answer:
      "We offer sizes XS through 2XL to accommodate various body types and preferences.",
  },
  {
    id: "3",
    question: "How do I care for this item?",
    answer:
      "Machine wash cold, tumble dry low. Avoid bleach and iron on low heat if needed.",
  },
  {
    id: "4",
    question: "What is your return policy?",
    answer:
      "We offer a 30-day return policy for all unused items in original packaging.",
  },
];

export const ProductTabs = ({ product }: ProductTabsProps) => {
  const [activeTab, setActiveTab] = useState("reviews");
  const [expandedFAQs, setExpandedFAQs] = useState<Set<string>>(new Set());

  const toggleFAQ = (faqId: string) => {
    const newExpanded = new Set(expandedFAQs);
    if (newExpanded.has(faqId)) {
      newExpanded.delete(faqId);
    } else {
      newExpanded.add(faqId);
    }
    setExpandedFAQs(newExpanded);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const renderRatingBar = (rating: number, percentage: number) => (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 min-w-[20px]">
        <span className="text-sm font-medium text-gray-900">{rating}</span>
        <Star className="h-4 w-4 text-yellow-400 fill-current" />
      </div>
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className="bg-yellow-400 h-2 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-gray-600 min-w-[30px]">{percentage}%</span>
    </div>
  );

  return (
    <section className="bg-white py-6 lg:py-8">
      <div className="container">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6 lg:mb-8 overflow-x-auto">
          {[
            { id: "reviews", label: "Reviews", icon: MessageCircle },
            { id: "faq", label: "FAQ", icon: HelpCircle },
            { id: "gallery", label: "Gallery", icon: ImageIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 lg:gap-2 px-3 lg:px-6 py-2 lg:py-3 font-medium transition-colors text-sm lg:text-base whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className="h-4 w-4 lg:h-5 lg:w-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Reviews List */}
              <div className="lg:col-span-2 space-y-4 lg:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-lg lg:text-xl font-bold text-gray-900">
                    Customer Reviews
                  </h3>
                  <Button variant="outline" size="sm" className="w-fit">
                    Write a Review
                  </Button>
                </div>

                {mockReviews.map((review) => (
                  <div
                    key={review.id}
                    className="border border-gray-200 rounded-lg p-4 lg:p-6"
                  >
                    <div className="flex items-start gap-3 lg:gap-4 mb-3 lg:mb-4">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-base lg:text-lg font-semibold text-gray-600">
                          {review.user.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                          <span className="font-semibold text-gray-900 text-sm lg:text-base">
                            {review.user}
                          </span>
                          <span className="text-xs lg:text-sm text-gray-500">
                            {review.date}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3 lg:mb-4 text-sm lg:text-base">
                      {review.comment}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex gap-2">
                        {["#f3f4f6", "#e5e7eb", "#d1d5db"].map((color, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 lg:w-8 lg:h-8 rounded-lg border border-gray-200"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <Button variant="ghost" size="sm" className="w-fit">
                        Helpful ({review.helpful})
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="text-center">
                  <Button variant="outline">View More Reviews</Button>
                </div>
              </div>

              {/* Rating Summary */}
              <div className="space-y-4 lg:space-y-6">
                <div className="border border-gray-200 rounded-lg p-4 lg:p-6">
                  <div className="text-center mb-3 lg:mb-4">
                    <div className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                      {product.averageRating}
                    </div>
                    <div className="flex justify-center mb-2">
                      {renderStars(Math.round(product.averageRating))}
                    </div>
                    <p className="text-xs lg:text-sm text-gray-600">
                      Based on {product.reviewCount} ratings
                    </p>
                  </div>

                  <div className="space-y-2 lg:space-y-3">
                    {renderRatingBar(5, 83)}
                    {renderRatingBar(4, 56)}
                    {renderRatingBar(3, 15)}
                    {renderRatingBar(2, 8)}
                    {renderRatingBar(1, 2)}
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 lg:p-6">
                  <h4 className="font-semibold text-gray-900 mb-3 lg:mb-4 text-sm lg:text-base">
                    Leave a Review
                  </h4>
                  <p className="text-xs lg:text-sm text-gray-600 mb-3 lg:mb-4">
                    You can only review products you've purchased. Share your
                    experience with the product, the vendor, and the delivery.
                  </p>
                  <p className="text-xs text-gray-500">
                    Note: Reviews can be submitted after your order is marked as
                    delivered.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* FAQ Tab */}
          {activeTab === "faq" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <div className="space-y-4 lg:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-lg lg:text-xl font-bold text-gray-900">
                    Frequently Asked Questions
                  </h3>
                  <Button variant="outline" size="sm" className="w-fit">
                    View More
                  </Button>
                </div>

                <div className="space-y-3 lg:space-y-4">
                  {mockFAQs.map((faq) => (
                    <div
                      key={faq.id}
                      className="border border-gray-200 rounded-lg"
                    >
                      <button
                        onClick={() => toggleFAQ(faq.id)}
                        className="w-full px-4 lg:px-6 py-3 lg:py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900 text-sm lg:text-base">
                          {faq.question}
                        </span>
                        {expandedFAQs.has(faq.id) ? (
                          <ChevronUp className="h-4 w-4 lg:h-5 lg:w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 lg:h-5 lg:w-5 text-gray-500" />
                        )}
                      </button>
                      {expandedFAQs.has(faq.id) && (
                        <div className="px-4 lg:px-6 pb-3 lg:pb-4">
                          <p className="text-gray-700 text-sm lg:text-base">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 lg:space-y-6">
                <div className="border border-gray-200 rounded-lg p-4 lg:p-6">
                  <h4 className="font-semibold text-gray-900 mb-3 lg:mb-4 text-sm lg:text-base">
                    Have a Question?
                  </h4>
                  <div className="space-y-3 lg:space-y-4">
                    <input
                      type="text"
                      placeholder="Type your question here..."
                      className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm lg:text-base"
                    />
                    <Button className="w-full">Send Question</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Gallery Tab */}
          {activeTab === "gallery" && (
            <div className="space-y-4 lg:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-lg lg:text-xl font-bold text-gray-900">
                  Product Gallery
                </h3>
                <Button variant="outline" size="sm" className="w-fit">
                  View More
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 lg:gap-4">
                {product?.images?.map((image, index) => (
                  <div
                    key={index}
                    className="aspect-square bg-gray-200 rounded-lg border border-gray-200 hover:border-primary transition-colors cursor-pointer overflow-hidden"
                  >
                    <Image
                      src={getPublicUrl(image, "products")}
                      alt={product.title}
                      width={150}
                      height={150}
                      className="w-full h-full object-contain bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
