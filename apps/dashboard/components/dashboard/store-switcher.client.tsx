"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, ChevronsUpDown, ExternalLink, Plus } from "lucide-react";
import { storeHostname, storeUrl } from "@workspace/lib/storefront";
import { Badge } from "@workspace/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn } from "@/lib/utils";
import { StoreLogo } from "@/components/stores/store-logo.client";
import { selectStore } from "./store-switcher.server";

export type SwitcherStore = {
  id: string;
  name: string;
  subdomain: string;
  isPrimary: boolean;
  status: string;
  logoUrl: string | null;
};

/**
 * Top-of-sidebar store switcher (PLAN.md §7.2). Picking a store only changes
 * which store the store-scoped links open; on a store page it moves to the
 * same page of the new store.
 */
export function StoreSwitcher({
  stores,
  selectedId,
  maxStores,
  isCollapsed,
}: {
  stores: SwitcherStore[];
  selectedId: string | null;
  maxStores: number;
  isCollapsed: boolean;
}) {
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const selected = stores.find((s) => s.id === selectedId) ?? stores[0];
  if (!selected) return null;

  const switchTo = (store: SwitcherStore) => {
    if (store.id === selected.id) return;
    startTransition(async () => {
      const result = await selectStore(store.id);
      if (!result.success) return;
      const prefix = `/stores/${selected.id}`;
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        router.push(`/stores/${store.id}${pathname.slice(prefix.length)}`);
      } else {
        router.refresh();
      }
    });
  };

  const canCreate = stores.length < maxStores;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-xl border border-sidebar-border bg-background/60 p-2 text-start transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40",
          isCollapsed && "justify-center border-transparent bg-transparent p-1",
        )}
        aria-label={t("switchStore")}
        title={isCollapsed ? selected.name : undefined}
      >
        <StoreLogo name={selected.name} logoUrl={selected.logoUrl} />
        {!isCollapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-sidebar-foreground">{selected.name}</span>
              <span dir="ltr" className="block truncate text-start text-xs text-muted-foreground rtl:text-end">
                {storeHostname(selected.subdomain)}
              </span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[264px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{t("yourStores")}</DropdownMenuLabel>
        {stores.map((store) => (
          <DropdownMenuItem
            key={store.id}
            onSelect={() => switchTo(store)}
            disabled={store.status === "archived"}
            className="gap-2.5"
          >
            <StoreLogo name={store.name} logoUrl={store.logoUrl} className="size-7" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">{store.name}</span>
              <span dir="ltr" className="block truncate text-start text-xs text-muted-foreground rtl:text-end">
                {storeHostname(store.subdomain)}
              </span>
            </span>
            {store.isPrimary && <Badge variant="secondary">{t("primaryStore")}</Badge>}
            {store.status === "archived" && <Badge variant="outline">{t("archived")}</Badge>}
            {store.id === selected.id && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={storeUrl(selected.subdomain)} target="_blank" rel="noopener noreferrer" className="gap-2">
            <ExternalLink className="size-4" />
            {t("viewStore")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild disabled={!canCreate}>
          <Link href={canCreate ? "/stores?create=1" : "/stores"} className="gap-2">
            <Plus className="size-4" />
            <span className="flex-1">{t("createStore")}</span>
            <span className="text-xs text-muted-foreground">
              {t("storeUsage", { count: stores.length, max: maxStores })}
            </span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
