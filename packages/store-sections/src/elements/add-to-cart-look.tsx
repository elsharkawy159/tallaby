import { ShoppingCart } from "lucide-react";
import type { AddToCartLook } from "../core/types";

/**
 * Still drawings of an `addToCart` node's looks (the editor, and the template
 * preview), matching the storefront's card button
 * (`store-card-add-to-cart.client.tsx`). The solid `button` look keeps each
 * host's own drawing, so this covers the other looks only.
 */
export const ADD_TO_CART_STILL_CLASS: Record<Exclude<AddToCartLook, "button">, string> = {
  outline:
    "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border-[1.5px] border-(--sf-brand) bg-transparent px-3 text-sm font-medium whitespace-nowrap text-(--sf-brand)",
  icon: "inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-(--sf-brand) text-(--sf-brand-ink,#fff) md:size-9",
  text: "inline-flex items-center gap-1 text-sm font-medium whitespace-nowrap text-(--sf-brand) underline underline-offset-4",
};

/** The editor's still `addToCart`: the solid button exactly as before, else the chosen look. */
export function AddToCartStill({ look, label }: { look: AddToCartLook; label: string }) {
  if (look === "button") {
    return (
      <span className="inline-flex h-9 items-center justify-center rounded-(--sf-radius,12px) bg-(--sf-brand) px-4 text-xs font-semibold text-(--sf-brand-ink,#fff) opacity-70">
        {label}
      </span>
    );
  }
  return <AddToCartLookStill look={look} label={label} />;
}

/** A non-solid look drawn still: the icon look carries its label as screen-reader text. */
export function AddToCartLookStill({ look, label }: { look: Exclude<AddToCartLook, "button">; label: string }) {
  if (look === "icon") {
    return (
      <span className={ADD_TO_CART_STILL_CLASS.icon}>
        <ShoppingCart className="size-4 shrink-0" aria-hidden />
        <span className="sr-only">{label}</span>
      </span>
    );
  }
  return (
    <span className={ADD_TO_CART_STILL_CLASS[look]}>
      {look === "outline" && <ShoppingCart className="size-3.5 shrink-0 md:size-4" aria-hidden />}
      <span>{label}</span>
    </span>
  );
}
