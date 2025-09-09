"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface SetUrlParamsOptions {
  scroll?: boolean;
  replace?: boolean;
  isServer?: boolean;
}

interface UrlParams {
  params: Record<string, string>;
  getParam: (key: string) => string;
  setParam: (key: string, value: string, options?: SetUrlParamsOptions) => void;
  setParams: (params: Record<string, string>, options?: SetUrlParamsOptions) => void;
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

export function useUrlParams(): UrlParams {
  const searchParams = useSearchParams();
  const [, setUpdateTrigger] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const handlePopState = () => {
      setUpdateTrigger((prev) => prev + 1);
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const getAllParams = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    const paramsObject: Record<string, string> = {};

    params.forEach((value, key) => {
      paramsObject[key] = value;
    });

    return paramsObject;
  }, [searchParams]);

  const getParam = useCallback(
    (key: string) => {
      return searchParams.get(key) || "";
    },
    [searchParams],
  );

  const updateUrl = useCallback((newSearchParams: URLSearchParams, options?: SetUrlParamsOptions) => {
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

    setUpdateTrigger((prev) => prev + 1);
  }, []);

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
    [searchParams, updateUrl],
  );

  const setParam = useCallback(
    (key: string, value: string, options?: SetUrlParamsOptions) => {
      setParams({ [key]: value }, options);
    },
    [setParams],
  );

  const deleteParam = useCallback(
    (key: string, options?: SetUrlParamsOptions) => {
      const currentParams = new URLSearchParams(searchParams);
      currentParams.delete(key);
      updateUrl(currentParams, options);
    },
    [searchParams, updateUrl],
  );

  const clearParams = useCallback(
    (options?: SetUrlParamsOptions) => {
      updateUrl(new URLSearchParams(), options);
    },
    [updateUrl],
  );

  return {
    params: getAllParams(),
    getParam,
    setParam,
    setParams,
    deleteParam,
    clearParams,
  };
}
