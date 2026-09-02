"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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

import {
  PAYMENT_STATUSES,
} from "@/lib/shipping-status";
import type { ProviderOption, RiderOption } from "../orders.types";

/** Radix Select cannot hold an empty string value, so "all" stands in for it. */
const ALL = "all";

interface FiltersBarProps {
  providers: ProviderOption[];
  riders: RiderOption[];
}

export function FiltersBar({ providers, riders }: FiltersBarProps) {
  const t = useTranslations("orders");
  const tPayment = useTranslations("paymentStatus");
  const tCommon = useTranslations("common");
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

  const providerId = searchParams.get("providerId") ?? ALL;
  const riderId = searchParams.get("riderId") ?? ALL;
  const paymentStatus = searchParams.get("paymentStatus") ?? ALL;
  const codOnly = searchParams.get("codOnly") ?? ALL;
  const hasFilters =
    Boolean(urlSearch) ||
    providerId !== ALL ||
    riderId !== ALL ||
    paymentStatus !== ALL ||
    codOnly !== ALL;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="ps-9"
          aria-label={t("searchAria")}
        />
      </div>

      <Select
        value={providerId}
        onValueChange={(value) =>
          applyParam("providerId", value === ALL ? null : value)
        }
      >
        <SelectTrigger className="w-full sm:w-44" aria-label={t("filterProviderAria")}>
          <SelectValue placeholder={t("provider")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("allProviders")}</SelectItem>
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
        <SelectTrigger className="w-full sm:w-44" aria-label={t("filterRiderAria")}>
          <SelectValue placeholder={t("rider")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("allRiders")}</SelectItem>
          {riders.map((rider) => (
            <SelectItem key={rider.id} value={rider.id}>
              {rider.fullName ?? rider.email ?? tCommon("unnamedRider")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={paymentStatus}
        onValueChange={(value) =>
          applyParam("paymentStatus", value === ALL ? null : value)
        }
      >
        <SelectTrigger className="w-full sm:w-44" aria-label={t("filterPaymentAria")}>
          <SelectValue placeholder={t("paymentStatus")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("allPaymentStatuses")}</SelectItem>
          {PAYMENT_STATUSES.map((value) => (
            <SelectItem key={value} value={value}>
              {tPayment(value)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={codOnly}
        onValueChange={(value) => applyParam("codOnly", value === ALL ? null : value)}
      >
        <SelectTrigger className="w-full sm:w-36" aria-label={t("filterCodAria")}>
          <SelectValue placeholder={t("codPrepaid")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("codAndPrepaid")}</SelectItem>
          <SelectItem value="cod">{t("codOnly")}</SelectItem>
          <SelectItem value="prepaid">{t("prepaidOnly")}</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.replace(pathname, { scroll: false })}
        >
          <X className="size-4" />
          {tCommon("reset")}
        </Button>
      )}
    </div>
  );
}
