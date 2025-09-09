export interface Category {
  id: string;
  name: string | null;
  slug: string | null;
  productCount: number;
}

export interface CategoryWithRequiredFields {
  id: string;
  name: string;
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
