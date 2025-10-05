"use client";
import { useState, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Clock, Star, Flame } from "lucide-react";
import Link from "next/link";

interface Deal {
  id: string;
  name: string;
  description: string;
  discount_value: number;
  featured_image_url: string;
  badge_text: string;
  total_available: number;
  sold_count: number;
}

const DealsSection = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 45,
    seconds: 30,
  });

  // Demo deals data
  const deals: Deal[] = [
    {
      id: "1",
      name: "Electronics Flash Sale",
      description:
        "Up to 70% off on selected electronics including smartphones, laptops, and gaming gear",
      discount_value: 70,
      featured_image_url:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
      badge_text: "Flash Sale",
      total_available: 100,
      sold_count: 67,
    },
    {
      id: "2",
      name: "Fashion Clearance",
      description:
        "End of season fashion sale - designer clothing, shoes, and accessories",
      discount_value: 60,
      featured_image_url:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
      badge_text: "Clearance",
      total_available: 150,
      sold_count: 89,
    },
    {
      id: "3",
      name: "Home & Garden Mega Sale",
      description:
        "Transform your space with huge savings on furniture, decor, and garden essentials",
      discount_value: 45,
      featured_image_url:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
      badge_text: "Mega Sale",
      total_available: 80,
      sold_count: 34,
    },
    {
      id: "4",
      name: "Sports Equipment Sale",
      description:
        "Great deals on fitness equipment, sports gear, and outdoor adventure essentials",
      discount_value: 40,
      featured_image_url:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
      badge_text: "Daily Deal",
      total_available: 75,
      sold_count: 42,
    },
    {
      id: "5",
      name: "Tech Gadgets Bonanza",
      description:
        "Latest tech gadgets at unbeatable prices - limited time only",
      discount_value: 55,
      featured_image_url:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop",
      badge_text: "Hot Deal",
      total_available: 60,
      sold_count: 23,
    },
    {
      id: "6",
      name: "Beauty & Wellness Sale",
      description:
        "Premium skincare, makeup, and wellness products at amazing prices",
      discount_value: 50,
      featured_image_url:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
      badge_text: "Beauty Sale",
      total_available: 90,
      sold_count: 56,
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-20 bg-gradient-to-br from-red-50 via-orange-50 to-pink-50">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <Flame className="h-8 w-8 text-red-500 mr-2" />
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Flash Deals
            </h2>
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Limited time offers - grab them before they're gone!
          </p>

          {/* Countdown Timer */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-red-500" />
              <span className="text-lg font-medium text-gray-700">
                Ends in:
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-red-500 text-white px-4 py-3 rounded-xl font-bold text-xl min-w-[60px]">
                {String(timeLeft.hours).padStart(2, "0")}
              </div>
              <span className="text-gray-600 text-xl">:</span>
              <div className="bg-red-500 text-white px-4 py-3 rounded-xl font-bold text-xl min-w-[60px]">
                {String(timeLeft.minutes).padStart(2, "0")}
              </div>
              <span className="text-gray-600 text-xl">:</span>
              <div className="bg-red-500 text-white px-4 py-3 rounded-xl font-bold text-xl min-w-[60px]">
                {String(timeLeft.seconds).padStart(2, "0")}
              </div>
            </div>
          </div>
        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {deals.slice(0, 6).map((deal) => {
            const progressPercentage =
              (deal.sold_count / deal.total_available) * 100;

            return (
              <Card
                key={deal.id}
                className="group hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2"
              >
                <CardContent className="p-0">
                  <div className="relative overflow-hidden">
                    <img
                      src={deal.featured_image_url}
                      alt={deal.name}
                      className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <Badge className="absolute top-4 left-4 bg-red-500 hover:bg-red-600 text-lg px-3 py-2">
                      -{deal.discount_value}% OFF
                    </Badge>
                    <Badge className="absolute top-4 right-4 bg-white text-red-500 border-2 border-red-500">
                      {deal.badge_text}
                    </Badge>
                  </div>

                  <div className="p-6">
                    <h3 className="font-bold text-2xl mb-3 text-gray-900">
                      {deal.name}
                    </h3>
                    <p className="text-gray-600 mb-4 text-lg">
                      {deal.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {deal.sold_count} sold
                        </span>
                        <span className="text-sm text-gray-500">
                          {deal.total_available - deal.sold_count} left
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-red-500 to-orange-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <Button className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-3 text-lg">
                      Shop Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link href="/products">
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300"
            >
              View All Deals
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DealsSection;
