"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronsUpDown, ExternalLink, Plus, Store } from "lucide-react";
import { storeHostname } from "@workspace/lib/storefront";
import { AnchoredSheet, Tag } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { StoreLogo } from "@/components/stores/store-logo.client";
import { useSidebarStore } from "@/stores";
import { selectStore } from "./store-switcher.server";

export type SwitcherStore = {
  id: string;
  name: string;
  subdomain: string;
  isPrimary: boolean;
  status: string;
  logoUrl: string | null;
  siteStatus: string;
};

/** Published, unpublished or never published, as a small pill. */
function SiteStatusTag({ siteStatus }: { siteStatus: string }) {
  const t = useTranslations("storeSiteStatus");
  const tNav = useTranslations("nav");
  if (siteStatus === "published") return <Tag tone="success">{tNav("storeLive")}</Tag>;
  if (siteStatus === "unpublished") return <Tag tone="danger">{t("offlineShort")}</Tag>;
  return <Tag tone="warning">{t("draftShort")}</Tag>;
}

const ACTION =
  "flex min-h-10 items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-semibold text-(--s-body) no-underline transition-colors duration-150 hover:bg-(--s-tint) hover:text-(--s-ink) [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-(--s-subtle)";

/**
 * Store switcher at the top of the sidebar (PLAN.md §7.2). Picking a store only
 * changes which store the store-scoped links open; on a store page it moves to
 * the same page of the new store.
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
  const rtl = useLocale().startsWith("ar");
  const setMobileOpen = useSidebarStore((state) => state.setMobileOpen);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const selected = stores.find((s) => s.id === selectedId) ?? stores[0];
  if (!selected) return null;

  const close = () => {
    setOpen(false);
    setMobileOpen(false);
  };

  const switchTo = (store: SwitcherStore) => {
    setOpen(false);
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
    <AnchoredSheet
      open={open}
      onOpenChange={setOpen}
      label={t("switchStore")}
      side={isCollapsed ? (rtl ? "left" : "right") : "bottom"}
      align="start"
      className="w-[300px] gap-0"
      trigger={
        <button
          type="button"
          disabled={isPending}
          aria-label={t("switchStore")}
          title={isCollapsed ? selected.name : undefined}
          className={cn(
            "flex w-full cursor-pointer items-center gap-2.5 rounded-2xl border border-(--s-field) bg-(--s-surface) p-2.5 text-start transition-[border-color,box-shadow] duration-150 hover:border-(--s-outline) hover:shadow-[0_6px_18px_rgb(13_55_67/0.06)] aria-expanded:border-(--s-primary) aria-expanded:shadow-[0_0_0_3px_var(--s-focus-soft)] disabled:opacity-60",
            isCollapsed && "justify-center p-1.5",
          )}
        >
          <StoreLogo name={selected.name} logoUrl={selected.logoUrl} className="size-9 rounded-[11px]" />
          {!isCollapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-bold leading-snug text-(--s-ink)">{selected.name}</span>
                <span dir="ltr" className="block truncate text-start font-montserrat text-[11px] font-medium text-(--s-subtle) rtl:text-end">
                  {storeHostname(selected.subdomain)}
                </span>
              </span>
              <ChevronsUpDown aria-hidden className="size-[15px] shrink-0 text-(--s-faint)" />
            </>
          )}
        </button>
      }
    >
      <div className="max-h-[60dvh] overflow-y-auto p-2 pb-1">
        <p className="px-2.5 pb-1 pt-1.5 text-[11.5px] font-bold text-(--s-faint)">{t("yourStores")}</p>
        {stores.map((store) => {
          const current = store.id === selected.id;
          const archived = store.status === "archived";
          return (
            <button
              key={store.id}
              type="button"
              disabled={archived}
              onClick={() => switchTo(store)}
              aria-current={current || undefined}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2.5 rounded-[14px] px-2.5 py-[9px] text-start transition-colors duration-150 hover:bg-(--s-tint) disabled:cursor-not-allowed disabled:opacity-60",
                current && "bg-(--s-hover) hover:bg-(--s-hover)",
              )}
            >
              <StoreLogo name={store.name} logoUrl={store.logoUrl} className="size-[34px] rounded-[11px]" />
              <span className="min-w-0 flex-1">
                <b className="block truncate text-[13.5px] font-bold text-(--s-ink)">{store.name}</b>
                <span dir="ltr" className="block truncate text-start font-montserrat text-[11px] font-medium text-(--s-subtle) rtl:text-end">
                  {storeHostname(store.subdomain)}
                </span>
                <span className="mt-1 flex flex-wrap gap-1">
                  {archived ? <Tag>{t("archived")}</Tag> : <SiteStatusTag siteStatus={store.siteStatus} />}
                  {store.isPrimary && <Tag tone="info">{t("primaryStore")}</Tag>}
                </span>
              </span>
              {current && <Check aria-hidden className="size-4 shrink-0 text-(--s-primary)" />}
            </button>
          );
        })}
      </div>
      <hr className="mx-3 border-(--s-line-soft)" />
      <div className="flex flex-col p-2 pt-1">
        <a href={`/api/stores/${selected.id}/view`} target="_blank" rel="noopener noreferrer" className={ACTION} onClick={close}>
          <ExternalLink aria-hidden />
          {t("viewStore")}
        </a>
        <Link
          href={canCreate ? "/stores?create=1" : "/stores"}
          aria-disabled={!canCreate || undefined}
          className={cn(ACTION, !canCreate && "pointer-events-none opacity-60")}
          onClick={close}
        >
          <Plus aria-hidden />
          <span className="flex-1">{t("createStore")}</span>
          <span className="font-montserrat text-xs font-medium text-(--s-subtle)">
            {t("storeUsage", { count: stores.length, max: maxStores })}
          </span>
        </Link>
        <Link href="/stores" className={ACTION} onClick={close}>
          <Store aria-hidden />
          {t("manageStores")}
        </Link>
      </div>
    </AnchoredSheet>
  );
}
