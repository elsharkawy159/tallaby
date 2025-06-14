import FeaturesSection from "@/components/home/FeaturesSection";
import HeroCarousel from "@/components/home/HeroCarousel";
import ProductSection from "@/components/home/ProductSection";
import VendorRecruitment from "@/components/home/VendorRecruitment";

const page = async () => {
  return (
    <>
      {/* Hero Carousel Banner */}
      <HeroCarousel />

      {/* Trending Products */}
      <ProductSection title="🔥 Offers" />

      {/* Why Shop With Us */}
      <FeaturesSection />

      {/* Best Sellers */}
      <ProductSection title="Trending" />

      {/* What Our Customers Say */}
      {/* <TestimonialsSection /> */}

      {/* New Arrivals */}
      <ProductSection title="Best Sellers" />

      {/* Have a Brand? Let's Grow Together (Vendor CTA) */}
      <VendorRecruitment />
    </>
  );
};

export default page;
