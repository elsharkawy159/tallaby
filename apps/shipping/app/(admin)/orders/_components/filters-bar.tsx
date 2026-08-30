"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { useDebounce } from "@workspace/ui/hooks/use-debounce";

import { SHIPPING_STATUSES, getStatusLabel } from "@/lib/shipping-status";
import type { ProviderOption, RiderOption } from "../orders.types";

/** Radix Select cannot hold an empty string value, so "all" stands in for it. */
const ALL = "all";

interface FiltersBarProps {
  providers: ProviderOption[];
  riders: RiderOption[];
}

export function FiltersBar({ providers, riders }: FiltersBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get("search") ?? "";
  const [search, setSearch] = useState(urlSearch);
  const debouncedSearch = useDebounce(search, 350);

  // Keep the input in sync when the URL changes from elsewhere (Reset, a stat
  // card link, the browser back button).
  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    if (debouncedSearch === urlSearch) return;
    applyParam("search", debouncedSearch || null);
    // applyParam is stable for a given searchParams snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  function applyParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) params.set(key, value);
    else params.delete(key);

    // Any filter change invalidates the current page offset.
    params.delete("page");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const status = searchParams.get("status") ?? ALL;
  const providerId = searchParams.get("providerId") ?? ALL;
  const riderId = searchParams.get("riderId") ?? ALL;
  const hasFilters =
    Boolean(urlSearch) || status !== ALL || providerId !== ALL || riderId !== ALL;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Order number, customer, phone"
          className="pl-9"
          aria-label="Search shipping orders"
        />
      </div>

      <Select
        value={status}
        onValueChange={(value) =>
          applyParam("status", value === ALL ? null : value)
        }
      >
        <SelectTrigger className="w-full sm:w-44" aria-label="Filter by status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {SHIPPING_STATUSES.map((value) => (
            <SelectItem key={value} value={value}>
              {getStatusLabel(value)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={providerId}
        onValueChange={(value) =>
          applyParam("providerId", value === ALL ? null : value)
        }
      >
        <SelectTrigger className="w-full sm:w-44" aria-label="Filter by provider">
          <SelectValue placeholder="Provider" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All providers</SelectItem>
          {providers.map((provider) => (
            <SelectItem key={provider.id} value={provider.id}>
              {provider.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={riderId}
        onValueChange={(value) =>
          applyParam("riderId", value === ALL ? null : value)
        }
      >
        <SelectTrigger className="w-full sm:w-44" aria-label="Filter by rider">
          <SelectValue placeholder="Rider" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All riders</SelectItem>
          {riders.map((rider) => (
            <SelectItem key={rider.id} value={rider.id}>
              {rider.fullName ?? rider.email ?? "Unnamed rider"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.replace(pathname, { scroll: false })}
        >
          <X className="size-4" />
          Reset
        </Button>
      )}
    </div>
  );
}
