import { createClient } from "@/supabase/client";
import { clsx } from "clsx";
import slugify from "slugify";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: any) {
  return twMerge(clsx(inputs));
}

export function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getPublicUrl(file: string, bucket = "products") {
  const supabase = createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(file);

  return data.publicUrl;
}

export const generateImageName = (file: any) => {
  const folderName = getTodayDate();
  const baseName = file.name.substring(0, file.name.lastIndexOf("."));
  const fileExtension = file.name.split(".").pop(); // Extract file extension
  const slugifiedName = slugify(baseName, { lower: true, strict: true });
  return `${folderName}/${Date.now()}-${slugifiedName}.${fileExtension}`;
};

export const generateSlug = (text: any) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w\-]+/g, "") // Remove all non-word characters
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
};

const MAX_SIZE = 20 * 1024 * 1024; // 2 MB
const VALID_FORMATS = ["image/jpeg", "image/png"];

export const validateImage = (file: any) => {
  return new Promise((resolve, reject: any) => {
    if (!VALID_FORMATS.includes(file.type)) {
      reject(new Error("File format must be jpg or png"));
    } else if (file.size > MAX_SIZE) {
      reject(new Error("File size must not exceed 2 MB"));
    } else {
      resolve(true);
    }
  });
};

export function getShareUrl(url?: string) {
  // Return an empty string during server-side rendering
  if (typeof window === "undefined") return "";

  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  return `${baseUrl}${url ? `/${url}` : "/"}`;
}
