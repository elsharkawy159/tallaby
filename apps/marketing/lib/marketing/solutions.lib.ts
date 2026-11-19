import {
  Ban,
  Banknote,
  Bike,
  Calculator,
  CalendarX,
  ChartNoAxesCombined,
  CodeXml,
  CreditCard,
  Globe,
  Languages,
  LayoutTemplate,
  MapPin,
  MessageCircle,
  MousePointerClick,
  PlugZap,
  Receipt,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * Keyword landing pages at /solutions/[slug]. One entry here plus one
 * `solutionPages.<slug>` block in the messages adds a page. Keep the money
 * pages first: the footer lists the first three.
 */

/** The dashboard scene behind the hero's phone (SEO_PLAN.md §9.0). Its words are under `solutionPages.<slug>.dashboard`. */
export type DashboardScene = "orders" | "plan" | "zones";

/** The small picture above each step, in message order. Words are under `solutionPages.shared` and the page's `stepMock`. */
export type SolutionStepVisual = "link" | "template" | "product" | "publish" | "cod" | "zones" | "confirm";

/** The /solutions hub's chips. Words are under `solutionsHub.categories`. */
export const SOLUTION_GROUPS = ["start", "sell"] as const;
export type SolutionGroup = (typeof SOLUTION_GROUPS)[number];

export type Solution = {
  slug: string;
  group: SolutionGroup;
  /** One of the hub's featured cards. */
  featured?: boolean;
  /** `store` is an `INDUSTRIES` slug for the phone's store mock (clothing until it has no entry). */
  stage: { store: string; dashboard: DashboardScene };
  stepVisuals: readonly SolutionStepVisual[];
  trustIcons: readonly LucideIcon[];
  featureIcons: readonly LucideIcon[];
  /** A feature card's own page, in the same order; null = no page yet. */
  featureHrefs?: readonly (string | null)[];
  /** Show the "Tallaby vs a developer" cost table (`cost`, `costTitle` in the messages). */
  cost?: boolean;
  /** Only real pages. Titles are in the messages, in this order. */
  related: readonly { href: string; icon: LucideIcon }[];
};

export const SOLUTIONS: readonly Solution[] = [
  {
    slug: "free-online-store",
    group: "start",
    featured: true,
    stage: { store: "beauty-store", dashboard: "plan" },
    stepVisuals: ["link", "template", "product", "publish"],
    trustIcons: [CalendarX, Receipt, ShoppingCart, Wallet],
    featureIcons: [Sparkles, LayoutTemplate, Banknote, Globe],
    featureHrefs: ["/features/ai-online-store", "/templates", "/solutions/cash-on-delivery-store", "/features/custom-domain"],
    cost: true,
    related: [
      { href: "/pricing", icon: Receipt },
      { href: "/solutions/online-store-egypt", icon: MapPin },
      { href: "/tools/store-cost-calculator", icon: Calculator },
      { href: "/templates", icon: LayoutTemplate },
    ],
  },
  {
    slug: "online-store-egypt",
    group: "start",
    featured: true,
    stage: { store: "clothing-store", dashboard: "zones" },
    stepVisuals: ["link", "product", "zones", "publish"],
    trustIcons: [Banknote, Truck, CreditCard, MapPin],
    featureIcons: [Banknote, Truck, CreditCard, MapPin, ShieldCheck, Languages],
    featureHrefs: ["/solutions/cash-on-delivery-store", "/integrations/bosta", "/integrations/paymob", "/features/shipping", "/features/fake-order-protection", null],
    related: [
      { href: "/solutions/free-online-store", icon: Wallet },
      { href: "/integrations/bosta", icon: Truck },
      { href: "/integrations/kashier", icon: CreditCard },
      { href: "/tools/store-cost-calculator", icon: Calculator },
    ],
  },
  {
    slug: "create-online-store",
    group: "start",
    stage: { store: "clothing-store", dashboard: "orders" },
    stepVisuals: ["link", "template", "product", "publish"],
    trustIcons: [CalendarX, Receipt, CodeXml, Languages],
    featureIcons: [Sparkles, LayoutTemplate, MousePointerClick, Globe, CreditCard, Truck, ChartNoAxesCombined, Search],
    featureHrefs: ["/features/ai-online-store", "/templates", null, "/features/custom-domain", "/integrations/paymob", "/features/shipping", "/integrations/meta-pixel", null],
    cost: true,
    related: [
      { href: "/solutions/free-online-store", icon: Wallet },
      { href: "/features/ai-online-store", icon: Sparkles },
      { href: "/integrations", icon: PlugZap },
      { href: "/pricing", icon: Receipt },
    ],
  },
  {
    slug: "cash-on-delivery-store",
    group: "sell",
    featured: true,
    stage: { store: "food-store", dashboard: "orders" },
    stepVisuals: ["cod", "zones", "confirm", "publish"],
    trustIcons: [Banknote, MessageCircle, Ban, MapPin],
    featureIcons: [Banknote, MessageCircle, ShieldCheck, ShoppingCart, Truck, Bike],
    featureHrefs: [null, "/features/fake-order-protection", "/features/fake-order-protection", "/features/abandoned-checkouts", "/integrations/bosta", "/features/shipping"],
    related: [
      { href: "/features/fake-order-protection", icon: ShieldCheck },
      { href: "/features/shipping", icon: Truck },
      { href: "/integrations/bosta", icon: Truck },
      { href: "/features/abandoned-checkouts", icon: ShoppingCart },
    ],
  },
];

export const findSolution = (slug: string) => SOLUTIONS.find((solution) => solution.slug === slug);
