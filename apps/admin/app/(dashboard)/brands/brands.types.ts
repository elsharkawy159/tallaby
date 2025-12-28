export type Locale = "en" | "ar";

export interface Brand {
  id: string;
  name: string;
  nameAr?: string | null;
  slug: string;
  slugAr?: string | null;
  logoUrl: string | null;
  description: string | null;
  descriptionAr?: string | null;
  website: string | null;
  isVerified: boolean | null;
  isOfficial: boolean | null;
  averageRating: number | null;
  reviewCount: number | null;
  productCount: number | null;
  locale?: Locale | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface BrandStats {
  total: number;
  verified: number;
  official: number;
  avgRating: number;
}

export interface BrandFormData {
  name: string;
  nameAr?: string;
  slug: string;
  slugAr?: string;
  logoUrl?: string;
  description?: string;
  descriptionAr?: string;
  website?: string;
  isVerified: boolean;
  isOfficial: boolean;
  locale?: Locale;
}

export interface BrandsPageProps {
  searchParams?: {
    locale?: Locale;
    verified?: string;
    official?: string;
    search?: string;
    page?: string;
    limit?: string;
  };
}
