import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getShareUrl(url?: string) {
  // Return an empty string during server-side rendering
  if (typeof window === "undefined") return "";

  try {
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    return `${baseUrl}${url ? `/${url}` : "/"}`;
  } catch (error) {
    // Fallback for any window access issues
    return "";
  }
}
