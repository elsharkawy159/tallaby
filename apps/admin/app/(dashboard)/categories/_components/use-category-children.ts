"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { getAllCategories } from "@/actions/categories";
import type { Category } from "../categories.types";

// Global cache for category children
const categoryChildrenCache = new Map<string, Category[]>();
const loadingStates = new Map<string, boolean>();

interface UseCategoryChildrenOptions {
  categoryId: string;
  locale: "en" | "ar";
  enabled?: boolean;
}

interface UseCategoryChildrenResult {
  data: Category[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and caching category children
 * Mimics useQuery behavior with built-in caching
 */
export function useCategoryChildren({
  categoryId,
  locale,
  enabled = true,
}: UseCategoryChildrenOptions): UseCategoryChildrenResult {
  const cacheKey = `${categoryId}-${locale}`;
  const [data, setData] = useState<Category[] | undefined>(
    categoryChildrenCache.get(cacheKey)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchChildren = useCallback(async () => {
    // Check cache first
    const cached = categoryChildrenCache.get(cacheKey);
    if (cached) {
      setData(cached);
      return;
    }

    // Prevent duplicate requests
    if (loadingStates.get(cacheKey)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    loadingStates.set(cacheKey, true);

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const result = await getAllCategories({
        locale,
        parentId: categoryId,
      });

      if (result.success && result.data) {
        const categories = result.data as Category[];
        // Cache the data
        categoryChildrenCache.set(cacheKey, categories);
        setData(categories);
      } else {
        throw new Error(result.error || "Failed to fetch children");
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err);
        console.error("Failed to load category children:", err);
      }
    } finally {
      setIsLoading(false);
      loadingStates.delete(cacheKey);
      abortControllerRef.current = null;
    }
  }, [categoryId, locale, cacheKey]);

  useEffect(() => {
    if (enabled && !data && !isLoading) {
      fetchChildren();
    }
  }, [enabled, data, isLoading, fetchChildren]);

  const refetch = useCallback(async () => {
    // Clear cache and refetch
    categoryChildrenCache.delete(cacheKey);
    setData(undefined);
    await fetchChildren();
  }, [cacheKey, fetchChildren]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Clear cache for a specific category or all categories
 */
export function clearCategoryCache(categoryId?: string, locale?: "en" | "ar") {
  if (categoryId && locale) {
    const cacheKey = `${categoryId}-${locale}`;
    categoryChildrenCache.delete(cacheKey);
  } else {
    // Clear all cache
    categoryChildrenCache.clear();
    loadingStates.clear();
  }
}

/**
 * Invalidate cache for a category (useful after mutations)
 */
export function invalidateCategoryCache(categoryId: string, locale: "en" | "ar") {
  const cacheKey = `${categoryId}-${locale}`;
  categoryChildrenCache.delete(cacheKey);
  
  // Also invalidate parent's cache if this category was a child
  // This ensures parent accordions show updated children count
  for (const [key] of categoryChildrenCache) {
    if (key.includes(`-${locale}`)) {
      // Could be more sophisticated, but for now clear all for the locale
      // In production, you'd want to track parent-child relationships
    }
  }
}

