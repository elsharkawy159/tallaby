
import Link from "next/link";
import { ScrollArea, ScrollBar } from "@workspace/ui/components/scroll-area";

interface Category {
  id: string;
  name: string;
  slug: string;
  subcategories?: Category[];
}

const CategoryNav = () => {

  // Demo categories data
  const categories: Category[] = [
    {
      id: "1",
      name: "Electronics",
      slug: "electronics",
    },
    {
      id: "2",
      name: "Fashion",
      slug: "fashion",
    },
    {
      id: "3",
      name: "Home & Garden",
      slug: "home-garden",
    },
    {
      id: "4",
      name: "Sports & Outdoors",
      slug: "sports-outdoors",
    },
    {
      id: "5",
      name: "Health & Beauty",
      slug: "health-beauty",
    },
    {
      id: "6",
      name: "Books & Media",
      slug: "books-media",
    },
    {
      id: "7",
      name: "Toys & Games",
      slug: "toys-games",
    },
    {
      id: "8",
      name: "Automotive",
      slug: "automotive",
    },
    {
      id: "9",
      name: "Groceries",
      slug: "groceries",
    },
    {
      id: "10",
      name: "Baby & Kids",
      slug: "baby-kids",
    },

  ];

  return (
    <ScrollArea className="hidden lg:flex justify-center items-center gap-x-7 overflow-x-auto w-full">
      <div className="flex justify-center gap-x-7 px-1">
        {categories.map((category) => (
          <div key={category.id} className="relative group text-sm lg:text-base">
            <Link
              href={`/category/${category.slug}`}
              className="text-white font-medium whitespace-nowrap"
            >
              <span>{category.name}</span>
            </Link>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" className="-bottom-5" />
    </ScrollArea>
  );
};

export default CategoryNav;
