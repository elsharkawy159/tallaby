import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ImageOff, Search } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import { RemoteImage } from "@/components/media/remote-image";
import { StoreProductsAccessError } from "./store-products-access.server";
import { loadStoreProducts } from "./store-products.data";
import { STORE_PRODUCTS_PAGE_SIZE, STORE_PRODUCT_STATUS_FILTERS, parseStoreProductsParams, type StoreProductStatusFilter } from "./store-products.lib";
import { AddStoreProductButton, StoreProductRowActions } from "./store-products.client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const FILTER_LABELS: Record<StoreProductStatusFilter, string> = { all: "All", active: "Live", draft: "Drafts", trash: "Trash" };

/**
 * Admin › Store › Products: the store's own products, and adding new ones by
 * hand or with AI, so an admin can build a store for its seller. Products are
 * written as the store's seller through the same commands the seller's tools
 * use; editing opens the existing product editor.
 */
export default async function StoreProductsPage({ params, searchParams }: PageProps) {
  const { storeId } = await params;
  const filters = parseStoreProductsParams(await searchParams);
  let data;
  try {
    data = await loadStoreProducts(storeId, filters);
  } catch (error) {
    if (error instanceof StoreProductsAccessError) notFound();
    throw error;
  }
  const { store, items, total } = data;
  const pages = Math.max(1, Math.ceil(total / STORE_PRODUCTS_PAGE_SIZE));
  const href = (next: Partial<typeof filters>) => {
    const merged = { ...filters, ...next };
    const query = new URLSearchParams();
    if (merged.query) query.set("q", merged.query);
    if (merged.status !== "all") query.set("status", merged.status);
    if (merged.page > 1) query.set("page", String(merged.page));
    const qs = query.toString();
    return `/stores/${store.id}/products${qs ? `?${qs}` : ""}`;
  };
  const writable = data.canWrite && store.status === "active";

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link href={`/stores/${store.id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" aria-hidden />
          {store.name}
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
            <p className="text-sm text-muted-foreground">
              Added here, a product belongs to this store as if the seller made it. Prices are in {store.currencyLabel}.
            </p>
          </div>
          {writable ? (
            <AddStoreProductButton
              storeId={store.id}
              currencyLabel={store.currencyLabel}
              sellerCanPublish={data.sellerCanPublish}
              storeCategories={data.storeCategories}
            />
          ) : null}
        </div>
        {!writable ? (
          <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
            {data.canWrite ? "This store is archived or suspended, so its products can't be changed." : "Only admins can change products. You can look but not edit."}
          </p>
        ) : !data.sellerCanPublish ? (
          <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
            The seller&apos;s account is not approved yet, so new products are saved as drafts.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filter by status" className="flex gap-1 rounded-md bg-muted p-1">
          {STORE_PRODUCT_STATUS_FILTERS.map((status) => (
            <Link
              key={status}
              href={href({ status, page: 1 })}
              aria-current={filters.status === status ? "page" : undefined}
              className={cn(
                "rounded px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                filters.status === status && "bg-background font-medium text-foreground shadow-sm",
              )}
            >
              {FILTER_LABELS[status]}
            </Link>
          ))}
        </nav>
        <form action={`/stores/${store.id}/products`} className="relative w-full sm:w-72">
          {filters.status !== "all" ? <input type="hidden" name="status" value={filters.status} /> : null}
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input name="q" defaultValue={filters.query} placeholder="Search by name or SKU" className="ps-8" aria-label="Search products" />
        </form>
      </div>

      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="font-medium">{filters.query || filters.status !== "all" ? "No products match." : "This store has no products yet."}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {filters.query || filters.status !== "all"
                  ? "Clear the search or pick another status."
                  : writable
                    ? "Add the first one with AI from a few photos, or by hand."
                    : "Products the seller adds show here."}
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-md border bg-muted">
                    {item.image ? (
                      <RemoteImage src={item.image} alt="" fill sizes="56px" className="object-cover" />
                    ) : (
                      <ImageOff className="absolute inset-0 m-auto size-5 text-muted-foreground" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${item.id}`} className="block truncate font-medium hover:underline">
                      {item.title.en || item.title.ar || "Untitled"}
                    </Link>
                    {item.title.ar && item.title.en ? (
                      <p className="truncate text-sm text-muted-foreground" dir="rtl">
                        {item.title.ar}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.sku ? <span dir="ltr">{item.sku}</span> : null}
                      {item.variants ? <span className="ms-2">{item.variants} variants</span> : null}
                    </p>
                  </div>
                  <div className="hidden w-28 text-end text-sm tabular-nums sm:block">
                    <div className="font-medium">
                      {item.price.toLocaleString("en", { maximumFractionDigits: 2 })} {store.currencyLabel}
                    </div>
                    {item.compareAtPrice ? (
                      <div className="text-xs text-muted-foreground line-through">{item.compareAtPrice.toLocaleString("en", { maximumFractionDigits: 2 })}</div>
                    ) : null}
                  </div>
                  <div className="hidden w-20 text-end text-sm tabular-nums md:block">
                    {item.trackStock ? (
                      <span className={item.stock === 0 ? "text-destructive" : undefined}>{item.stock.toLocaleString("en")} in stock</span>
                    ) : (
                      <span className="text-muted-foreground">Unlimited</span>
                    )}
                  </div>
                  <div className="w-16 shrink-0">
                    <StatusBadge status={item.status} inTrash={item.inTrash} />
                  </div>
                  <StoreProductRowActions
                    storeId={store.id}
                    productId={item.id}
                    status={item.status}
                    inTrash={item.inTrash}
                    hasImage={Boolean(item.image)}
                    canWrite={writable}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {pages > 1 ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total.toLocaleString("en")} products, page {filters.page} of {pages}
          </span>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className={cn(filters.page <= 1 && "pointer-events-none opacity-50")}>
              <Link href={href({ page: filters.page - 1 })} aria-disabled={filters.page <= 1}>
                Previous
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className={cn(filters.page >= pages && "pointer-events-none opacity-50")}>
              <Link href={href({ page: filters.page + 1 })} aria-disabled={filters.page >= pages}>
                Next
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusBadge({ status, inTrash }: { status: string; inTrash: boolean }) {
  if (inTrash) return <Badge variant="outline">Trash</Badge>;
  if (status === "active") return <Badge>Live</Badge>;
  if (status === "rejected") return <Badge variant="destructive">Removed</Badge>;
  return <Badge variant="secondary">Draft</Badge>;
}
