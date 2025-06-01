import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  subcategories?: Category[];
}

const CategoryNav = () => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Demo categories data
  const categories: Category[] = [
    {
      id: "1",
      name: "Electronics",
      slug: "electronics",
      subcategories: [
        { id: "11", name: "Smartphones", slug: "smartphones" },
        { id: "12", name: "Laptops", slug: "laptops" },
        { id: "13", name: "Headphones", slug: "headphones" },
        { id: "14", name: "Cameras", slug: "cameras" },
        { id: "15", name: "Gaming", slug: "gaming" },
      ],
    },
    {
      id: "2",
      name: "Fashion",
      slug: "fashion",
      subcategories: [
        { id: "21", name: "Men's Clothing", slug: "mens-clothing" },
        { id: "22", name: "Women's Clothing", slug: "womens-clothing" },
        { id: "23", name: "Shoes", slug: "shoes" },
        { id: "24", name: "Accessories", slug: "accessories" },
        { id: "25", name: "Jewelry", slug: "jewelry" },
      ],
    },
    {
      id: "3",
      name: "Home & Garden",
      slug: "home-garden",
      subcategories: [
        { id: "31", name: "Furniture", slug: "furniture" },
        { id: "32", name: "Kitchen", slug: "kitchen" },
        { id: "33", name: "Garden", slug: "garden" },
        { id: "34", name: "Decor", slug: "decor" },
        { id: "35", name: "Tools", slug: "tools" },
      ],
    },
    {
      id: "4",
      name: "Sports & Outdoors",
      slug: "sports-outdoors",
      subcategories: [
        { id: "41", name: "Fitness Equipment", slug: "fitness-equipment" },
        { id: "42", name: "Outdoor Gear", slug: "outdoor-gear" },
        { id: "43", name: "Team Sports", slug: "team-sports" },
        { id: "44", name: "Water Sports", slug: "water-sports" },
        { id: "45", name: "Winter Sports", slug: "winter-sports" },
      ],
    },
    {
      id: "5",
      name: "Health & Beauty",
      slug: "health-beauty",
      subcategories: [
        { id: "51", name: "Skincare", slug: "skincare" },
        { id: "52", name: "Makeup", slug: "makeup" },
        { id: "53", name: "Hair Care", slug: "hair-care" },
        { id: "54", name: "Fragrances", slug: "fragrances" },
        { id: "55", name: "Vitamins", slug: "vitamins" },
      ],
    },
    {
      id: "6",
      name: "Books & Media",
      slug: "books-media",
      subcategories: [
        { id: "61", name: "Fiction", slug: "fiction" },
        { id: "62", name: "Non-Fiction", slug: "non-fiction" },
        { id: "63", name: "Educational", slug: "educational" },
        { id: "64", name: "Comics", slug: "comics" },
        { id: "65", name: "Audiobooks", slug: "audiobooks" },
      ],
    },
    {
      id: "7",
      name: "Toys & Games",
      slug: "toys-games",
      subcategories: [
        { id: "71", name: "Action Figures", slug: "action-figures" },
        { id: "72", name: "Board Games", slug: "board-games" },
        { id: "73", name: "Educational Toys", slug: "educational-toys" },
        { id: "74", name: "Outdoor Toys", slug: "outdoor-toys" },
        { id: "75", name: "Video Games", slug: "video-games" },
      ],
    },
    {
      id: "8",
      name: "Automotive",
      slug: "automotive",
      subcategories: [
        { id: "81", name: "Car Parts", slug: "car-parts" },
        { id: "82", name: "Accessories", slug: "car-accessories" },
        { id: "83", name: "Tools", slug: "auto-tools" },
        { id: "84", name: "Care Products", slug: "car-care" },
        { id: "85", name: "Electronics", slug: "car-electronics" },
      ],
    },
  ];

  return (
    <nav className="hidden lg:flex justify-center items-center space-x-8">
      {categories.map((category) => (
        <div
          key={category.id}
          className="relative group text-sm"
          onMouseEnter={() => setHoveredCategory(category.id)}
          onMouseLeave={() => setHoveredCategory(null)}
        >
          <Link
            href={`/category/${category.slug}`}
            className="flex items-center space-x-1 text-gray-700 hover:text-primary transition-colors font-medium"
          >
            <span>{category.name}</span>
            {category.subcategories && category.subcategories.length > 0 && (
              <ChevronDown className="h-4 w-4" />
            )}
          </Link>

          {/* Dropdown Menu */}
          {category.subcategories &&
            category.subcategories.length > 0 &&
            hoveredCategory === category.id && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="py-2">
                  <Link
                    href={`/category/${category.slug}`}
                    className="block px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                  >
                    All {category.name}
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  {category.subcategories.map((subcategory) => (
                    <Link
                      key={subcategory.id}
                      href={`/category/${subcategory.slug}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary"
                    >
                      {subcategory.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
        </div>
      ))}
    </nav>
  );
};

export default CategoryNav;
