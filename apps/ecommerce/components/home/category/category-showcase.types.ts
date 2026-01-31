export interface Category {
  id: string;
  name: string | null;
  nameAr?: string | null;
  slug: string | null;
  imageUrl?: string | null;
  fallbackImageUrl?: string | null;
  productCount: number;
}

export interface CategoryWithRequiredFields {
  id: string;
  name: string;
  nameAr?: string | null;
  slug: string;
  imageUrl?: string | null;
  fallbackImageUrl?: string | null;
  productCount: number;
}

export interface CategoryShowcaseProps {
  className?: string;
}

export interface CategoryShowcaseClientProps {
  categories: CategoryWithRequiredFields[];
  className?: string;
}
