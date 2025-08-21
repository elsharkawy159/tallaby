"use client";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@workspace/ui/components/carousel";
import Autoplay from "embla-carousel-autoplay";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
}

const CategoryShowcase = ({ className }: { className?: string }) => {
  // Demo categories data
  const categories: Category[] = [
    {
      id: "1",
      name: "Electronics",
      slug: "electronics",
      description: "Latest gadgets and tech",
      image_url:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=200&fit=crop",
    },
    {
      id: "2",
      name: "Fashion",
      slug: "fashion",
      description: "Trendy clothing & accessories",
      image_url:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop",
    },
    {
      id: "3",
      name: "Home & Kitchen",
      slug: "home-kitchen",
      description: "Everything for your home",
      image_url:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&h=200&fit=crop",
    },
    {
      id: "4",
      name: "Beauty",
      slug: "beauty",
      description: "Wellness & beauty products",
      image_url:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop",
    },
    {
      id: "5",
      name: "Men's Fashion",
      slug: "mens-fashion",
      description: "Stylish mens clothing",
      image_url:
        "https://images.unsplash.com/photo-1520975954732-35dd22299614?w=200&h=200&fit=crop",
    },
    {
      id: "6",
      name: "Women's Fashion",
      slug: "womens-fashion",
      description: "Trendy womens fashion",
      image_url:
        "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&h=200&fit=crop",
    },
    {
      id: "7",
      name: "Kids' Fashion",
      slug: "kids-fashion",
      description: "Everything for little ones",
      image_url:
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&h=200&fit=crop",
    },
    {
      id: "1",
      name: "Electronics",
      slug: "electronics",
      description: "Latest gadgets and tech",
      image_url:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=200&fit=crop",
    },
    {
      id: "2",
      name: "Fashion",
      slug: "fashion",
      description: "Trendy clothing & accessories",
      image_url:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop",
    },
    {
      id: "3",
      name: "Home & Kitchen",
      slug: "home-kitchen",
      description: "Everything for your home",
      image_url:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&h=200&fit=crop",
    },
    {
      id: "4",
      name: "Beauty",
      slug: "beauty",
      description: "Wellness & beauty products",
      image_url:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop",
    },
    {
      id: "8",
      name: "Supermarket",
      slug: "supermarket",
      description: "Daily essentials",
      image_url:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop",
    },
    {
      id: "9",
      name: "Sports & Outdoors",
      slug: "sports-outdoors",
      description: "Athletic gear & equipment",
      image_url:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop",
    },
    {
      id: "10",
      name: "Books & Media",
      slug: "books-media",
      description: "Reading & entertainment",
      image_url:
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=200&fit=crop",
    },
    {
      id: "11",
      name: "Toys & Games",
      slug: "toys-games",
      description: "Fun for all ages",
      image_url:
        "https://images.unsplash.com/photo-1566847438217-76e82d383f84?w=200&h=200&fit=crop",
    },
    {
      id: "12",
      name: "Automotive",
      slug: "automotive",
      description: "Car parts & accessories",
      image_url:
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=200&h=200&fit=crop",
    },
    {
      id: "8",
      name: "Supermarket",
      slug: "supermarket",
      description: "Daily essentials",
      image_url:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop",
    },
    {
      id: "9",
      name: "Sports & Outdoors",
      slug: "sports-outdoors",
      description: "Athletic gear & equipment",
      image_url:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop",
    },
    {
      id: "10",
      name: "Books & Media",
      slug: "books-media",
      description: "Reading & entertainment",
      image_url:
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=200&fit=crop",
    },
  ];

  return (
    <section
      className={cn(
        "py-6 px-16 rounded-t-[50px] bg-background container mx-auto",
        className
      )}
    >
      <Carousel
        opts={{
          align: "start",
          dragFree: false,
        }}
        plugins={[
          Autoplay({
            delay: 3000,
          }),
        ]}
      >
        <CarouselContent>
          {categories.map((category, index) => (
            <Link
              key={`${category.id}-${index}`}
              href={`/category/${category.slug}`}
              className="group block"
            >
              <CarouselItem className="basis-auto">
                <div className="w-32 text-center">
                  <div className="relative overflow-hidden rounded-full size-[100px] mx-auto mb-2.5 bg-white shadow-sm">
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-center group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                </div>
              </CarouselItem>
            </Link>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
};

export default CategoryShowcase;
