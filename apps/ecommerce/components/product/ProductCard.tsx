import { Heart, Star } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import Link from "next/link";
import Image from "next/image";

interface ProductCardProps {
  id: string;
  brand: string;
  name: string;
  feature: string;
  model: string;
  slug: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
}

const ProductCard = ({
  name,
  slug,
  price,
  rating,
  reviewCount,
  image,
}: ProductCardProps) => {
  return (
    <Card className="group bg-white shadow-sm border-0 p-0 relative w-[285px] overflow-hidden rounded-[8px_8px_0_8px]">
      <CardContent className="p-2">
        {/* Product Image */}
        <div className="relative rounded-md overflow-hidden">
          <Link href={`/product/${slug}`}>
            <Image
              src={image}
              alt={name}
              width={270}
              height={310}
              className="w-full bg-gray-100 aspect-[2.6/3] h-full object-cover"
              priority
            />
          </Link>

          {/* Wishlist Button */}
          <button className="absolute top-3 right-3  rounded-full">
            <Heart className="size-5 text-gray-600" />
          </button>

          {/* Image Carousel Dots */}
          {/* <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            {[1, 2, 3].map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === 0 ? "bg-primary" : "bg-white/60"
                }`}
              />
            ))}
          </div> */}
        </div>

        {/* Product Info */}
        <div className="space-y-2 mt-2.5">
          <div className="flex items-center gap-4.5 justify-between mb-2">
            <h3 className="text-base font-medium line-clamp-1">{name}</h3>
            <span className="text-lg font-semibold">{price}$</span>
          </div>

          {/* Rating */}
          <div className="flex text-sm items-center gap-1">
            <span className="font-medium">{rating}</span>
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-gray-500">({reviewCount})</span>
          </div>

          {/* Add to Cart Button */}
          <Button className="absolute text-sm bottom-0 right-0 font-bold py-2.5 rounded-none [clip-path:polygon(17%_0,100%_0,100%_100%,0_100%,20_20%)] pl-10">
            Add to cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
