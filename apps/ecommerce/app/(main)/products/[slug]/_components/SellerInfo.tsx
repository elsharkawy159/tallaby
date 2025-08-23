import { Star } from "lucide-react";

interface SellerInfoProps {
  name: string;
  rating: number;
  reviews: number;
}

export const SellerInfo = ({ name, rating, reviews }: SellerInfoProps) => {
  return (
    <div>
      <h3 className="font-medium mb-2">Sold by</h3>
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="font-bold text-primary">{name.charAt(0)}</span>
        </div>
        <div>
          <p className="font-medium">{name}</p>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm">
              {rating} ({reviews} reviews)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
