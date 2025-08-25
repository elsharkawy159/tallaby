export interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export interface Product {
  id: string;
  title: string;
  slug?: string;
  base_price: number;
  sale_price?: number;
  average_rating: number;
  review_count: number;
  description: string;
  bulletPoints: string[];
  isActive: boolean;
  isBuyBox: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isPlatformChoice: boolean;
  images: string[];
  brand: {
    name: string;
  };
  category: {
    name: string;
  };

}

export interface Review {
  id: string;
  user: string;
  rating: number;
  date: string;
  comment: string;
  helpful: number;
  userAvatar?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  isExpanded?: boolean;
}
