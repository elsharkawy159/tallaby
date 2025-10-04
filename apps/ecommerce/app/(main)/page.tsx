import FeaturesSection from "@/components/home/FeaturesSection";
import ProductSection from "@/components/home/ProductSection";
import VendorRecruitment from "@/components/home/VendorRecruitment";
import CategoryGrid from "@/components/home/category/category-grid";
import BestSellersInCategory from "@/components/home/best-sellers-in-category";
import EventBanner from "@/components/home/event-banner";
import ShopByBrand from "@/components/home/shop-by-brand";
import DealOfTheDay from "@/components/home/deal-of-the-day";
import FeaturedCollection from "@/components/home/featured-collection";
import Hero from "@/components/home/hero/hero";
import { generateHomeMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = generateHomeMetadata();

const page = async () => {
  return (
    <div className="min-h-screen">
      <Hero />

      {/* <CategoryCarousel
        title="Browse Categories"
        limit={8}
        className="bg-gray-50"
      /> */}

      <ProductSection
        title="🔥 Offers"
        filters={{
          categoryId: "1f65b57b-fe85-4690-887b-39a778a55b99",
          sortBy: "popular",
        }}
      />

      <EventBanner
        title="Fashion Week Sale"
        subtitle="Up to 50% off"
        description="Discover the latest trends in fashion with incredible discounts on clothing, accessories, and more."
        badgeText="LIMITED TIME"
        badgeVariant="destructive"
        ctaText="Shop Fashion"
        ctaLink="/products?category=fashion"
        backgroundColor="bg-gradient-to-r from-primary to-primary/80"
      />

      <CategoryGrid
        title="Shop by Category"
        subtitle="Discover products in your favorite categories"
        limit={8}
        showProductCount={true}
      />

      {/* <DealOfTheDay
        title="Deal of the Day"
        subtitle="Limited time offers you don't want to miss"
        limit={6}
        showCountdown={true}
        className="bg-gradient-to-r from-red-50 to-orange-50"
      /> */}

      <BestSellersInCategory
        categorySlug="electronics"
        title="Best Sellers in Electronics"
        limit={8}
      />

      <ShopByBrand
        title="Shop by Brand"
        subtitle="Discover products from your favorite brands"
        limit={12}
        showProductCount={true}
        showRating={true}
        layout="grid"
        className="bg-gray-50"
      />

      <FeaturedCollection
        title="Editor's Picks"
        subtitle="Curated collections for you"
        description="Handpicked products that our team loves and recommends"
        badgeText="FEATURED"
        badgeVariant="default"
        layout="carousel"
        showViewMore={true}
      />

      <ProductSection
        title="Trending Now"
        filters={{
          sortBy: "popular",
          limit: 10,
        }}
      />

      <EventBanner
        title="Back to School"
        subtitle="Everything you need"
        description="Get ready for the new school year with our comprehensive back-to-school collection."
        badgeText="BACK TO SCHOOL"
        badgeVariant="default"
        ctaText="Shop Now"
        ctaLink="/products?category=back-to-school"
        backgroundColor="bg-gradient-to-r from-blue-500 to-indigo-600"
      />

      <ProductSection
        title="New Arrivals"
        filters={{
          sortBy: "newest",
          limit: 10,
        }}
      />

      <FeaturesSection />

      <VendorRecruitment />
    </div>
  );
};

export default page;
