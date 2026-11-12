"use client";

import {
  createContext,
  Suspense,
  use,
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useLocale } from "next-intl";
import { getDefaultProductVariantId } from "@/lib/product-variants";
import { getVariantColor } from "@/lib/variant-colors";
import type { ProductLocale } from "@/lib/product-translations";
import { useCart } from "@/providers/cart-provider";
import { VariantDeepLink } from "./variant-deep-link.client";
import { cartStatusFor, createVariantStore, type ProductVariant } from "./product-page.lib";
import {
  parseCustomerFields,
  previewExtrasPiastres,
  validateCustomerInputs,
  type CustomerField,
  type CustomerInputError,
  type CustomerInputValue,
} from "@workspace/lib/products/customer-fields";
import type { Product } from "./product-page.types";

type ProductPageState = {
  product: Product;
  /** The selected variant's id (null: the base product). */
  variantId: string | null;
  variant: ProductVariant | null;
  /** The shopper picks a variant; `?variant=` follows. */
  selectVariant: (variantId: string | null) => void;
  /** The selected variant (or the base product) is in the cart. */
  inCart: boolean;
  /** Its quantity in the cart (0 when it is not). */
  cartQuantity: number;
  /** Resolves a `?variant=` token (see `ProductPageDeepLink`). */
  applyVariantToken: (token: string) => void;
  /** The product's "Customer requirements" (F-91) and what the shopper filled. */
  customer: CustomerInputsState;
};

export type CustomerInputsState = {
  fields: CustomerField[];
  values: Record<string, CustomerInputValue>;
  setValue: (fieldId: string, value: Omit<CustomerInputValue, "fieldId">) => void;
  errors: Record<string, CustomerInputError["code"]>;
  setErrors: (errors: CustomerInputError[]) => void;
  /** Extras of what is filled so far (piastres), for the live price. */
  extrasPiastres: number;
  /** A photo is still uploading: the add buttons wait. */
  uploading: boolean;
  setUploading: (fieldId: string, busy: boolean) => void;
  /**
   * Checks the values (the server checks them again) and returns them, or
   * marks the fields, scrolls to the first and returns null.
   */
  collect: () => CustomerInputValue[] | null;
};

const ProductPageContext = createContext<ProductPageState | null>(null);

/**
 * The selected variant of a product page and its cart status, shared by
 * every part of the page (the marketplace `ProductDisplay`, and the store
 * product page's gallery, price, stock, picker and buy box wherever the
 * seller put them). Lifted from `ProductDisplay` unchanged.
 */
export function ProductPageProvider({ product, children }: { product: Product; children: ReactNode }) {
  const { cartItems } = useCart();
  const locale = useLocale() as ProductLocale;
  const [store] = useState(() => createVariantStore(getDefaultProductVariantId(product.productVariants)));
  const selectedVariantId = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  // `?variant=red` from a product-card swatch — resolved after hydration so the
  // page keeps its static shell.
  const applyVariantToken = useCallback(
    (token: string) => store.applyToken(token, product.productVariants, locale),
    [store, product.productVariants, locale]
  );

  // Mirror the selection into `?variant=` via the native History API, which
  // Next syncs with useSearchParams without a server round trip — so the page
  // stays prerendered and the URL stays shareable.
  const selectVariant = useCallback(
    (variantId: string | null) => {
      store.pick(variantId);

      if (typeof window === "undefined") return;

      const variant = variantId
        ? product.productVariants?.find((v) => v.id === variantId)
        : null;
      // Colors give a readable token; anything else falls back to the id,
      // which findVariantIdByToken also resolves.
      const token = variant
        ? (getVariantColor(variant, locale)?.slug ?? variant.id)
        : null;

      const params = new URLSearchParams(window.location.search);
      if (token) params.set("variant", token);
      else params.delete("variant");

      const query = params.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`
      );
    },
    [store, product.productVariants, locale]
  );

  const variant = useMemo(() => {
    if (!selectedVariantId || !product.productVariants) return null;
    return (
      product.productVariants.find((v) => v.id === selectedVariantId) ?? null
    );
  }, [selectedVariantId, product.productVariants]);

  // Customer requirements (F-91): one set of values for the whole page, so the
  // price, the form and every add button (in-page and the phone dock) agree.
  const customerFields = useMemo(() => parseCustomerFields(product.customerFields), [product.customerFields]);
  const [customerValues, setCustomerValues] = useState<Record<string, CustomerInputValue>>({});
  const [customerErrors, setCustomerErrorMap] = useState<Record<string, CustomerInputError["code"]>>({});
  const [uploadingFields, setUploadingFields] = useState<Set<string>>(() => new Set());
  const customer = useMemo<CustomerInputsState>(() => {
    const list = Object.values(customerValues);
    return {
      fields: customerFields,
      values: customerValues,
      setValue: (fieldId, value) => {
        setCustomerValues((current) => ({ ...current, [fieldId]: { ...value, fieldId } }));
        setCustomerErrorMap((current) => {
          if (!current[fieldId]) return current;
          const rest = { ...current };
          delete rest[fieldId];
          return rest;
        });
      },
      errors: customerErrors,
      setErrors: (errors) => {
        setCustomerErrorMap(Object.fromEntries(errors.map((error) => [error.fieldId, error.code])));
        scrollToCustomerField(errors[0]?.fieldId);
      },
      extrasPiastres: previewExtrasPiastres(customerFields, list),
      uploading: uploadingFields.size > 0,
      setUploading: (fieldId, busy) =>
        setUploadingFields((current) => {
          const next = new Set(current);
          if (busy) next.add(fieldId);
          else next.delete(fieldId);
          return next;
        }),
      collect: () => {
        if (!customerFields.length) return [];
        // Empty values are left out; the client can't know the upload folder, the server checks it.
        const result = validateCustomerInputs(customerFields, list, { uploadPrefix: null });
        if (result.ok) {
          setCustomerErrorMap({});
          return list;
        }
        setCustomerErrorMap(Object.fromEntries(result.errors.map((error) => [error.fieldId, error.code])));
        scrollToCustomerField(result.errors[0]?.fieldId);
        return null;
      },
    };
  }, [customerFields, customerValues, customerErrors, uploadingFields]);

  // Check if the selected variant (or base product if no variant) is in cart.
  // A product with customer requirements is never "in the cart": every add is
  // its own line (another name or photo), so the add button always stays.
  const cartStatus = useMemo(
    () =>
      customerFields.length
        ? { isInCart: false, quantity: 0 }
        : cartStatusFor(cartItems, product.id, selectedVariantId),
    [cartItems, product.id, selectedVariantId, customerFields.length]
  );

  const value = useMemo<ProductPageState>(
    () => ({
      product,
      variantId: selectedVariantId,
      variant,
      selectVariant,
      inCart: cartStatus.isInCart,
      cartQuantity: cartStatus.quantity,
      applyVariantToken,
      customer,
    }),
    [product, selectedVariantId, variant, selectVariant, cartStatus, applyVariantToken, customer]
  );

  return <ProductPageContext value={value}>{children}</ProductPageContext>;
}

/** The page's state, or null outside a product page (product cards). */
export function useOptionalProductPage(): ProductPageState | null {
  return use(ProductPageContext);
}

/** Brings the first field to fix into view (the phone dock hides the form). */
function scrollToCustomerField(fieldId: string | undefined) {
  if (!fieldId || typeof document === "undefined") return;
  requestAnimationFrame(() => {
    const el = document.getElementById(`customer-field-${fieldId}`);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    el.querySelector<HTMLElement>("input, textarea, button")?.focus({ preventScroll: true });
  });
}

export function useProductPage(): ProductPageState {
  const state = use(ProductPageContext);
  if (!state) throw new Error("useProductPage must be used inside ProductPageProvider");
  return state;
}

/**
 * Applies `?variant=` to the page's selection. Rendered once per page, in
 * its own <Suspense> boundary (see `VariantDeepLink`).
 */
export function ProductPageDeepLink() {
  const { applyVariantToken } = useProductPage();
  return (
    <Suspense fallback={null}>
      <VariantDeepLink onToken={applyVariantToken} />
    </Suspense>
  );
}
