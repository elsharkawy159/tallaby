"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import CategoryShowcase from "./CategoryShowcase";

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = [
    {
      id: 1,
      href: "/",
      image: "/banner.jpg",
    },
    {
      id: 2,
      href: "/",
      image: "/banner2.jpg",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <section className="relative h-[70vh] w-full mb-20">
      <div className="w-full h-full">
        {banners.map((banner, index) => (
          <Link href={banner.href} key={banner.id}>
            <Image
              src={banner.image}
              alt={banner.image}
              fill
              sizes="100vw"
              className={cn(
                "object-cover ovject-center duration-1000 transition-opacity",
                currentSlide === index ? "opacity-100" : "opacity-0"
              )}
            />
          </Link>
        ))}
      </div>

      {/* Slide Indicators */}
      {/* <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
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
      </div> */}
      <CategoryShowcase className="absolute -bottom-20 left-0 right-0" />
    </section>
  );
};

export default HeroCarousel;
