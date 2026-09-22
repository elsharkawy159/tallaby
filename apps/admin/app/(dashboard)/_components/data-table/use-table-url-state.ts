"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  LIST_SEPARATOR,
  PAGE_PARAM,
  PAGE_SIZE_PARAM,
  parseList,
} from "./search-params";

export type UrlParamValue =
  | string
  | number
  | readonly string[]
  | null
  | undefined;

/**
 * Reads and writes table state (page, sort, search, filters) in the URL so it
 * survives refresh/back and can be shared. Writes use `router.replace` inside
 * a transition: the server page re-renders with the new params and `isPending`
 * stays true until it arrives, so callers can dim stale rows.
 */
export function useTableUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const get = useCallback(
    (key: string) => searchParams.get(key) ?? "",
    [searchParams]
  );

  const getList = useCallback(
    (key: string) => parseList(searchParams.get(key) ?? undefined),
    [searchParams]
  );

  const setParams = useCallback(
    (
      patch: Record<string, UrlParamValue>,
      { resetPage = true }: { resetPage?: boolean } = {}
    ) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(patch)) {
        const serialized = Array.isArray(value)
          ? value.join(LIST_SEPARATOR)
          : value == null
            ? ""
            : String(value);
        if (serialized) params.set(key, serialized);
        else params.delete(key);
      }

      // Any filter/sort/search change invalidates the current page offset.
      if (resetPage) params.delete(PAGE_PARAM);
      if (params.get(PAGE_PARAM) === "1") params.delete(PAGE_PARAM);

      const query = params.toString();
      if (query === searchParams.toString()) return;

      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams]
  );

  /** Clear the given keys (or every param except page size). */
  const reset = useCallback(
    (keys?: readonly string[]) => {
      if (keys) {
        setParams(Object.fromEntries(keys.map((key) => [key, null])));
        return;
      }
      const pageSize = searchParams.get(PAGE_SIZE_PARAM);
      startTransition(() => {
        router.replace(
          pageSize ? `${pathname}?${PAGE_SIZE_PARAM}=${pageSize}` : pathname,
          { scroll: false }
        );
      });
    },
    [pathname, router, searchParams, setParams]
  );

  return { searchParams, get, getList, setParams, reset, isPending };
}
