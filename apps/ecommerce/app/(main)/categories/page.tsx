import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import {
  ArrowRight,
  Shirt,
  Smartphone,
  Home,
  Gamepad2,
  Book,
  Car,
  Baby,
  Dumbbell,
  Heart,
} from "lucide-react";
import Link from "next/link";

const Categories = () => {
  const mainCategories = [
    {
      id: "fashion",
      name: "Fashion & Apparel",
      description: "Clothing, shoes, and accessories for everyone",
      icon: Shirt,
      image:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
      productCount: "50K+",
      subcategories: [
        "Women's Clothing",
        "Men's Clothing",
        "Shoes",
        "Accessories",
        "Jewelry",
      ],
    },
    {
      id: "electronics",
      name: "Electronics & Tech",
      description: "Latest gadgets, computers, and smart devices",
      icon: Smartphone,
      image:
        "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop",
      productCount: "25K+",
      subcategories: [
        "Smartphones",
        "Laptops",
        "Audio",
        "Smart Home",
        "Gaming",
      ],
    },
    {
      id: "home",
      name: "Home & Garden",
      description: "Everything for your home, garden, and lifestyle",
      icon: Home,
      image:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
      productCount: "30K+",
      subcategories: ["Furniture", "Decor", "Kitchen", "Garden", "Tools"],
    },
    {
      id: "sports",
      name: "Sports & Outdoors",
      description: "Gear for fitness, sports, and outdoor adventures",
      icon: Dumbbell,
      image:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
      productCount: "15K+",
      subcategories: [
        "Fitness",
        "Team Sports",
        "Outdoor",
        "Water Sports",
        "Winter Sports",
      ],
    },
    {
      id: "beauty",
      name: "Beauty & Personal Care",
      description: "Skincare, makeup, and personal care products",
      icon: Heart,
      image:
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop",
      productCount: "20K+",
      subcategories: [
        "Skincare",
        "Makeup",
        "Hair Care",
        "Fragrances",
        "Personal Care",
      ],
    },
    {
      id: "toys",
      name: "Toys & Games",
      description: "Fun and educational toys for all ages",
      icon: Gamepad2,
      image:
        "https://images.unsplash.com/photo-1558877385-4e9a1282e813?w=400&h=300&fit=crop",
      productCount: "12K+",
      subcategories: [
        "Action Figures",
        "Board Games",
        "Educational",
        "Outdoor Toys",
        "Video Games",
      ],
    },
    {
      id: "books",
      name: "Books & Media",
      description: "Books, magazines, movies, and educational content",
      icon: Book,
      image:
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop",
      productCount: "40K+",
      subcategories: [
        "Fiction",
        "Non-Fiction",
        "Educational",
        "Comics",
        "Audiobooks",
      ],
    },
    {
      id: "automotive",
      name: "Automotive & Parts",
      description: "Car accessories, parts, and maintenance supplies",
      icon: Car,
      image:
        "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop",
      productCount: "8K+",
      subcategories: [
        "Car Parts",
        "Accessories",
        "Tools",
        "Care Products",
        "Electronics",
      ],
    },
    {
      id: "baby",
      name: "Baby & Kids",
      description: "Everything for babies, toddlers, and children",
      icon: Baby,
      image:
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=300&fit=crop",
      productCount: "18K+",
      subcategories: ["Baby Gear", "Clothing", "Toys", "Feeding", "Safety"],
    },
  ];

  const featuredBrands = [
    "Nike",
    "Apple",
    "Samsung",
    "Sony",
    "Adidas",
    "H&M",
    "IKEA",
    "L'Oréal",
  ];

  return (
    <>
      <DynamicBreadcrumb />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Explore All Categories
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Discover millions of products across hundreds of categories from
              trusted sellers worldwide
            </p>
            <Badge className="bg-accent text-black text-lg px-4 py-2">
              200+ Categories Available
            </Badge>
          </div>
        </section>

        {/* Main Categories Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Shop by Category</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Find exactly what you're looking for in our organized category
                structure
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mainCategories.map((category) => (
                <div key={category.id} className="group">
                  <Link href={`/category/${category.id}`}>
                    <div className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                      <div className="relative overflow-hidden">
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-white text-primary">
                            {category.productCount} Products
                          </Badge>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                            <category.icon className="h-5 w-5 text-white" />
                          </div>
                          <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                            {category.name}
                          </h3>
                        </div>

                        <p className="text-gray-600 mb-4">
                          {category.description}
                        </p>

                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2">
                            Popular Subcategories:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {category.subcategories
                              .slice(0, 3)
                              .map((sub, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {sub}
                                </Badge>
                              ))}
                            {category.subcategories.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{category.subcategories.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            className="group-hover:bg-primary group-hover:text-white transition-colors"
                          >
                            Browse Category
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Brands */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Featured Brands</h2>
              <p className="text-gray-600">Shop from your favorite brands</p>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              {featuredBrands.map((brand, index) => (
                <div
                  key={index}
                  className="bg-white px-6 py-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <span className="font-bold text-gray-700">{brand}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="bg-primary text-white rounded-2xl p-8 md:p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Can't Find What You're Looking For?
              </h2>
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                Use our advanced search or contact our customer service team for
                personalized assistance
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/products">
                  <Button
                    size="lg"
                    className="bg-accent text-black hover:bg-accent/90"
                  >
                    Advanced Search
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-primary"
                  >
                    Contact Support
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Categories;
