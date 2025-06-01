"use client";
import ProductCard from "@/components/product/ProductCard";
import { Button } from "@workspace/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

interface ProductSectionProps {
  title: string;
  categoryId?: string;
}

interface Product {
  id: string;
  brand: string;
  name: string;
  feature: string;
  model: string;
  slug: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  badges?: string[];
}

const ProductSection = ({ title, categoryId }: ProductSectionProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Enhanced demo products data
  const products: Product[] = [
    {
      id: "1",
      brand: "Apple",
      name: "iPhone",
      feature: "Pro Max",
      model: "15",
      slug: "apple-iphone-15-pro-max",
      price: 1199,
      originalPrice: 1299,
      rating: 4.8,
      reviewCount: 2847,
      image:
        "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=400&fit=crop",
      badges: ["Best Seller", "Limited Deal"],
    },
    {
      id: "2",
      brand: "Samsung",
      name: "Galaxy",
      feature: "Ultra",
      model: "S24",
      slug: "samsung-galaxy-s24-ultra",
      price: 1099,
      originalPrice: 1199,
      rating: 4.7,
      reviewCount: 1923,
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop",
      badges: ["New Arrival"],
    },
    {
      id: "3",
      brand: "Sony",
      name: "WH-1000XM5",
      feature: "Wireless Noise Canceling",
      model: "Headphones",
      slug: "sony-wh1000xm5-headphones",
      price: 349,
      originalPrice: 399,
      rating: 4.9,
      reviewCount: 3421,
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      badges: ["Best Seller"],
    },
    {
      id: "4",
      brand: "Nike",
      name: "Air Max",
      feature: "Running",
      model: "270",
      slug: "nike-air-max-270",
      price: 149,
      originalPrice: 179,
      rating: 4.6,
      reviewCount: 2156,
      image:
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
      badges: ["Limited Edition"],
    },
    {
      id: "5",
      brand: "Adidas",
      name: "Ultraboost",
      feature: "DNA",
      model: "22",
      slug: "adidas-ultraboost-22",
      price: 189,
      rating: 4.5,
      reviewCount: 1876,
      image:
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop",
      badges: ["Eco-Friendly"],
    },
    {
      id: "6",
      brand: "Levi's",
      name: "501",
      feature: "Original",
      model: "Jeans",
      slug: "levis-501-original-jeans",
      price: 89,
      originalPrice: 119,
      rating: 4.4,
      reviewCount: 3892,
      image:
        "https://images.unsplash.com/photo-1520975954732-35dd22299614?w=400&h=400&fit=crop",
      badges: ["Classic"],
    },
    {
      id: "7",
      brand: "Zara",
      name: "Blazer",
      feature: "Structured",
      model: "Women's",
      slug: "zara-structured-blazer",
      price: 79,
      originalPrice: 99,
      rating: 4.3,
      reviewCount: 987,
      image:
        "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=400&fit=crop",
      badges: ["Trending"],
    },
    {
      id: "8",
      brand: "Dell",
      name: "XPS",
      feature: "Gaming",
      model: "15",
      slug: "dell-xps-15-gaming",
      price: 1899,
      originalPrice: 2199,
      rating: 4.7,
      reviewCount: 743,
      image:
        "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=400&fit=crop",
      badges: ["Gaming", "High Performance"],
    },
    {
      id: "9",
      brand: "Dyson",
      name: "V15",
      feature: "Detect",
      model: "Vacuum",
      slug: "dyson-v15-detect-vacuum",
      price: 649,
      originalPrice: 749,
      rating: 4.8,
      reviewCount: 2341,
      image:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop",
      badges: ["Best Seller", "Smart Technology"],
    },
    {
      id: "10",
      brand: "Manduka",
      name: "Pro",
      feature: "Yoga Mat",
      model: "6mm",
      slug: "manduka-pro-yoga-mat",
      price: 119,
      originalPrice: 139,
      rating: 4.9,
      reviewCount: 1654,
      image:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
      badges: ["Eco-Friendly", "Premium"],
    },
    {
      id: "11",
      brand: "KitchenAid",
      name: "Stand Mixer",
      feature: "Artisan",
      model: "5-Qt",
      slug: "kitchenaid-artisan-mixer",
      price: 379,
      originalPrice: 449,
      rating: 4.8,
      reviewCount: 4521,
      image:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop",
      badges: ["Best Seller", "Professional Grade"],
    },
    {
      id: "12",
      brand: "Canon",
      name: "EOS",
      feature: "Mirrorless",
      model: "R6 Mark II",
      slug: "canon-eos-r6-mark-ii",
      price: 2499,
      rating: 4.9,
      reviewCount: 876,
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop",
      badges: ["Professional", "New Release"],
    },
  ];

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320; // Width of product card + gap
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const newScrollLeft =
        direction === "left"
          ? scrollLeft - scrollAmount
          : scrollLeft + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            {title}
          </h2>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              className="hidden md:flex"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              className="hidden md:flex"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product) => (
            <div key={product.id} className="flex-none w-72">
              <ProductCard
                id={product.id}
                brand={product.brand}
                name={product.name}
                feature={product.feature}
                model={product.model}
                slug={product.slug}
                price={product.price}
                originalPrice={product.originalPrice}
                rating={product.rating}
                reviewCount={product.reviewCount}
                image={product.image}
                badges={product.badges}
              />
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" className="px-8">
            View All {title}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProductSection;
