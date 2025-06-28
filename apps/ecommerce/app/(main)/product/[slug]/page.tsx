import { getProduct } from "@/app/actions/products";
import ProductCard from "@/components/product/ProductCard";
import { ProductImages } from "@/components/product/ProductImages";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ProductActions } from "@/components/product/ProductActions";
import { ShippingInfo } from "@/components/product/ShippingInfo";
import { SellerInfo } from "@/components/product/SellerInfo";
import { ProductTabs } from "@/components/product/ProductTabs";
import { Separator } from "@workspace/ui/components/separator";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  images: string[];
  description: string;
  features: string[];
  sizes: string[];
  colors: Array<{ name: string; hex: string }>;
  inStock: boolean;
  seller: {
    name: string;
    rating: number;
    reviews: number;
  };
}

interface Review {
  id: number;
  user: string;
  rating: number;
  date: string;
  comment: string;
  helpful: number;
}

const ProductDetail = async ({ params }: { params: { slug: string } }) => {
  const product = await getProduct(params.slug);

  const reviews: Review[] = [
    {
      id: 1,
      user: "Sarah J.",
      rating: 5,
      date: "2 weeks ago",
      comment:
        "Amazing quality! The fabric is so soft and the fit is perfect. Highly recommended!",
      helpful: 12,
    },
    {
      id: 2,
      user: "Mike R.",
      rating: 4,
      date: "1 month ago",
      comment:
        "Good shirt overall. Size runs a bit large, so consider ordering one size smaller.",
      helpful: 8,
    },
    {
      id: 3,
      user: "Emma L.",
      rating: 5,
      date: "3 weeks ago",
      comment:
        "Love this shirt! Colors are vibrant and it maintains shape after washing.",
      helpful: 15,
    },
  ];

  const relatedProducts = [
    {
      id: "2",
      brand: "Premium Fashion",
      name: "Casual Denim Jacket",
      feature: "Classic Fit",
      model: "Denim",
      slug: "casual-denim-jacket",
      price: 89.99,
      originalPrice: 120.0,
      rating: 4.7,
      reviewCount: 89,
      image: "/png product.png",
    },
    {
      id: "3",
      brand: "Summer Collection",
      name: "Summer Floral Dress",
      feature: "Floral Print",
      model: "Maxi",
      slug: "summer-floral-dress",
      price: 59.99,
      rating: 4.3,
      reviewCount: 67,
      image: "/png product.png",
    },
    {
      id: "4",
      brand: "Classic Wear",
      name: "Classic Polo Shirt",
      feature: "Regular Fit",
      model: "Polo",
      slug: "classic-polo-shirt",
      price: 34.99,
      rating: 4.4,
      reviewCount: 95,
      image: "/png product.png",
    },
    {
      id: "5",
      brand: "Urban Style",
      name: "Striped Long Sleeve",
      feature: "Slim Fit",
      model: "Long Sleeve",
      slug: "striped-long-sleeve",
      price: 39.99,
      rating: 4.2,
      reviewCount: 73,
      image: "/png product.png",
    },
  ];

  return (
    <main className="min-h-screen flex flex-col container mx-auto py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-600 mb-6">
        <span>Home</span> / <span>Fashion</span> / <span>Men</span> /{" "}
        <span className="text-primary font-medium">{product.name}</span>
      </nav>

      <div className="flex gap-10 mb-16">
        {/* Product Images */}
        <ProductImages images={product.images} productName={product.name} />

        {/* Product Info */}
        <div className="space-y-6 flex-1">
          <ProductInfo
            name={product.name}
            price={product.price}
            originalPrice={product.originalPrice}
            rating={product.rating}
            reviewCount={product.reviewCount}
            description={product.description}
            inStock={product.inStock}
          />

          {/* Color Selection */}
          <div>
            <h3 className="font-medium mb-3">Color</h3>
            <div className="flex space-x-2">
              {product.colors.map((color) => (
                <button
                  key={color.name}
                  className={`w-8 h-8 rounded-full border-2 ${
                    product.colors[0]?.name === color.name
                      ? "border-primary"
                      : "border-gray-300"
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <h3 className="font-medium mb-3">Size</h3>
            <div className="flex space-x-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  className={`px-4 py-2 border rounded-md ${
                    product.sizes[0] === size
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          {/* <div className="flex items-center border rounded-md">
            <button
              className="p-2 hover:bg-gray-100"
              onClick={() => handleQuantityChange(-1)}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="px-4 py-2 min-w-[3rem] text-center">
              {quantity}
            </span>
            <button
              className="p-2 hover:bg-gray-100"
              onClick={() => handleQuantityChange(1)}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div> */}
        </div>
        <div className="w-[285px] rounded-4xl bg-white h-fit p-4 space-y-4">
          {/* Seller Info */}
          <SellerInfo
            name={product.seller.name}
            rating={product.seller.rating}
            reviews={product.seller.reviews}
          />
          <Separator />
          {/* Shipping Info */}
          <ShippingInfo />
          <ProductActions />
        </div>
      </div>

      {/* Product Tabs */}
      <ProductTabs
        features={product.features}
        reviews={reviews}
        reviewCount={product.reviewCount}
      />

      {/* Related Products */}
      {/* <div>
          <h2 className="text-2xl font-bold mb-8">You Might Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                brand={product.brand}
                name={product.name}
                feature={product.feature}
                model={product.model}
                slug={product.slug}
                price={product.price}
                originalPrice={product.originalPrice}
                rating={product.rating}
                reviewCount={product.reviewCount}
                image={product.image}
              />
            ))}
          </div>
        </div> */}
    </main>
  );
};

export default ProductDetail;
