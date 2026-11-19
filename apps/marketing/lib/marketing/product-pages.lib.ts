import {
  AppWindow,
  Banknote,
  ChartColumnBig,
  Bell,
  Boxes,
  Brush,
  ChartNoAxesCombined,
  ClipboardList,
  CreditCard,
  Download,
  FileSpreadsheet,
  Gift,
  Globe,
  HandCoins,
  Languages,
  LayoutTemplate,
  Layers,
  Mail,
  MapPin,
  MessageCircle,
  MonitorSmartphone,
  MousePointerClick,
  Package,
  PackageCheck,
  Percent,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Tag,
  Target,
  Trash2,
  Truck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * tallaby.com's product pages (Shopify-style "Build your website / Run your
 * business / Marketing & analytics / Get paid") at /features/[slug], next to
 * the older detail pages in detail-pages.lib.ts. One entry here plus one
 * `productPages.<slug>` block and one `meta.feature-<slug>` in
 * messages/marketing/features.<locale>.json adds a page. Claim only live
 * features (ROADMAP.md, docs/marketing-site-rules.md): check the code first.
 */

/** The four menu groups. Words are under `nav.productMenu.areas` (site group) and `featuresHub.categories`. */
export const PRODUCT_AREAS = ["build", "run", "market", "paid"] as const;
export type ProductArea = (typeof PRODUCT_AREAS)[number];

/**
 * The picture beside a section. `dash`: a coded dashboard screen drawn from the
 * page's `mock` words (see product-shots.tsx); `screens`: real template card
 * screenshots (public/template-previews); `phone`: a template's phone
 * screenshot with the store app's install button.
 */
export type ProductVisual = { kind: "dash"; active: string } | { kind: "screens"; templates: readonly [string, string] } | { kind: "phone"; template: string };

export type ProductPage = {
  slug: string;
  area: ProductArea;
  icon: LucideIcon;
  featured?: boolean;
  hero: ProductVisual;
  /** One per `rows` entry in the messages, in order. */
  rows: readonly { icon: LucideIcon; visual: ProductVisual; href?: string }[];
  /** One icon per `grid` entry in the messages. */
  grid: readonly LucideIcon[];
  /** Only real pages. Titles are in the messages, in this order. */
  related: readonly { href: string; icon: LucideIcon }[];
  /**
   * Image slot for a spot illustration (docs/marketing/homepage-images.md,
   * "Product pages"): a path under public/, shown at the hero's corner once the
   * owner delivers it. Unset: nothing is drawn.
   */
  art?: string;
};

export const PRODUCT_PAGES: readonly ProductPage[] = [
  // Build your website
  {
    slug: "store-design",
    area: "build",
    icon: Brush,
    featured: true,
    hero: { kind: "screens", templates: ["vella", "furniture-luxe"] },
    rows: [
      { icon: MousePointerClick, visual: { kind: "dash", active: "website" } },
      { icon: LayoutTemplate, visual: { kind: "screens", templates: ["zahra", "volt"] }, href: "/templates" },
      { icon: MonitorSmartphone, visual: { kind: "dash", active: "website" } },
    ],
    grid: [Languages, Layers, ShoppingBag, ClipboardList, Search, Globe],
    related: [
      { href: "/templates", icon: LayoutTemplate },
      { href: "/features/custom-domain", icon: Globe },
      { href: "/features/store-app", icon: Smartphone },
      { href: "/features/ai-online-store", icon: Sparkles },
    ],
  },
  {
    slug: "store-app",
    area: "build",
    icon: Smartphone,
    hero: { kind: "phone", template: "zahra" },
    rows: [
      { icon: Download, visual: { kind: "dash", active: "website" } },
      { icon: AppWindow, visual: { kind: "phone", template: "qahwa" } },
    ],
    grid: [Smartphone, Brush, Globe, RefreshCw],
    related: [
      { href: "/features/store-design", icon: Brush },
      { href: "/features/custom-domain", icon: Globe },
      { href: "/solutions/create-online-store", icon: MousePointerClick },
      { href: "/pricing", icon: Receipt },
    ],
  },
  // Run your business
  {
    slug: "product-management",
    area: "run",
    icon: Package,
    featured: true,
    hero: { kind: "dash", active: "products" },
    rows: [
      { icon: FileSpreadsheet, visual: { kind: "dash", active: "products" } },
      { icon: Layers, visual: { kind: "dash", active: "products" } },
      { icon: Boxes, visual: { kind: "dash", active: "products" } },
    ],
    grid: [Tag, Trash2, Package, ClipboardList, Sparkles, ShoppingCart],
    related: [
      { href: "/features/ai-online-store", icon: Sparkles },
      { href: "/features/order-management", icon: ShoppingBag },
      { href: "/features/offers-and-coupons", icon: Percent },
      { href: "/integrations", icon: RefreshCw },
    ],
  },
  {
    slug: "order-management",
    area: "run",
    icon: ShoppingBag,
    featured: true,
    hero: { kind: "dash", active: "orders" },
    rows: [
      { icon: ClipboardList, visual: { kind: "dash", active: "orders" } },
      { icon: Printer, visual: { kind: "dash", active: "orders" } },
      { icon: Users, visual: { kind: "dash", active: "orders" } },
    ],
    grid: [MessageCircle, Bell, Download, ShoppingCart, ShieldCheck, PackageCheck],
    related: [
      { href: "/features/shipping", icon: Truck },
      { href: "/features/fake-order-protection", icon: ShieldCheck },
      { href: "/features/abandoned-checkouts", icon: ShoppingCart },
      { href: "/features/email-marketing", icon: Mail },
    ],
  },
  // Marketing & analytics
  {
    slug: "offers-and-coupons",
    area: "market",
    icon: Percent,
    featured: true,
    hero: { kind: "dash", active: "home" },
    rows: [
      { icon: Tag, visual: { kind: "dash", active: "home" } },
      { icon: Layers, visual: { kind: "dash", active: "products" } },
      { icon: Gift, visual: { kind: "dash", active: "home" } },
    ],
    grid: [Users, Boxes, Banknote, ShoppingCart],
    related: [
      { href: "/features/email-marketing", icon: Mail },
      { href: "/features/product-management", icon: Package },
      { href: "/tools/profit-margin-calculator", icon: Percent },
      { href: "/pricing", icon: Receipt },
    ],
  },
  {
    slug: "email-marketing",
    area: "market",
    icon: Mail,
    hero: { kind: "dash", active: "home" },
    rows: [
      { icon: Mail, visual: { kind: "dash", active: "home" } },
      { icon: RefreshCw, visual: { kind: "dash", active: "home" } },
      { icon: Bell, visual: { kind: "dash", active: "home" } },
    ],
    grid: [Users, Brush, Target, ShoppingCart],
    related: [
      { href: "/features/offers-and-coupons", icon: Percent },
      { href: "/features/order-management", icon: Users },
      { href: "/features/abandoned-checkouts", icon: ShoppingCart },
      { href: "/pricing", icon: Receipt },
    ],
  },
  {
    slug: "reports",
    area: "market",
    icon: ChartColumnBig,
    hero: { kind: "dash", active: "home" },
    rows: [
      { icon: ChartNoAxesCombined, visual: { kind: "dash", active: "home" } },
      { icon: MapPin, visual: { kind: "dash", active: "home" } },
      { icon: Target, visual: { kind: "dash", active: "apps" }, href: "/integrations/meta-pixel" },
    ],
    grid: [Package, FileSpreadsheet, Users, ShoppingCart],
    related: [
      { href: "/integrations/meta-pixel", icon: Target },
      { href: "/features/order-management", icon: ShoppingBag },
      { href: "/features/store-seo", icon: Search },
      { href: "/integrations", icon: AppWindow },
    ],
  },
  {
    slug: "store-seo",
    area: "market",
    icon: Search,
    hero: { kind: "dash", active: "website" },
    rows: [
      { icon: Search, visual: { kind: "dash", active: "website" } },
      { icon: Sparkles, visual: { kind: "dash", active: "products" }, href: "/features/ai-online-store" },
      { icon: Globe, visual: { kind: "dash", active: "website" } },
    ],
    grid: [Languages, LayoutTemplate, Globe, Smartphone],
    related: [
      { href: "/features/ai-online-store", icon: Sparkles },
      { href: "/features/custom-domain", icon: Globe },
      { href: "/features/store-design", icon: Brush },
      { href: "/blog", icon: ClipboardList },
    ],
  },
  // Get paid
  {
    slug: "online-payments",
    area: "paid",
    icon: Wallet,
    featured: true,
    hero: { kind: "dash", active: "home" },
    rows: [
      { icon: Banknote, visual: { kind: "dash", active: "shipping" }, href: "/solutions/cash-on-delivery-store" },
      { icon: HandCoins, visual: { kind: "dash", active: "home" } },
      { icon: CreditCard, visual: { kind: "dash", active: "apps" }, href: "/integrations/paymob" },
    ],
    grid: [Wallet, ShieldCheck, Globe, Receipt],
    related: [
      { href: "/solutions/cash-on-delivery-store", icon: Banknote },
      { href: "/integrations/paymob", icon: CreditCard },
      { href: "/integrations/kashier", icon: CreditCard },
      { href: "/features/fake-order-protection", icon: ShieldCheck },
    ],
  },
];

export const findProductPage = (slug: string) => PRODUCT_PAGES.find((page) => page.slug === slug);

/**
 * The header's product menu and the footer's product links: every page of
 * each group, new or older. `id` is the `nav.productMenu.items.<id>` message.
 */
export const PRODUCT_MENU: Record<ProductArea, readonly { id: string; href: string; icon: LucideIcon }[]> = {
  build: [
    { id: "store-design", href: "/features/store-design", icon: Brush },
    { id: "templates", href: "/templates", icon: LayoutTemplate },
    { id: "custom-domain", href: "/features/custom-domain", icon: Globe },
    { id: "store-app", href: "/features/store-app", icon: Smartphone },
    { id: "ai-online-store", href: "/features/ai-online-store", icon: Sparkles },
  ],
  run: [
    { id: "product-management", href: "/features/product-management", icon: Package },
    { id: "order-management", href: "/features/order-management", icon: ShoppingBag },
    { id: "shipping", href: "/features/shipping", icon: Truck },
    { id: "fake-order-protection", href: "/features/fake-order-protection", icon: ShieldCheck },
    { id: "abandoned-checkouts", href: "/features/abandoned-checkouts", icon: ShoppingCart },
  ],
  market: [
    { id: "offers-and-coupons", href: "/features/offers-and-coupons", icon: Percent },
    { id: "email-marketing", href: "/features/email-marketing", icon: Mail },
    { id: "reports", href: "/features/reports", icon: ChartColumnBig },
    { id: "store-seo", href: "/features/store-seo", icon: Search },
    { id: "meta-pixel", href: "/integrations/meta-pixel", icon: Target },
  ],
  paid: [
    { id: "online-payments", href: "/features/online-payments", icon: Wallet },
    { id: "cash-on-delivery", href: "/solutions/cash-on-delivery-store", icon: Banknote },
    { id: "paymob", href: "/integrations/paymob", icon: CreditCard },
    { id: "kashier", href: "/integrations/kashier", icon: CreditCard },
  ],
};

/** The group a feature path belongs to, for the sibling links on its page. */
export function areaOfHref(href: string): ProductArea | null {
  return PRODUCT_AREAS.find((area) => PRODUCT_MENU[area].some((item) => item.href === href)) ?? null;
}
