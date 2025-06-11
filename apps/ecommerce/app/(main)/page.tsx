import CategoryShowcase from "@/components/home/CategoryShowcase";
import DealsSection from "@/components/home/DealsSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import HeroCarousel from "@/components/home/HeroCarousel";
import ProductSection from "@/components/home/ProductSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import VendorRecruitment from "@/components/home/VendorRecruitment";

const page = () => {
  return (
    <>
      {/* Hero Carousel Banner */}
      <HeroCarousel />

      {/* Trending Products */}
      <ProductSection title="🔥 Trending" />

      {/* Why Shop With Us */}
      <FeaturesSection />

      {/* Best Sellers */}
      <ProductSection title="⭐ Best Sellers" />

      {/* What Our Customers Say */}
      <TestimonialsSection />

      {/* New Arrivals */}
      <ProductSection title="✨ New Arrivals" />

      {/* Have a Brand? Let's Grow Together (Vendor CTA) */}
      <VendorRecruitment />
    </>
  );
};

export default page;
