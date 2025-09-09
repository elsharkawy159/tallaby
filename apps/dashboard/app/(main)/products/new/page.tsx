import AddProductMultiStep from "./add-product-multi-step";
import { getAllCategories } from "@/actions/categories";
import { getAllBrands } from "@/actions/brands";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ page?: string; id?: string }>;
}

// Main page component
export default async function AddProductPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const isEditMode =
    resolvedSearchParams.page === "edit" && resolvedSearchParams.id;
  const productId = resolvedSearchParams.id;

  // Fetch categories and brands in parallel
  const [categories, brands] = await Promise.all([
    getAllCategories(),
    getAllBrands(),
  ]);
  console.log("categories", categories);
  console.log("brands", brands);
  // console.log("categories", categories);
  // console.log("brands", brands);
  // Handle errors
  // if (!categories.success || !brands.success) {

  // }

  // const categories: CategoryOption[] = categories.data || "";
  // const brands: BrandOption[] = brands.data || "";

  // Fetch product data if in edit mode
  let productData = null;
  if (isEditMode && productId) {
    // const productResult = await getProduct(productId);
    // if (productResult.success) {
    //   productData = productResult.data;
    // }
  }

  return (
    <AddProductMultiStep
      categories={categories.data as any}
      brands={brands.data as any}
      isEditMode={!!isEditMode}
      productId={productId}
      initialData={productData}
    />
  );
}

// Metadata for the page
export const metadata = {
  title: "Add New Product | Dashboard",
  description: "Create a new product listing for your store",
};

{
  /*
  [
    {
        "id": "aabb1725-4651-47a2-8249-07feaacf8e00",
        "name": "Adidas",
        "slug": "adidas",
        "logoUrl": "https://example.com/adidas-logo.png",
        "description": "Sports performance apparel",
        "website": null,
        "isVerified": true,
        "isOfficial": true,
        "averageRating": null,
        "reviewCount": 0,
        "productCount": 0,
        "createdAt": "2025-08-25 22:05:13.626611+00",
        "updatedAt": "2025-08-25 22:05:13.626611+00"
    },
    {
        "id": "c811ffff-8857-43c8-a0aa-823935b1aaaa",
        "name": "Apple",
        "slug": "apple",
        "logoUrl": "https://example.com/apple-logo.png",
        "description": "Technology and innovation leader",
        "website": null,
        "isVerified": true,
        "isOfficial": true,
        "averageRating": null,
        "reviewCount": 0,
        "productCount": 0,
        "createdAt": "2025-08-25 22:05:13.626611+00",
        "updatedAt": "2025-08-25 22:05:13.626611+00"
    },
    {
        "id": "e5ed740a-e18e-4a84-a986-c721818a965a",
        "name": "FashionWorld",
        "slug": "fashion-world",
        "logoUrl": "https://example.com/fashion-logo.png",
        "description": "Latest fashion trends",
        "website": null,
        "isVerified": false,
        "isOfficial": false,
        "averageRating": null,
        "reviewCount": 0,
        "productCount": 0,
        "createdAt": "2025-07-25 00:52:28.097785+00",
        "updatedAt": "2025-07-25 00:52:28.097785+00"
    },
    {
        "id": "410b26ff-bb42-4f0f-9026-872a3da746b8",
        "name": "HomeComfort",
        "slug": "home-comfort",
        "logoUrl": "https://example.com/homecomfort-logo.png",
        "description": "Quality home and living products",
        "website": null,
        "isVerified": false,
        "isOfficial": false,
        "averageRating": null,
        "reviewCount": 0,
        "productCount": 0,
        "createdAt": "2025-07-25 00:52:28.097785+00",
        "updatedAt": "2025-07-25 00:52:28.097785+00"
    },
    {
        "id": "b9c2454c-cb73-4444-b411-b8462ce78f4e",
        "name": "Nike",
        "slug": "nike",
        "logoUrl": "https://example.com/nike-logo.png",
        "description": "Athletic and casual wear",
        "website": null,
        "isVerified": true,
        "isOfficial": true,
        "averageRating": null,
        "reviewCount": 0,
        "productCount": 0,
        "createdAt": "2025-08-25 22:05:13.626611+00",
        "updatedAt": "2025-08-25 22:05:13.626611+00"
    },
    {
        "id": "c8395e19-ecff-481e-b8b0-fef882dc05eb",
        "name": "Samsung",
        "slug": "samsung",
        "logoUrl": "https://example.com/samsung-logo.png",
        "description": "Global electronics manufacturer",
        "website": null,
        "isVerified": true,
        "isOfficial": true,
        "averageRating": null,
        "reviewCount": 0,
        "productCount": 0,
        "createdAt": "2025-08-25 22:05:13.626611+00",
        "updatedAt": "2025-08-25 22:05:13.626611+00"
    },
    {
        "id": "62b45647-24db-4b5b-aef2-9b89a58d430c",
        "name": "SportsPro",
        "slug": "sports-pro",
        "logoUrl": "https://example.com/sportspro-logo.png",
        "description": "Professional sports equipment",
        "website": null,
        "isVerified": false,
        "isOfficial": false,
        "averageRating": null,
        "reviewCount": 0,
        "productCount": 0,
        "createdAt": "2025-07-25 00:52:28.097785+00",
        "updatedAt": "2025-07-25 00:52:28.097785+00"
    },
    {
        "id": "d9193701-a937-43a8-ac03-544a55b1b776",
        "name": "TechGear",
        "slug": "techgear",
        "logoUrl": "https://example.com/techgear-logo.png",
        "description": "Innovative technology products",
        "website": null,
        "isVerified": false,
        "isOfficial": false,
        "averageRating": null,
        "reviewCount": 0,
        "productCount": 0,
        "createdAt": "2025-07-25 00:52:28.097785+00",
        "updatedAt": "2025-07-25 00:52:28.097785+00"
    }
]
  */
}
