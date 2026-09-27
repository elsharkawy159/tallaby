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
