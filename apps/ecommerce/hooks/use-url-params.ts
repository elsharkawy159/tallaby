"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export type SearchParams = {
  search?: string;
  categories?: string[];
  brands?: string[];
  priceMin?: number;
  priceMax?: number;
  sort?: string;
  page?: number;
  pageSize?: number;
};

interface SetUrlParamsOptions {
  scroll?: boolean;
  replace?: boolean;
  isServer?: boolean;
}

interface UrlParams {
  params: Record<string, string>;
  getParam: (key: string) => string;
  setParam: (key: string, value: string, options?: SetUrlParamsOptions) => void;
  setParams: (
    params: Record<string, string>,
    options?: SetUrlParamsOptions
  ) => void;
  deleteParam: (key: string, options?: SetUrlParamsOptions) => void;
  clearParams: (options?: SetUrlParamsOptions) => void;
}

const createQueryString = (params: URLSearchParams): string => {
  const newParams = params.toString();
  return newParams ? `?${newParams}` : "";
};

const getDefaultOptions = (options?: SetUrlParamsOptions) => ({
  scroll: options?.scroll ?? true,
  replace: options?.replace ?? false,
});

export function useUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [params, setParamsState] = useState<SearchParams>(() => ({
    search: searchParams.get("search") || "",
    categories:
      searchParams.get("categories")?.split(",").filter(Boolean) || [],
    brands: searchParams.get("brands")?.split(",").filter(Boolean) || [],
    priceMin: Number(searchParams.get("priceMin")) || 0,
    priceMax: Number(searchParams.get("priceMax")) || 500,
    sort: searchParams.get("sort") || "popularity",
    page: Number(searchParams.get("page")) || 1,
    pageSize: Number(searchParams.get("pageSize")) || 20,
  }));

  const updateParams = useCallback(
    (newParams: Partial<SearchParams>, options?: SetUrlParamsOptions) => {
      setParamsState((prev) => {
        const updated = { ...prev, ...newParams };

        // Create new URLSearchParams
        const params = new URLSearchParams(searchParams.toString());

        // Update each param
        if (updated.search) params.set("search", updated.search);
        else params.delete("search");

        if (updated.categories?.length)
          params.set("categories", updated.categories.join(","));
        else params.delete("categories");

        if (updated.brands?.length)
          params.set("brands", updated.brands.join(","));
        else params.delete("brands");

        if (updated.priceMin !== undefined && updated.priceMin !== 0)
          params.set("priceMin", String(updated.priceMin));
        else params.delete("priceMin");

        if (updated.priceMax !== undefined && updated.priceMax !== 500)
          params.set("priceMax", String(updated.priceMax));
        else params.delete("priceMax");

        if (updated.sort && updated.sort !== "popularity")
          params.set("sort", updated.sort);
        else params.delete("sort");

        if (updated.page && updated.page > 1)
          params.set("page", String(updated.page));
        else params.delete("page");

        if (updated.pageSize && updated.pageSize !== 20)
          params.set("pageSize", String(updated.pageSize));
        else params.delete("pageSize");

        // Update URL without full page reload
        const newUrl = `${pathname}?${params.toString()}`;
        router.push(newUrl, { scroll: options?.scroll ?? false });

        return updated;
      });
    },
    [pathname, router, searchParams]
  );

  // Sync with URL changes
  useEffect(() => {
    setParamsState({
      search: searchParams.get("search") || "",
      categories:
        searchParams.get("categories")?.split(",").filter(Boolean) || [],
      brands: searchParams.get("brands")?.split(",").filter(Boolean) || [],
      priceMin: Number(searchParams.get("priceMin")) || 0,
      priceMax: Number(searchParams.get("priceMax")) || 500,
      sort: searchParams.get("sort") || "popularity",
      page: Number(searchParams.get("page")) || 1,
      pageSize: Number(searchParams.get("pageSize")) || 20,
    });
  }, [searchParams]);

  const getParam = useCallback(
    (key: keyof SearchParams) => {
      return params[key];
    },
    [params]
  );

  const getAllParams = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    const paramsObject: Record<string, string> = {};

    params.forEach((value, key) => {
      paramsObject[key] = value;
    });

    return paramsObject;
  }, [searchParams]);

  const updateUrl = useCallback(
    (newSearchParams: URLSearchParams, options?: SetUrlParamsOptions) => {
      const { scroll, replace } = getDefaultOptions(options);
      const query = createQueryString(newSearchParams);
      const newUrl = `${window.location.pathname}${query}`;

      if (options?.isServer) {
        router.push(newUrl);
      } else {
        window.history.pushState(null, "", newUrl);
      }

      if (scroll) {
        window.scrollTo(0, 0);
      }

      setParamsState((prev) => ({ ...prev, ...getAllParams() }));
    },
    [router, searchParams, getAllParams]
  );

  const setParams = useCallback(
    (params: Record<string, string>, options?: SetUrlParamsOptions) => {
      const currentParams = new URLSearchParams(searchParams);

      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          currentParams.set(key, value);
        } else {
          currentParams.delete(key);
        }
      });

      updateUrl(currentParams, options);
    },
    [searchParams, updateUrl]
  );

  const setParam = useCallback(
    (key: string, value: string, options?: SetUrlParamsOptions) => {
      setParams({ [key]: value }, options);
    },
    [setParams]
  );

  const deleteParam = useCallback(
    (key: string, options?: SetUrlParamsOptions) => {
      const currentParams = new URLSearchParams(searchParams);
      currentParams.delete(key);
      updateUrl(currentParams, options);
    },
    [searchParams, updateUrl]
  );

  const clearParams = useCallback(
    (options?: SetUrlParamsOptions) => {
      updateUrl(new URLSearchParams(), options);
    },
    [updateUrl]
  );

  return {
    params,
    updateParams,
    getAllParams,
    getParam,
    setParam,
    setParams,
    deleteParam,
    clearParams,
  };
}
