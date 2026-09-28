"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, MessageCircle, Package, PackagePlus, ShoppingBag } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import { useSupportWhatsAppUrl } from "@/components/dashboard/support-chat-link.client";
import { DASHBOARD_ROUTES } from "./dashboard-routes.lib";
import {
  searchDashboard,
  type DashboardSearchResults,
} from "./dashboard-search.server";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SEARCH_DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const t = useTranslations("header");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const supportUrl = useSupportWhatsAppUrl();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DashboardSearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults(null);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      const next = await searchDashboard(trimmed);
      if (cancelled) return;
      setResults(next);
      setIsSearching(false);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const handleOpenChange = (next: boolean) => {
    if (!next) setQuery("");
    onOpenChange(next);
  };

  const run = (action: () => void) => {
    handleOpenChange(false);
    action();
  };

  const hasQuery = query.trim().length >= MIN_QUERY_LENGTH;

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t("search")}
      description={t("paletteDescription")}
      className="sm:max-w-xl"
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={t("searchPlaceholder")}
      />
      <CommandList className="max-h-[min(420px,60vh)]">
        {!isSearching && <CommandEmpty>{t("noResults")}</CommandEmpty>}

        {/* Server results are already matched; forceMount skips cmdk's own filter. */}
        {hasQuery && isSearching && (
          <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t("searching")}
          </div>
        )}

        {hasQuery && !!results?.orders.length && (
          <CommandGroup heading={t("orders")} forceMount>
            {results.orders.map((order) => (
              <CommandItem
                key={order.id}
                value={`order-${order.id}`}
                forceMount
                onSelect={() => run(() => router.push(`/orders?order=${order.id}`))}
              >
                <ShoppingBag />
                <span className="font-medium" dir="ltr">
                  #{order.orderNumber}
                </span>
                <span className="truncate text-muted-foreground">
                  {order.productName}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {hasQuery && !!results?.products.length && (
          <CommandGroup heading={t("products")} forceMount>
            {results.products.map((product) => (
              <CommandItem
                key={product.id}
                value={`product-${product.id}`}
                forceMount
                onSelect={() =>
                  run(() => router.push(`/products/${product.id}/edit`))
                }
              >
                <Package />
                <span className="truncate">{product.title}</span>
                {product.sku && (
                  <span className="ms-auto shrink-0 text-xs text-muted-foreground" dir="ltr">
                    {product.sku}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading={t("quickActions")}>
          <CommandItem
            value={tNav("addProducts")}
            onSelect={() => run(() => router.push("/products/add"))}
          >
            <PackagePlus />
            {tNav("addProducts")}
          </CommandItem>
          <CommandItem
            value={tNav("chatWithSupport")}
            keywords={["whatsapp", "support", "help", "واتساب", "دعم"]}
            onSelect={() =>
              run(() => window.open(supportUrl, "_blank", "noopener,noreferrer"))
            }
          >
            <MessageCircle />
            {tNav("chatWithSupport")}
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading={t("pages")}>
          {DASHBOARD_ROUTES.map((route) => (
            <CommandItem
              key={route.href}
              value={route.parent ? `${tNav(route.parent)} ${tNav(route.title)}` : tNav(route.title)}
              keywords={[route.href]}
              onSelect={() => run(() => router.push(route.href))}
            >
              <route.icon />
              {tNav(route.title)}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
