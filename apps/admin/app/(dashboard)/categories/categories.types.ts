export interface Category {
  id: string;
  name: string | null;
  slug: string | null;
  parentId: string | null;
  level: number | null;
  imageUrl: string | null;
  locale: "en" | "ar";
  productCount: number;
  childrenCount: number;
  createdAt: string;
  updatedAt: string | null;
  shopifyId: string | null;
  // When columns are added to database:
  // description?: string | null;
  // isActive?: boolean;
  // showInMenu?: boolean;
  // displayOrder?: number;
}

export interface CategoryNode extends Category {
  children: CategoryNode[];
  parent?: Category | null;
}

export interface CategoryStats {
  totalCategories: number;
  rootCategories: number;
  subCategories: number;
}

export interface CategoriesPageProps {
  searchParams?: {
    locale?: "en" | "ar";
    search?: string;
    page?: string;
    limit?: string;
  };
}

export interface CategoryFormData {
  name: string;
  slug: string;
  parentId: string | null;
  locale: "en" | "ar";
  imageUrl: string | null;
  description?: string | null;
}
