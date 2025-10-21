export interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  price: {
    base?: number;
    list: number;
    final: number;
    discountType?: string;
    discountValue?: number;
  };
  averageRating: number;
  reviewCount: number;
  description: string;
  bulletPoints: string[];
  isActive: boolean;
  isBuyBox: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isPlatformChoice: boolean;
  images: string[];
  brand: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  seller: {
    id: string;
    name: string;
    slug: string;
    reviewsCount?: number;
    isVerified?: boolean;
    totalRatings?: number;
    positiveRatingPercent?: number;
  };
  quantity: boolean;
  stockCount?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
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
