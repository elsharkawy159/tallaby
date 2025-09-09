import CategoryGrid from "./category/category-grid";
import BestSellersInCategory from "./best-sellers-in-category";
import EventBanner from "./event-banner";
import ShopByBrand from "./shop-by-brand";
import DealOfTheDay from "./deal-of-the-day";
import CategoryCarousel from "./category/category-carousel";
import FeaturedCollection from "./featured-collection";
import QuickFilters from "./quick-filters";

// Example 1: Basic Homepage Layout
export function BasicHomepageLayout() {
  return (
    <>
      <CategoryCarousel title="Browse Categories" />

      <EventBanner
        title="Summer Sale"
        subtitle="Up to 70% off"
        description="Discover amazing deals on summer essentials"
        badgeText="LIMITED TIME"
        backgroundColor="bg-gradient-to-r from-orange-500 to-red-500"
      />

      <CategoryGrid
        title="Shop by Category"
        subtitle="Discover products in your favorite categories"
        limit={8}
        showProductCount={true}
      />

      <DealOfTheDay
        title="Deal of the Day"
        subtitle="Limited time offers you don't want to miss"
        limit={6}
        showCountdown={true}
      />

      <BestSellersInCategory
        categorySlug="electronics"
        title="Best Sellers in Electronics"
        limit={8}
      />

      <ShopByBrand title="Shop by Brand" layout="grid" showRating={true} />
    </>
  );
}

// Example 2: Seasonal Campaign Layout
export function SeasonalCampaignLayout() {
  return (
    <>
      <EventBanner
        title="Black Friday"
        subtitle="Up to 80% off"
        description="The biggest sale of the year is here!"
        badgeText="BLACK FRIDAY"
        badgeVariant="destructive"
        backgroundColor="bg-gradient-to-r from-black to-gray-800"
        ctaText="Shop Now"
        ctaLink="/black-friday"
      />

      <DealOfTheDay
        title="Flash Deals"
        subtitle="Deals that disappear fast"
        limit={8}
        showCountdown={true}
        className="bg-gradient-to-r from-red-50 to-orange-50"
      />

      <FeaturedCollection
        title="Holiday Gift Guide"
        subtitle="Perfect gifts for everyone"
        description="Handpicked gifts for your loved ones"
        badgeText="GIFT GUIDE"
        layout="carousel"
        filters={{ sortBy: "popular" }}
      />

      <CategoryGrid
        title="Shop by Category"
        limit={6}
        showProductCount={true}
        className="bg-gray-50"
      />
    </>
  );
}

// Example 3: Brand-Focused Layout
export function BrandFocusedLayout() {
  return (
    <>
      <ShopByBrand
        title="Featured Brands"
        subtitle="Discover products from your favorite brands"
        limit={16}
        showProductCount={true}
        showRating={true}
        layout="grid"
        className="bg-gray-50"
      />

      <BestSellersInCategory
        categorySlug="fashion"
        title="Best Sellers in Fashion"
        limit={8}
      />

      <BestSellersInCategory
        categorySlug="electronics"
        title="Best Sellers in Electronics"
        limit={8}
      />

      <QuickFilters
        title="Popular Filters"
        filters={[
          { id: "1", label: "Nike", value: "nike", type: "brand", count: 150 },
          { id: "2", label: "Apple", value: "apple", type: "brand", count: 89 },
          {
            id: "3",
            label: "Samsung",
            value: "samsung",
            type: "brand",
            count: 67,
          },
          {
            id: "4",
            label: "Adidas",
            value: "adidas",
            type: "brand",
            count: 45,
          },
        ]}
        showClearAll={true}
      />
    </>
  );
}

// Example 4: Deal-Focused Layout
export function DealFocusedLayout() {
  return (
    <>
      <EventBanner
        title="Clearance Sale"
        subtitle="Everything must go"
        description="Final clearance with unbeatable prices"
        badgeText="CLEARANCE"
        badgeVariant="destructive"
        backgroundColor="bg-gradient-to-r from-red-600 to-pink-600"
        ctaText="Shop Clearance"
        ctaLink="/clearance"
      />

      <DealOfTheDay
        title="Deal of the Day"
        subtitle="Limited time offers you don't want to miss"
        limit={8}
        showCountdown={true}
        className="bg-gradient-to-r from-red-50 to-orange-50"
      />

      <FeaturedCollection
        title="Last Chance Deals"
        subtitle="Deals ending soon"
        description="Don't miss these amazing offers"
        badgeText="ENDING SOON"
        badgeVariant="destructive"
        layout="carousel"
        filters={{ sortBy: "popular" }}
      />

      <CategoryCarousel
        title="Deals by Category"
        limit={10}
        showProductCount={true}
        className="bg-gray-50"
      />
    </>
  );
}

// Example 5: Category-Focused Layout
export function CategoryFocusedLayout() {
  return (
    <>
      <CategoryGrid
        title="Shop by Category"
        subtitle="Discover products in your favorite categories"
        limit={12}
        showProductCount={true}
        className="bg-gray-50"
      />

      <CategoryCarousel
        title="Popular Categories"
        limit={8}
        showProductCount={true}
      />

      <BestSellersInCategory
        categorySlug="home-garden"
        title="Best Sellers in Home & Garden"
        limit={8}
      />

      <BestSellersInCategory
        categorySlug="sports"
        title="Best Sellers in Sports"
        limit={8}
      />

      <QuickFilters
        title="Category Filters"
        filters={[
          {
            id: "1",
            label: "Electronics",
            value: "electronics",
            type: "category",
            count: 1250,
          },
          {
            id: "2",
            label: "Fashion",
            value: "fashion",
            type: "category",
            count: 890,
          },
          {
            id: "3",
            label: "Home & Garden",
            value: "home-garden",
            type: "category",
            count: 567,
          },
          {
            id: "4",
            label: "Sports",
            value: "sports",
            type: "category",
            count: 423,
          },
          {
            id: "5",
            label: "Books",
            value: "books",
            type: "category",
            count: 234,
          },
        ]}
        showClearAll={true}
      />
    </>
  );
}
