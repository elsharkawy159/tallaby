import { LucideIcon } from "lucide-react";

// Benefit item interface
export interface Benefit {
  icon: any;
  title: string;
  description: string;
}

// Statistics item interface
export interface Stat {
  label: string;
  value: string;
  description: string;
}

// Testimonial interface
export interface Testimonial {
  name: string;
  business: string;
  image: string;
  rating: number;
  text: string;
}

// Pricing plan interface
export interface PricingPlan {
  name: string;
  price: string;
  description: string;
  features: string[];
  recommended: boolean;
}

// Form data interface (matches Zod schema) - SIMPLIFIED
export interface SellerApplicationData {
  businessName: string;
  businessType: string;
  supportEmail: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  acceptTerms: boolean;
}

// Component props interfaces
export interface BenefitsSectionProps {
  benefits: Benefit[];
}

export interface StatsSectionProps {
  stats: Stat[];
}

export interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export interface PricingSectionProps {
  plans: PricingPlan[];
}

export interface ApplicationFormProps {
  onSuccess?: () => void;
}

// Server action result interface
export interface SellerApplicationResult {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  data?: {
    sellerId: string;
  };
}

// Category options
export const PRODUCT_CATEGORIES = [
  { value: "fashion", label: "Fashion & Apparel" },
  { value: "electronics", label: "Electronics & Tech" },
  { value: "home", label: "Home & Garden" },
  { value: "sports", label: "Sports & Outdoors" },
  { value: "beauty", label: "Beauty & Personal Care" },
  { value: "toys", label: "Toys & Games" },
  { value: "books", label: "Books & Media" },
  { value: "automotive", label: "Automotive" },
  { value: "other", label: "Other" },
] as const;

// Experience options
export const EXPERIENCE_OPTIONS = [
  { value: "new", label: "New to selling" },
  { value: "1year", label: "Less than 1 year" },
  { value: "1-3years", label: "1-3 years" },
  { value: "3-5years", label: "3-5 years" },
  { value: "5plus", label: "5+ years" },
] as const;

// Business type options
export const BUSINESS_TYPE_OPTIONS = [
  { value: "individual", label: "Individual/Sole Proprietor" },
  { value: "company", label: "Company/LLC" },
  { value: "partnership", label: "Partnership" },
  { value: "corporation", label: "Corporation" },
] as const;

// Country options (common countries)
export const COUNTRY_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "IT", label: "Italy" },
  { value: "ES", label: "Spain" },
  { value: "NL", label: "Netherlands" },
  { value: "SE", label: "Sweden" },
  { value: "NO", label: "Norway" },
  { value: "DK", label: "Denmark" },
  { value: "FI", label: "Finland" },
  { value: "JP", label: "Japan" },
  { value: "KR", label: "South Korea" },
  { value: "SG", label: "Singapore" },
  { value: "EG", label: "Egypt" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "IN", label: "India" },
  { value: "BR", label: "Brazil" },
  { value: "MX", label: "Mexico" },
  { value: "OTHER", label: "Other" },
] as const;
