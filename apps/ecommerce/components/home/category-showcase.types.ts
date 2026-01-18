export interface Category {
  id: string;
  name: string | null;
  nameAr?: string | null;
  slug: string | null;
  productCount: number;
}

export interface CategoryWithRequiredFields {
  id: string;
  name: string;
  nameAr?: string | null;
  slug: string;
  productCount: number;
}

export interface CategoryShowcaseProps {
  className?: string;
  limit?: number;
}

export interface CategoryShowcaseClientProps {
  categories: CategoryWithRequiredFields[];
  className?: string;
}
