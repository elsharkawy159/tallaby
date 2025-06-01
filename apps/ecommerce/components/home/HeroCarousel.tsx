"use client";

import { useState, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel";
import Link from "next/link";

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = [
    {
      id: 1,
      title: "Unlock Up to 70% Off",
      subtitle: "Summer Collection",
      description:
        "Discover the latest fashion trends from top brands and vendors. Your style journey starts here.",
      buttonText: "Shop Now",
      background: "bg-gradient-to-br from-purple-600 via-blue-600 to-blue-700",
      image:
        "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=600&fit=crop",
    },
    {
      id: 2,
      title: "New Arrivals",
      subtitle: "Fresh Styles Daily",
      description:
        "Be the first to explore our newest collections from premium brands worldwide.",
      buttonText: "Explore Now",
      background: "bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600",
      image:
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop",
    },
    {
      id: 3,
      title: "Electronics Sale",
      subtitle: "Tech at Best Prices",
      description:
        "Upgrade your tech game with our exclusive electronics deals and offers.",
      buttonText: "Shop Electronics",
      background: "bg-gradient-to-br from-orange-500 via-pink-500 to-red-500",
      image:
        "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=600&fit=crop",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <section className="relative h-[600px] md:h-[700px] overflow-hidden">
      <div className="w-full h-full">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              currentSlide === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className={`relative h-full ${banner.background} text-white overflow-hidden`}
            >
              <div className="container mx-auto px-4 h-full flex items-center relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center w-full">
                  <div className="max-w-xl">
                    <div className="inline-block bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-4">
                      {banner.subtitle}
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                      {banner.title.includes("70%") ? (
                        <>
                          Unlock Up to
                          <span className="text-yellow-300 block">
                            {" "}
                            70% Off
                          </span>
                        </>
                      ) : (
                        banner.title
                      )}
                    </h1>
                    <p className="text-xl mb-8 text-white/90 leading-relaxed">
                      {banner.description}
                    </p>
                    <Link href="/products">
                      <Button
                        size="lg"
                        className="bg-white hover:bg-white/90 text-black font-semibold px-10 py-4 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
                      >
                        {banner.buttonText}
                      </Button>
                    </Link>
                  </div>
                  <div className="hidden lg:block">
                    <div className="relative">
                      <img
                        src={banner.image}
                        alt={banner.title}
                        className="w-full h-[500px] object-cover rounded-3xl shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-300"
                      />
                      <div className="absolute -inset-4 bg-white/20 rounded-3xl blur-xl"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-white/10 rounded-full blur-2xl animate-pulse delay-500"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-12 h-2 rounded-full transition-all duration-300 ${
              currentSlide === index
                ? "bg-white shadow-lg"
                : "bg-white/50 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;
