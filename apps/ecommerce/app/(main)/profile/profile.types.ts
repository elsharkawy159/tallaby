export type UserRole = "customer" | "seller" | "admin";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  avatar?: string | null;
  isVerified: boolean;
  isSuspended: boolean;
  lastLoginAt?: string | null;
  timezone?: string | null;
  preferredLanguage: string;
  referralCode?: string | null;
  referredBy?: string | null;
  defaultCurrency: string;
  receiveMarketingEmails: boolean;
  hasTwoFactorAuth: boolean;
  twoFactorMethod?: string | null;
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
  firstName: string;
  lastName: string;
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
