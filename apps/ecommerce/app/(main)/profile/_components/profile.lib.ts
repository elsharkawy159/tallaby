import { UserAddress, ProfileTabType } from "./profile.types";
import { User as UserIcon, Package, Heart, MapPin } from "lucide-react";

// Profile navigation tabs
export const profileTabs: ProfileTabType[] = [
  {
    id: "profile",
    label: "Profile",
    icon: UserIcon,
    href: "/profile",
  },
  {
    id: "orders",
    label: "Orders",
    icon: Package,
    href: "/profile/orders",
  },
  {
    id: "addresses",
    label: "Addresses",
    icon: MapPin,
    href: "/profile/addresses",
  },
  {
    id: "wishlist",
    label: "Wishlist",
    icon: Heart,
    href: "/profile/wishlist",
  },
];

// Timezone options
export const timezoneOptions = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Africa/Cairo", label: "Cairo (EET)" },
  { value: "Australia/Sydney", label: "Sydney (AEDT)" },
];

// Language options
export const languageOptions = [
  { value: "en", label: "English" },
  { value: "ar", label: "العربية (Arabic)" },
  // { value: "es", label: "Español (Spanish)" },
  // { value: "fr", label: "Français (French)" },
  // { value: "de", label: "Deutsch (German)" },
  // { value: "zh", label: "中文 (Chinese)" },
  // { value: "ja", label: "日本語 (Japanese)" },
  // { value: "ru", label: "Русский (Russian)" },
];

// Currency options
export const currencyOptions = [
  { value: "EGP", label: "EGP - Egyptian Pound" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "SAR", label: "SAR - Saudi Riyal" },
  { value: "AED", label: "AED - UAE Dirham" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "CNY", label: "CNY - Chinese Yuan" },
];

// Country options (commonly used countries)
export const countryOptions = [
  { value: "Egypt", label: "Egypt" },
  { value: "United States", label: "United States" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Canada", label: "Canada" },
  { value: "Australia", label: "Australia" },
  { value: "Germany", label: "Germany" },
  { value: "France", label: "France" },
  { value: "Saudi Arabia", label: "Saudi Arabia" },
  { value: "United Arab Emirates", label: "United Arab Emirates" },
  { value: "Jordan", label: "Jordan" },
  { value: "Lebanon", label: "Lebanon" },
  { value: "Kuwait", label: "Kuwait" },
  { value: "Qatar", label: "Qatar" },
  { value: "Bahrain", label: "Bahrain" },
  { value: "Oman", label: "Oman" },
];

// Two-factor authentication method options
export const twoFactorMethodOptions = [
  { value: "sms", label: "SMS Text Message" },
  { value: "email", label: "Email" },
  { value: "authenticator", label: "Authenticator App" },
  { value: "backup_codes", label: "Backup Codes" },
];

export function getAvatarUrl(
  avatarPath: string | null | undefined
): string | null {
  if (!avatarPath || typeof avatarPath !== "string" || !avatarPath.trim()) {
    return null;
  }

  const trimmedPath = avatarPath.trim();

  if (
    trimmedPath.startsWith("https://lh3.googleusercontent.com") ||
    trimmedPath.startsWith("https://platform-lookaside.fbsbx.com") ||
    trimmedPath.startsWith("https://graph.facebook.com") ||
    trimmedPath.startsWith("https://avatars.githubusercontent.com") ||
    trimmedPath.startsWith("https://pbs.twimg.com") ||
    trimmedPath.startsWith("http://") ||
    trimmedPath.startsWith("https://")
  ) {
    return trimmedPath;
  }

  return getImageUrl(trimmedPath, "avatars");
}

function getImageUrl(url: string, bucket: string = "avatars"): string {
  const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
  if (!projectId) {
    console.warn("NEXT_PUBLIC_SUPABASE_PROJECT_ID is not defined");
    return url;
  }
  return `https://${projectId}.supabase.co/storage/v1/object/public/${bucket}/${url}?format=WebP&quality=75`;
}

export function getUserAvatar(user: any): string | null {
  if (!user) return null;

  let avatarPath: string | null = null;

  if (user.user_metadata) {
    const avatarSources = [
      user.user_metadata.avatar_url,
      user.user_metadata.picture,
    ];

    for (const avatar of avatarSources) {
      if (avatar && typeof avatar === "string" && avatar.trim()) {
        avatarPath = avatar;
        break;
      }
    }
  }

  if (
    !avatarPath &&
    user.avatarUrl &&
    typeof user.avatarUrl === "string" &&
    user.avatarUrl.trim()
  ) {
    avatarPath = user.avatarUrl;
  }

  return getAvatarUrl(avatarPath);
}

export function getUserInitials(user: any): string {
  if (!user) return "U";

  let firstName = "";
  let lastName = "";

  if (user.user_metadata) {
    firstName =
      user.user_metadata.firstName ||
      (user.user_metadata.full_name
        ? user.user_metadata.full_name.split(" ")[0]
        : "") ||
      (user.user_metadata.name ? user.user_metadata.name.split(" ")[0] : "");

    lastName =
      user.user_metadata.lastName ||
      (user.user_metadata.full_name
        ? user.user_metadata.full_name.split(" ").slice(1).join(" ")
        : "") ||
      (user.user_metadata.name
        ? user.user_metadata.name.split(" ").slice(1).join(" ")
        : "");
  } else if (user.firstName !== undefined || user.lastName !== undefined) {
    firstName = user.firstName || "";
    lastName = user.lastName || "";
  }

  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName.charAt(0).toUpperCase();

  if (firstInitial && lastInitial) {
    return firstInitial + lastInitial;
  } else if (firstInitial) {
    return firstInitial;
  } else if (user.email) {
    return user.email.charAt(0).toUpperCase();
  }

  return "U";
}

export function formatUserName(user: any): string {
  if (!user) return "";

  if (user.user_metadata) {
    const metadata = user.user_metadata;

    if (metadata.fullName && metadata.fullName.trim()) {
      return metadata.fullName;
    }

    if (metadata.full_name && metadata.full_name.trim()) {
      return metadata.full_name;
    }

    if (metadata.name && metadata.name.trim()) {
      return metadata.name;
    }

    if (metadata.firstName || metadata.lastName) {
      return `${metadata.firstName || ""} ${metadata.lastName || ""}`.trim();
    }
  }

  if (user.fullName && user.fullName.trim()) {
    return user.fullName;
  }

  if (user.firstName || user.lastName) {
    return `${user.firstName || ""} ${user.lastName || ""}`.trim();
  }

  return user.email || "";
}

export function formatAddress(address: UserAddress): string {
  const parts = [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ].filter(Boolean);

  return parts.join(", ");
}

export function formatAddressShort(address: UserAddress): string {
  return `${address.city}, ${address.state}, ${address.country}`;
}

export function getAddressTypeLabel(
  addressType: "billing" | "shipping" | "both"
): string {
  switch (addressType) {
    case "billing":
      return "Billing Address";
    case "shipping":
      return "Shipping Address";
    case "both":
      return "Billing & Shipping";
    default:
      return "Address";
  }
}

export function getAddressTypeBadgeColor(
  addressType: "billing" | "shipping" | "both"
): string {
  switch (addressType) {
    case "billing":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "shipping":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "both":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === "1") {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone;
}

export function validatePasswordStrength(password: string): {
  score: number;
  feedback: string[];
  isValid: boolean;
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push("Password must be at least 8 characters long");
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Include at least one lowercase letter");
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Include at least one uppercase letter");
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push("Include at least one number");
  }

  if (/[@$!%*?&]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Include at least one special character (@$!%*?&)");
  }

  return {
    score,
    feedback,
    isValid: score === 5,
  };
}

export function generateReferralCode(
  first_name: string,
  last_name: string
): string {
  const base = `${first_name}${last_name}`.toUpperCase().replace(/[^A-Z]/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base.substring(0, 4)}${randomSuffix}`;
}

export function formatCurrency(
  amount: number,
  currency: string = "EGP"
): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatDate(
  dateString: string,
  locale: string = "en-US"
): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateString));
  } catch (error) {
    return new Date(dateString).toLocaleDateString();
  }
}

export function formatDateTime(
  dateString: string,
  locale: string = "en-US"
): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  } catch (error) {
    return new Date(dateString).toLocaleString();
  }
}

// Constants for limits and validation
export const PROFILE_LIMITS = {
  MAX_ADDRESSES: 10,
  MAX_WISHLISTS: 20,
  MAX_WISHLIST_ITEMS: 100,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB for avatar uploads
  ALLOWED_FILE_TYPES: ["image/jpeg", "image/png", "image/webp"],
} as const;

export const DEFAULT_AVATAR_URL = "/api/avatar/default";

export interface AvatarFallbackProps {
  user: any;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function getAvatarWithFallback(user: any): {
  src: string | null;
  fallback: string;
  alt: string;
} {
  const avatar = getUserAvatar(user);
  const initials = getUserInitials(user);
  const name = formatUserName(user);

  return {
    src: avatar,
    fallback: initials,
    alt: name || "User Avatar",
  };
}

export function calculateProfileCompletion(
  user: any,
  addresses: UserAddress[]
): {
  percentage: number;
  missingFields: string[];
} {
  // Extract data from Supabase Auth user object
  const metadata = user?.user_metadata || {};

  // Full name (check multiple OAuth formats)
  const fullName =
    metadata.fullName || metadata.full_name || metadata.name || "";

  // Phone (check both user_metadata and root level)
  const phone = metadata.phone || user?.phone || "";

  // Avatar (check multiple OAuth formats)
  const avatar = metadata.avatar_url || metadata.picture || "";

  // Timezone
  const timezone = metadata.timezone || "";

  // Preferred Language
  const preferredLanguage = metadata.preferredLanguage || "";

  // Default Currency
  const defaultCurrency = metadata.defaultCurrency || "";

  // Define required fields for profile completion
  const requiredFields = [
    { field: "fullName", label: "Full Name", value: fullName },
    { field: "phone", label: "Phone Number", value: phone },
    { field: "avatar", label: "Profile Picture", value: avatar },
    { field: "timezone", label: "Timezone", value: timezone },
    {
      field: "preferredLanguage",
      label: "Preferred Language",
      value: preferredLanguage,
    },
    {
      field: "defaultCurrency",
      label: "Default Currency",
      value: defaultCurrency,
    },
    {
      field: "address",
      label: "Delivery Address",
      value: addresses.length > 0,
    },
  ];

  // Count completed fields
  const completedFields = requiredFields.filter(
    (field) => field.value && field.value !== ""
  );

  // Get missing field labels
  const missingFields = requiredFields
    .filter((field) => !field.value || field.value === "")
    .map((field) => field.label);

  // Calculate percentage
  const percentage = Math.round(
    (completedFields.length / requiredFields.length) * 100
  );

  return {
    percentage,
    missingFields,
  };
}
