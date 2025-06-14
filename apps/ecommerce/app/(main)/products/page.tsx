"use client";
import { useState, useEffect } from "react";
// import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/product/ProductCard";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Slider } from "@workspace/ui/components/slider";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Filter, Grid, List, Search } from "lucide-react";

interface Product {
  id: string;
  title: string;
  slug: string;
  base_price: number;
  average_rating: number;
  review_count: number;
  images: Array<{
    url: string;
    alt_text: string;
  }>;
  brand?: {
    name: string;
  };
  category?: {
    name: string;
  };
}

const Products = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [products, setProducts] = useState<Product[]>([]);
  // const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  // useEffect(() => {
  //   fetchProducts();
  //   fetchCategories();
  //   fetchBrands();
  // }, [searchQuery, sortBy, selectedCategories, priceRange]);

  // // const fetchProducts = async () => {
  // //   setLoading(true);

  // //   let query = supabase
  // //     .from("products")
  // //     .select(
  // //       `
  // //       id,
  // //       title,
  // //       slug,
  // //       base_price,
  // //       average_rating,
  // //       review_count,
  // //       product_images!inner (url, alt_text, is_primary),
  // //       brands (name),
  // //       categories!products_main_category_id_categories_id_fk (name)
  // //     `
  // //     )
  // //     .eq("is_active", true)
  // //     .eq("product_images.is_primary", true)
  // //     .gte("base_price", priceRange[0])
  // //     .lte("base_price", priceRange[1]);

  // //   if (searchQuery) {
  // //     query = query.ilike("title", `%${searchQuery}%`);
  // //   }

  // //   if (selectedCategories.length > 0) {
  // //     query = query.in("main_category_id", selectedCategories);
  // //   }

  // //   // Add sorting
  // //   switch (sortBy) {
  // //     case "price-low":
  // //       query = query.order("base_price", { ascending: true });
  // //       break;
  // //     case "price-high":
  // //       query = query.order("base_price", { ascending: false });
  // //       break;
  // //     case "rating":
  // //       query = query.order("average_rating", { ascending: false });
  // //       break;
  // //     case "newest":
  // //       query = query.order("created_at", { ascending: false });
  // //       break;
  // //     default:
  // //       query = query.order("review_count", { ascending: false });
  // //   }

  // //   const { data, error } = await query;

  // //   if (error) {
  // //     console.error("Error fetching products:", error);
  // //   } else {
  // //     const transformedProducts =
  // //       data?.map((product) => ({
  // //         ...product,
  // //         images: product.product_images || [],
  // //         brand: product.brands,
  // //         category: product.categories,
  // //       })) || [];
  // //     setProducts(transformedProducts);
  // //   }
  // //   setLoading(false);
  // // };

  // const fetchCategories = async () => {
  //   const { data, error } = await supabase
  //     .from("categories")
  //     .select("id, name")
  //     .eq("is_active", true);

  //   if (!error && data) {
  //     setCategories(data);
  //   }
  // };

  // const fetchBrands = async () => {
  //   const { data, error } = await supabase
  //     .from("brands")
  //     .select("id, name")
  //     .eq("is_verified", true);

  //   if (!error && data) {
  //     setBrands(data);
  //   }
  // };

  // const handleCategoryChange = (categoryId: string, checked: boolean) => {
  //   if (checked) {
  //     setSelectedCategories([...selectedCategories, categoryId]);
  //   } else {
  //     setSelectedCategories(
  //       selectedCategories.filter((id) => id !== categoryId)
  //     );
  //   }
  // };

  // const resetFilters = () => {
  //   setSelectedCategories([]);
  //   setPriceRange([0, 500]);
  //   setSearchQuery("");
  // };

  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex flex-col">
  //
  //       <div className="flex-1 flex items-center justify-center">
  //         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  //       </div>
  //
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600 mb-6">
          <span>Home</span> /{" "}
          <span className="text-primary font-medium">All Products</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">All Products</h1>
            <p className="text-gray-600">Showing {products.length} results</p>
          </div>

          {/* View Controls */}
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Most Popular</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside
            className={`lg:w-64 ${showFilters ? "block" : "hidden lg:block"}`}
          >
            <div className="space-y-6">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Search Products
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="font-medium mb-3">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={category.id}
                        checked={selectedCategories.includes(category.id)}
                        // onCheckedChange={(checked) =>
                        //   handleCategoryChange(category.id, checked as boolean)
                        // }
                      />
                      <label
                        htmlFor={category.id}
                        className="text-sm cursor-pointer"
                      >
                        {category.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="font-medium mb-3">Price Range</h3>
                <div className="px-2">
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={500}
                    step={10}
                    className="mb-4"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Reset Filters */}
              <Button
                variant="outline"
                className="w-full"
                // onClick={resetFilters}
              >
                Reset Filters
              </Button>
            </div>
          </aside>

          {/* Products Grid/List */}
          <div className="flex-1">
            <div
              className={`grid gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1"
              }`}
            >
              {/* {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.title}
                  slug={product.slug}
                  price={product.base_price}
                  rating={product.average_rating || 0}
                  reviewCount={product.review_count || 0}
                  image={product.images[0]?.url || "/placeholder.svg"}
                />
              ))} */}
            </div>

            {products.length === 0 && (
              <div className="text-center py-16">
                <h2 className="text-2xl font-semibold text-gray-600 mb-2">
                  No products found
                </h2>
                <p className="text-gray-500">
                  Try adjusting your filters or search terms
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Products;
