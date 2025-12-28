export const CATEGORY_BUCKET = "categories";

export const LOCALES = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
] as const;

export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
