import { Star } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";

interface Review {
  id: number;
  user: string;
  rating: number;
  date: string;
  comment: string;
  helpful: number;
}

interface ProductTabsProps {
  features: string[];
  reviews: Review[];
  reviewCount: number;
}

export const ProductTabs = ({
  features,
  reviews,
  reviewCount,
}: ProductTabsProps) => {
  return (
    <Tabs defaultValue="overview" className="mb-16">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="reviews">Reviews ({reviewCount})</TabsTrigger>
        <TabsTrigger value="qa">Q&A</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <div className="prose max-w-none">
          <h3 className="text-xl font-bold mb-4">Product Features</h3>
          <ul className="list-disc list-inside space-y-2">
            {features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>

          <h3 className="text-xl font-bold mt-8 mb-4">Care Instructions</h3>
          <p>
            Machine wash cold with like colors. Tumble dry low. Do not bleach.
            Cool iron if needed.
          </p>
        </div>
      </TabsContent>

      <TabsContent value="reviews" className="mt-6">
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{review.user}</span>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-sm text-gray-500">{review.date}</span>
              </div>
              <p className="text-gray-600 mb-2">{review.comment}</p>
              <button className="text-sm text-gray-500 hover:text-gray-700">
                Helpful ({review.helpful})
              </button>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="qa" className="mt-6">
        <div className="text-center py-12">
          <p className="text-gray-500">
            No questions yet. Be the first to ask!
          </p>
          <Button className="mt-4">Ask a Question</Button>
        </div>
      </TabsContent>
    </Tabs>
  );
};
