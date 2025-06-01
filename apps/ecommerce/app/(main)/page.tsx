import CategoryShowcase from "@/components/home/CategoryShowcase";
import DealsSection from "@/components/home/DealsSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import HeroCarousel from "@/components/home/HeroCarousel";
import ProductSection from "@/components/home/ProductSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import VendorRecruitment from "@/components/home/VendorRecruitment";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

const page = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Carousel Banner */}
        <HeroCarousel />
        
        {/* Categories */}
        <CategoryShowcase />
        
        {/* Flash Deals */}
        <DealsSection />
        
        {/* Trending Products */}
        <ProductSection title="🔥 Trending Products" />
        
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
      </main>

      <Footer />
    </div>
  );
};

export default page;
