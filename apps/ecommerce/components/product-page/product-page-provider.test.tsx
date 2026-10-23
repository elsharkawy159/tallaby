import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Product } from "./product-page.types";

const cartItems: { productId: string; quantity: number; savedForLater?: boolean; variant: { id: string } | null }[] = [];

vi.mock("@/providers/cart-provider", () => ({ useCart: () => ({ cartItems }) }));
vi.mock("next-intl", () => ({ useLocale: () => "en" }));
vi.mock("./variant-deep-link.client", () => ({ VariantDeepLink: () => null }));

const { createVariantStore, stickyBuyBarClass } = await import("./product-page.lib");
const { ProductPageProvider, useProductPage } = await import("./product-page-provider.client");

const variants = [
  { id: "v-red", title: "Red", option1: "Color: Red", isDefault: true, stock: 3 },
  { id: "v-blue", title: "Blue", option1: "Color: Blue", stock: 5 },
] as unknown as NonNullable<Product["productVariants"]>;

const product = { id: "p-1", slug: "shirt", productVariants: variants } as unknown as Product;

describe("variant store", () => {
  it("selecting variant updates every subscriber", () => {
    const store = createVariantStore("v-red");
    const seen: (string | null)[][] = [[], []];
    store.subscribe(() => seen[0]!.push(store.getSnapshot()));
    store.subscribe(() => seen[1]!.push(store.getSnapshot()));

    store.pick("v-blue");

    expect(store.getSnapshot()).toBe("v-blue");
    expect(seen).toEqual([["v-blue"], ["v-blue"]]);
  });

  it("?variant= deep link selects on mount", () => {
    const store = createVariantStore("v-red");
    // What VariantDeepLink hands over after hydration: a colour slug or a variant id.
    store.applyToken("blue", variants, "en");
    expect(store.getSnapshot()).toBe("v-blue");
    store.applyToken("v-red", variants, "en");
    expect(store.getSnapshot()).toBe("v-red");
    store.applyToken("no-such-variant", variants, "en");
    expect(store.getSnapshot()).toBe("v-red");
  });

  it("stops following the deep link once the shopper picks", () => {
    const store = createVariantStore("v-red");
    store.pick("v-blue");
    store.applyToken("red", variants, "en");
    expect(store.getSnapshot()).toBe("v-blue");
  });
});

function Probe({ name }: { name: string }) {
  const { variant, inCart, cartQuantity } = useProductPage();
  return (
    <i>
      {name}:{variant?.id ?? "none"}:{String(inCart)}:{cartQuantity}
    </i>
  );
}

describe("stickyBuyBarClass", () => {
  it("keeps the marketplace bar's classes exactly, and the store bar without its md margins", () => {
    expect(stickyBuyBarClass("md:mb-2 md:mt-6")).toBe(
      "fixed right-0 bottom-[79px] left-0 z-50 transition-[bottom] duration-300 ease-out [html[data-bottom-nav=hidden]_&]:bottom-0 border-t border-gray-200 bg-white px-3 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] md:relative md:bottom-0 md:z-auto md:mb-2 md:mt-6 md:border-0 md:bg-transparent md:p-0 md:shadow-none",
    );
    expect(stickyBuyBarClass()).not.toContain("md:mt-6");
  });

  it("docks the store bar on the bottom edge with safe-area padding (no bottom nav to clear)", () => {
    const store = stickyBuyBarClass(undefined, { bottomNav: false });
    expect(store).toContain("bottom-0");
    expect(store).not.toContain("bottom-[79px]");
    expect(store).toContain("pb-[calc(0.75rem+env(safe-area-inset-bottom))]");
    expect(store).toContain("md:relative");
    expect(store).toContain("md:p-0");
  });
});

describe("ProductPageProvider", () => {
  it("gives every part the default variant and its cart status", () => {
    cartItems.splice(0, cartItems.length, { productId: "p-1", quantity: 2, variant: { id: "v-red" } });
    const html = renderToStaticMarkup(
      <ProductPageProvider product={product}>
        <Probe name="price" />
        <Probe name="buy" />
      </ProductPageProvider>,
    );
    expect(html).toContain("price:v-red:true:2");
    expect(html).toContain("buy:v-red:true:2");
  });

  it("a product without variants has no variant and checks the base item", () => {
    cartItems.splice(0, cartItems.length, { productId: "p-1", quantity: 1, variant: { id: "v-red" } });
    const html = renderToStaticMarkup(
      <ProductPageProvider product={{ ...product, productVariants: [] }}>
        <Probe name="buy" />
      </ProductPageProvider>,
    );
    expect(html).toContain("buy:none:false:0");
  });
});
