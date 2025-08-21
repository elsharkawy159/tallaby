import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import slugify from "slugify";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateImageName(file: File, folderName: string, extra = "") {
  // Get the current date in YYYYMMDD format
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const formattedDate = `${year}${month}${day}`;

  // Create a unique identifier
  const uniqueIdentifier = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${extra}`;

  // Extract the file extension
  const fileExtension = file.name.split(".").pop();

  // Sanitize the original file name
  const originalFileName = file.name.substring(0, file.name.lastIndexOf("."));
  const sanitizedFileName = slugify(originalFileName, {
    lower: true,
    strict: true,
  });

  // Combine folder name, date, sanitized name, unique identifier, and file extension
  return `${folderName}/${formattedDate}-${sanitizedFileName}-${uniqueIdentifier}.${fileExtension}`;
}

export function getPublicUrl( url: string, bucket = "products") {
  return `https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/${bucket}/${url}?format=WebP&quality=${75}`;
}

export function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const VALID_FORMATS = ["image/jpeg", "image/png"];

export const validateImage = (file: File) => {
  return new Promise((resolve, reject) => {
    if (!VALID_FORMATS.includes(file.type)) {
      reject(new Error("صيغة الملف يجب أن تكون jpg أو png"));
    } else if (file.size > MAX_SIZE) {
      reject(new Error("حجم الملف لا يجب أن يزيد عن 2 ميجا"));
    } else {
      resolve(true);
    }
  });
};
