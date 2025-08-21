import type {
  Benefit,
  Stat,
  Testimonial,
  PricingPlan,
} from "./become-seller.types";
import {
  Users,
  TrendingUp,
  Globe,
  Shield,
  DollarSign,
  Headphones,
} from "lucide-react";

/**
 * Generates a URL-friendly slug from a business name
 * @param businessName - The business name to convert
 * @returns A URL-friendly slug
 */
export const generateSlug = (businessName: string): string => {
  return businessName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    .substring(0, 60); // Limit length
};

/**
 * Creates a display name from business name
 * @param businessName - The business name
 * @returns A formatted display name
 */
export const createDisplayName = (businessName: string): string => {
  return businessName
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .substring(0, 100); // Limit length
};

/**
 * Validates business name format
 * @param businessName - The business name to validate
 * @returns Object with validation result and message
 */
export const validateBusinessName = (
  businessName: string
): {
  isValid: boolean;
  message?: string;
} => {
  if (!businessName.trim()) {
    return { isValid: false, message: "Business name is required" };
  }

  if (businessName.length < 2) {
    return {
      isValid: false,
      message: "Business name must be at least 2 characters",
    };
  }

  if (businessName.length > 100) {
    return {
      isValid: false,
      message: "Business name must be less than 100 characters",
    };
  }

  // Check for inappropriate content (basic filter)
  const inappropriateWords = ["test", "demo", "sample"];
  const lowerName = businessName.toLowerCase();
  const hasInappropriate = inappropriateWords.some((word) =>
    lowerName.includes(word)
  );

  if (hasInappropriate) {
    return {
      isValid: false,
      message: "Please choose a professional business name",
    };
  }

  return { isValid: true };
};

/**
 * Formats phone number for display
 * @param phone - Raw phone number
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    // US format with country code
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    // US format without country code
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phone; // Return as-is if not standard US format
};

/**
 * Gets the benefits data for the benefits section
 * @returns Array of benefit objects
 */
export const getBenefitsData = (): Benefit[] => [
  {
    icon: Users,
    title: "Reach Millions",
    description:
      "Access our customer base of over 500,000 active shoppers worldwide",
  },
  {
    icon: TrendingUp,
    title: "Grow Your Business",
    description:
      "Scale your sales with our powerful marketing tools and analytics",
  },
  {
    icon: Globe,
    title: "Global Market",
    description:
      "Sell internationally with our integrated shipping and logistics",
  },
  {
    icon: Shield,
    title: "Secure Platform",
    description:
      "Protected transactions with fraud protection and buyer safety",
  },
  {
    icon: DollarSign,
    title: "Competitive Fees",
    description:
      "Low selling fees with transparent pricing and no hidden costs",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Dedicated seller support team to help you succeed",
  },
];

/**
 * Gets the statistics data for the stats section
 * @returns Array of statistic objects
 */
export const getStatsData = (): Stat[] => [
  {
    label: "Active Sellers",
    value: "10K+",
    description: "Trusted vendors",
  },
  {
    label: "Products Sold",
    value: "2M+",
    description: "Successfully delivered",
  },
  {
    label: "Customer Satisfaction",
    value: "98%",
    description: "Positive feedback",
  },
  {
    label: "Average Growth",
    value: "150%",
    description: "Sales increase in first year",
  },
];

/**
 * Gets the testimonials data for the testimonials section
 * @returns Array of testimonial objects
 */
export const getTestimonialsData = (): Testimonial[] => [
  {
    name: "Sarah Chen",
    business: "Chen's Boutique",
    image:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop",
    rating: 5,
    text: "Joining this platform transformed my small boutique into a thriving online business. The support team is amazing!",
  },
  {
    name: "Michael Rodriguez",
    business: "TechGear Pro",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    rating: 5,
    text: "The analytics tools helped me understand my customers better and increase sales by 200% in just 6 months.",
  },
  {
    name: "Emma Thompson",
    business: "Handmade by Emma",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    rating: 5,
    text: "Perfect platform for artisans like me. Easy to use, great exposure, and the commission rates are very fair.",
  },
];

/**
 * Gets the pricing plans data for the pricing section
 * @returns Array of pricing plan objects
 */
export const getPricingPlansData = (): PricingPlan[] => [
  {
    name: "Starter",
    price: "Free",
    description: "Perfect for small businesses just getting started",
    features: [
      "Up to 100 products",
      "Basic analytics",
      "Standard support",
      "5% transaction fee",
    ],
    recommended: false,
  },
  {
    name: "Professional",
    price: "$29/month",
    description: "Best for growing businesses",
    features: [
      "Unlimited products",
      "Advanced analytics",
      "Priority support",
      "3% transaction fee",
      "Marketing tools",
      "Bulk operations",
    ],
    recommended: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large businesses with custom needs",
    features: [
      "Everything in Professional",
      "Dedicated account manager",
      "Custom integrations",
      "2% transaction fee",
      "White-label options",
      "API access",
    ],
    recommended: false,
  },
];

/**
 * Debounce utility for form validation
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Gets browser timezone
 * @returns Browser timezone string
 */
export const getBrowserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC"; // Fallback
  }
};

/**
 * Generates a random referral code
 * @param length - Length of the code (default: 8)
 * @returns Random alphanumeric code
 */
export const generateReferralCode = (length: number = 8): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
};
