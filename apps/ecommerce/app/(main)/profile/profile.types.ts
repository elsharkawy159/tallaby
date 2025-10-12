export type UserRole = "customer" | "seller" | "admin";

// Supabase User type from the auth response
export interface SupabaseUser {
  id: string;
  aud: string;
  role: string;
  email: string;
  email_confirmed_at?: string | null;
  phone?: string | null;
  confirmation_sent_at?: string | null;
  confirmed_at?: string | null;
  last_sign_in_at?: string | null;
  app_metadata: {
    provider: string;
    providers: string[];
  };
  user_metadata: {
    avatar_url?: string;
    email?: string;
    email_verified?: boolean;
    firstName?: string;
    fullName?: string;
    full_name?: string;
    iss?: string;
    lastName?: string;
    name?: string;
    phone_verified?: boolean;
    picture?: string;
    provider_id?: string;
    sub?: string;
  };
  identities: Array<{
    identity_id: string;
    id: string;
    user_id: string;
    identity_data: Record<string, any>;
    provider: string;
    last_sign_in_at: string;
    created_at: string;
    updated_at: string;
    email: string;
  }>;
  created_at: string;
  updated_at: string;
  is_anonymous: boolean;
}

export interface Seller {
  id: string;
  displayName: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  returnPolicy: string | null;
  shippingPolicy: string | null;
  storeRating: number | null;
  positiveRatingPercent: number | null;
  totalRatings: number;
  productCount: number;
  isVerified: boolean;
  joinDate: string | null;
  status?: "pending" | "approved" | "suspended" | "restricted";
}

// Our internal User type for the application - matches database schema exactly
export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  phone: string | null;
  role: UserRole;
  avatarUrl: string | null;
  isVerified: boolean;
  isSuspended: boolean;
  lastLoginAt: string | null;
  timezone: string | null;
  preferredLanguage: string;
  referralCode: string | null;
  referredBy: string | null;
  defaultCurrency: string;
  receiveMarketingEmails: boolean;
  hasTwoFactorAuth: boolean;
  twoFactorMethod: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AddressType = "billing" | "shipping" | "both";

export interface UserAddress {
  id: string;
  userId: string;
  addressType: AddressType;
  fullName: string;
  phone: string;
  company?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  isBusinessAddress: boolean;
  deliveryInstructions?: string | null;
  accessCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Wishlist {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  isPublic: boolean;
  shareUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
}

export interface WishlistItem {
  id: string;
  wishlistId: string;
  productId: string;
  variantId?: string | null;
  addedAt: string;
  notes?: string | null;
  quantity: number;
  priority: number;
  product?: {
    name: string;
    slug: string;
    imageUrl?: string;
    price: number;
  };
}

// Form data types
export interface ProfileFormData {
  fullName: string;
  phone: string;
  timezone: string;
  preferredLanguage: string;
  defaultCurrency: string;
  receiveMarketingEmails: boolean;
}

export interface AddressFormData {
  addressType: AddressType;
  fullName: string;
  phone: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  isBusinessAddress: boolean;
  deliveryInstructions?: string;
  accessCode?: string;
}

export interface SecurityFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  hasTwoFactorAuth: boolean;
  twoFactorMethod?: string;
}

// UI State types
export interface ProfileTabType {
  id: "profile" | "orders" | "addresses" | "wishlist" | "security";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

export interface ProfileLayoutProps {
  children: React.ReactNode;
  activeTab: ProfileTabType["id"];
}

// API Response types
export interface ProfileUpdateResult {
  success: boolean;
  message: string;
  user?: User;
  errors?: Record<string, string[]>;
}

export interface AddressActionResult {
  success: boolean;
  message: string;
  address?: UserAddress;
  errors?: Record<string, string[]>;
}

export interface WishlistActionResult {
  success: boolean;
  message: string;
  wishlist?: Wishlist;
  errors?: Record<string, string[]>;
}
