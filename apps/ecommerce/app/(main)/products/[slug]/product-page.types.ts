export interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  description: string;
  features: string[];
  inStock: boolean;
  seller: {
    name: string;
    rating: number;
    reviews: number;
  };
  images: string[];
  colors: Array<{ name: string; hex: string }>;
  sizes: string[];
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
