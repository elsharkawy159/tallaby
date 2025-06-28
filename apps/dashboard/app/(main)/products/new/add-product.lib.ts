/**
 * Utility functions for the add product form
 */

// Generate a URL-friendly slug from a title
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
};

// Generate a unique SKU with prefix
export const generateSKU = (prefix: string = "PRD"): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// Format price for display
export const formatPrice = (
  price: number,
  currency: string = "USD"
): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
};

// Validate image file
export const validateImageFile = (
  file: File
): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Please upload JPEG, PNG, or WebP images.",
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File size too large. Please upload images smaller than 10MB.",
    };
  }

  return { valid: true };
};

// Calculate discount percentage
export const calculateDiscountPercentage = (
  originalPrice: number,
  salePrice: number
): number => {
  if (originalPrice <= 0 || salePrice <= 0 || salePrice >= originalPrice) {
    return 0;
  }
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

// Validate price relationships
export const validatePrices = (
  basePrice: number,
  listPrice?: number,
  salePrice?: number
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (basePrice <= 0) {
    errors.push("Base price must be greater than 0");
  }

  if (listPrice && listPrice < basePrice) {
    errors.push("List price must be greater than or equal to base price");
  }

  if (salePrice && salePrice >= basePrice) {
    errors.push("Sale price must be less than base price");
  }

  if (salePrice && salePrice <= 0) {
    errors.push("Sale price must be greater than 0");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Generate product meta title from product data
export const generateMetaTitle = (
  title: string,
  brandName?: string
): string => {
  const maxLength = 60;
  let metaTitle = title;

  if (brandName) {
    metaTitle = `${brandName} ${title}`;
  }

  if (metaTitle.length > maxLength) {
    metaTitle = metaTitle.substring(0, maxLength - 3) + "...";
  }

  return metaTitle;
};

// Generate product meta description
export const generateMetaDescription = (
  title: string,
  description?: string,
  brandName?: string
): string => {
  const maxLength = 160;
  let metaDescription = "";

  if (description) {
    metaDescription = description;
  } else {
    metaDescription = `Buy ${title}`;
    if (brandName) {
      metaDescription += ` from ${brandName}`;
    }
    metaDescription += ". High quality products with fast shipping.";
  }

  if (metaDescription.length > maxLength) {
    metaDescription = metaDescription.substring(0, maxLength - 3) + "...";
  }

  return metaDescription;
};

// Extract keywords from text
export const extractKeywords = (text: string): string[] => {
  const commonWords = [
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
  ];

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !commonWords.includes(word))
    .slice(0, 10); // Limit to 10 keywords
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Debounce function for search/validation
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Check if string is valid URL
export const isValidUrl = (string: string): boolean => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// Sanitize HTML content
export const sanitizeHtml = (html: string): string => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
};
