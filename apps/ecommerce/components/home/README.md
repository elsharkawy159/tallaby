# Homepage Components Documentation

This directory contains reusable components for building dynamic, feature-rich homepages inspired by Amazon and Noon. All components are designed to be flexible, customizable, and follow Next.js App Router best practices.

## 🆕 New Reusable Components

### 1. CategoryGrid

A grid layout for displaying categories with images, names, and product counts.

```tsx
import CategoryGrid from "@/components/home/category-grid";

<CategoryGrid
  title="Shop by Category"
  subtitle="Discover products in your favorite categories"
  limit={8}
  showProductCount={true}
  className="bg-gray-50"
/>;
```

**Props:**

- `title?: string` - Section title
- `subtitle?: string` - Section subtitle
- `limit?: number` - Number of categories to display (default: 8)
- `showProductCount?: boolean` - Show product count badges (default: true)
- `className?: string` - Additional CSS classes

### 2. BestSellersInCategory

Shows best-selling products from a specific category, similar to Amazon's "Best Sellers in [Category]" pattern.

```tsx
import BestSellersInCategory from "@/components/home/best-sellers-in-category";

<BestSellersInCategory
  categorySlug="electronics"
  title="Best Sellers in Electronics"
  limit={8}
  showViewMore={true}
/>;
```

**Props:**

- `categorySlug: string` - Category slug to filter products
- `title?: string` - Custom title (defaults to "Best Sellers in [Category]")
- `limit?: number` - Number of products to display (default: 8)
- `showViewMore?: boolean` - Show "View More" button (default: true)
- `className?: string` - Additional CSS classes

### 3. EventBanner

Promotional event banners for seasonal campaigns, sales, or special events.

```tsx
import EventBanner from "@/components/home/event-banner";

<EventBanner
  title="Fashion Week Sale"
  subtitle="Up to 50% off"
  description="Discover the latest trends in fashion with incredible discounts."
  badgeText="LIMITED TIME"
  badgeVariant="destructive"
  ctaText="Shop Fashion"
  ctaLink="/products?category=fashion"
  backgroundColor="bg-gradient-to-r from-pink-500 to-purple-600"
/>;
```

**Props:**

- `title: string` - Banner title
- `subtitle?: string` - Banner subtitle
- `description?: string` - Banner description
- `ctaText?: string` - Call-to-action button text (default: "Shop Now")
- `ctaLink?: string` - Call-to-action link (default: "/products")
- `badgeText?: string` - Badge text
- `badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'` - Badge style
- `backgroundImage?: string` - Background image URL
- `backgroundColor?: string` - Background color/gradient
- `textColor?: string` - Text color
- `className?: string` - Additional CSS classes

### 4. ShopByBrand

Brand showcase with filtering capabilities and brand logos.

```tsx
import ShopByBrand from "@/components/home/shop-by-brand";

<ShopByBrand
  title="Shop by Brand"
  subtitle="Discover products from your favorite brands"
  limit={12}
  showProductCount={true}
  showRating={true}
  layout="grid"
  className="bg-gray-50"
/>;
```

**Props:**

- `title?: string` - Section title
- `subtitle?: string` - Section subtitle
- `limit?: number` - Number of brands to display (default: 12)
- `showProductCount?: boolean` - Show product count (default: true)
- `showRating?: boolean` - Show brand ratings (default: true)
- `layout?: 'grid' | 'carousel'` - Layout type (default: 'grid')
- `className?: string` - Additional CSS classes

### 5. DealOfTheDay

Time-limited deals section with countdown timer and special offers.

```tsx
import DealOfTheDay from "@/components/home/deal-of-the-day";

<DealOfTheDay
  title="Deal of the Day"
  subtitle="Limited time offers you don't want to miss"
  limit={6}
  showCountdown={true}
  className="bg-gradient-to-r from-red-50 to-orange-50"
/>;
```

**Props:**

- `title?: string` - Section title
- `subtitle?: string` - Section subtitle
- `limit?: number` - Number of products to display (default: 6)
- `showCountdown?: boolean` - Show countdown timer (default: true)
- `className?: string` - Additional CSS classes

### 6. CategoryCarousel

Horizontal scrolling categories for quick navigation.

```tsx
import CategoryCarousel from "@/components/home/category-carousel";

<CategoryCarousel
  title="Browse Categories"
  limit={12}
  showProductCount={true}
  className="bg-gray-50"
/>;
```

**Props:**

- `title?: string` - Section title
- `limit?: number` - Number of categories to display (default: 12)
- `showProductCount?: boolean` - Show product count (default: true)
- `className?: string` - Additional CSS classes

### 7. FeaturedCollection

Curated product collections with featured badges.

```tsx
import FeaturedCollection from "@/components/home/featured-collection";

<FeaturedCollection
  title="Editor's Picks"
  subtitle="Curated collections for you"
  description="Handpicked products that our team loves and recommends"
  badgeText="FEATURED"
  badgeVariant="default"
  layout="carousel"
  showViewMore={true}
  filters={{
    categoryId: "electronics",
    sortBy: "popular",
  }}
/>;
```

**Props:**

- `title: string` - Collection title
- `subtitle?: string` - Collection subtitle
- `description?: string` - Collection description
- `badgeText?: string` - Badge text
- `badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'` - Badge style
- `filters?: object` - Product filters
- `layout?: 'carousel' | 'grid'` - Layout type (default: 'carousel')
- `showViewMore?: boolean` - Show "View All" button (default: true)
- `className?: string` - Additional CSS classes

### 8. QuickFilters

Filter chips for quick category/brand filtering with URL state management.

```tsx
import QuickFilters from "@/components/home/quick-filters";

<QuickFilters
  title="Popular Filters"
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
      label: "Under $50",
      value: "under-50",
      type: "price",
      count: 1567,
    },
    {
      id: "3",
      label: "4+ Stars",
      value: "4-stars",
      type: "rating",
      count: 2340,
    },
  ]}
  showClearAll={true}
  className="bg-gray-50"
/>;
```

**Props:**

- `title?: string` - Section title
- `filters: FilterOption[]` - Array of filter options
- `showClearAll?: boolean` - Show "Clear All" button (default: true)
- `className?: string` - Additional CSS classes

**FilterOption Interface:**

```tsx
interface FilterOption {
  id: string;
  label: string;
  value: string;
  type: "category" | "brand" | "price" | "rating" | "condition";
  count?: number;
}
```

## 📋 Usage Examples

### Basic Homepage Layout

```tsx
import {
  CategoryGrid,
  BestSellersInCategory,
  EventBanner,
  ShopByBrand,
  DealOfTheDay,
  CategoryCarousel,
  FeaturedCollection,
  QuickFilters,
} from "@/components/home";

export default function HomePage() {
  return (
    <>
      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Quick Category Navigation */}
      <CategoryCarousel title="Browse Categories" />

      {/* Event Banner */}
      <EventBanner
        title="Summer Sale"
        subtitle="Up to 70% off"
        badgeText="LIMITED TIME"
        backgroundColor="bg-gradient-to-r from-orange-500 to-red-500"
      />

      {/* Category Grid */}
      <CategoryGrid
        title="Shop by Category"
        limit={8}
        showProductCount={true}
      />

      {/* Deal of the Day */}
      <DealOfTheDay title="Deal of the Day" limit={6} showCountdown={true} />

      {/* Best Sellers in Specific Category */}
      <BestSellersInCategory
        categorySlug="electronics"
        title="Best Sellers in Electronics"
      />

      {/* Brand Showcase */}
      <ShopByBrand title="Shop by Brand" layout="grid" showRating={true} />

      {/* Featured Collection */}
      <FeaturedCollection
        title="Editor's Picks"
        layout="carousel"
        badgeText="FEATURED"
      />

      {/* Quick Filters */}
      <QuickFilters
        title="Popular Filters"
        filters={[
          {
            id: "1",
            label: "Electronics",
            value: "electronics",
            type: "category",
          },
          { id: "2", label: "Fashion", value: "fashion", type: "category" },
        ]}
      />
    </>
  );
}
```

### Seasonal Campaign Layout

```tsx
// Back to School Campaign
<EventBanner
  title="Back to School"
  subtitle="Everything you need"
  description="Get ready for the new school year with our comprehensive collection."
  badgeText="BACK TO SCHOOL"
  backgroundColor="bg-gradient-to-r from-blue-500 to-indigo-600"
  ctaText="Shop Now"
  ctaLink="/products?category=back-to-school"
/>

// Holiday Season
<EventBanner
  title="Holiday Season"
  subtitle="Gift Guide 2024"
  description="Find the perfect gifts for everyone on your list."
  badgeText="HOLIDAY SPECIAL"
  backgroundColor="bg-gradient-to-r from-green-500 to-red-500"
  backgroundImage="/images/holiday-bg.jpg"
/>
```

## 🎨 Customization

### Styling

All components accept a `className` prop for custom styling:

```tsx
<CategoryGrid className="bg-gradient-to-r from-blue-50 to-purple-50" />
<EventBanner className="my-8 rounded-3xl" />
```

### Data Fetching

Components automatically fetch data from your existing actions:

- `getTopCategories()` for categories
- `getPopularBrands()` for brands
- `getProducts()` for products
- `getCategoryBySlug()` for category details

### Responsive Design

All components are built with responsive design in mind:

- Mobile-first approach
- Flexible grid layouts
- Touch-friendly carousels
- Optimized for all screen sizes

## 🔧 Advanced Usage

### Custom Product Filters

```tsx
<FeaturedCollection
  title="New Arrivals"
  filters={{
    sortBy: "newest",
    limit: 12,
    categoryId: "electronics",
  }}
/>
```

### Dynamic Event Banners

```tsx
const seasonalEvents = [
  {
    title: "Black Friday",
    subtitle: "Up to 80% off",
    backgroundColor: "bg-gradient-to-r from-black to-gray-800",
  },
  {
    title: "Cyber Monday",
    subtitle: "Tech deals galore",
    backgroundColor: "bg-gradient-to-r from-blue-600 to-purple-600",
  },
];

{
  seasonalEvents.map((event, index) => <EventBanner key={index} {...event} />);
}
```

### Conditional Rendering

```tsx
{
  hasActiveDeals && (
    <DealOfTheDay title="Deal of the Day" showCountdown={true} />
  );
}

{
  featuredProducts.length > 0 && (
    <FeaturedCollection title="Editor's Picks" layout="carousel" />
  );
}
```

## 🚀 Performance Tips

1. **Lazy Loading**: Components automatically handle loading states
2. **Image Optimization**: Use Next.js Image component for product images
3. **Caching**: Leverage Next.js caching for data fetching
4. **Code Splitting**: Components are automatically code-split
5. **SEO**: Server components provide better SEO

## 📱 Mobile Optimization

- Touch-friendly carousel navigation
- Responsive grid layouts
- Optimized button sizes for mobile
- Smooth scrolling on mobile devices
- Proper viewport handling

## 🎯 Best Practices

1. **Consistent Spacing**: Use consistent padding and margins
2. **Accessibility**: All components include proper ARIA labels
3. **Loading States**: Handle loading and error states gracefully
4. **SEO**: Use semantic HTML and proper heading hierarchy
5. **Performance**: Optimize images and minimize bundle size

## 🔄 Updates and Maintenance

These components are designed to be:

- **Maintainable**: Clean, well-documented code
- **Extensible**: Easy to add new features
- **Reusable**: Can be used across different pages
- **Testable**: Proper TypeScript types and interfaces

For questions or contributions, please refer to the project's contribution guidelines.
