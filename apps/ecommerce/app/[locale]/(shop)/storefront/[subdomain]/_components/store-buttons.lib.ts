/**
 * The storefront's solid button: the store's brand color, not Tallaby's. The
 * shared `Button` default variant is `bg-accent` (the marketplace's color), and
 * the storefront tokens only remap `--primary`, so store buttons that use the
 * default variant add this class to follow the seller's design system.
 */
export const STORE_SOLID_BUTTON =
  "border-0 bg-(--sf-brand) text-(--sf-brand-ink) shadow-none hover:bg-[color-mix(in_srgb,var(--sf-brand)_86%,#000)] hover:text-(--sf-brand-ink)";
