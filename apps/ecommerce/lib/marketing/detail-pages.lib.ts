import {
  Activity,
  BadgeCheck,
  Ban,
  Banknote,
  Bike,
  Bot,
  Calculator,
  ChartNoAxesCombined,
  CreditCard,
  FileSpreadsheet,
  Gauge,
  Globe,
  KeyRound,
  Languages,
  LayoutTemplate,
  MapPin,
  Megaphone,
  MessageCircle,
  MousePointerClick,
  PackageCheck,
  Phone,
  PlugZap,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Target,
  Truck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * /features/[slug] and /integrations/[slug]. One entry here plus one
 * `detailPages.<slug>` block in the messages adds a page. List only what the
 * product really does: check the code first.
 */

/** The hero picture: a coded mock of the exact dashboard screen (detail-shots.tsx). */
export type DetailShot = "domain" | "pixel" | "ai" | "risk" | "missed" | "zones" | "waybill" | "gateway";
export type DetailStepVisual =
  | "registrar"
  | "connect"
  | "dns"
  | "status"
  | "copyId"
  | "openApp"
  | "pasteId"
  | "testEvents"
  | "aiInput"
  | "aiFields"
  | "priceStock"
  | "blockNumber"
  | "riskChip"
  | "whatsapp"
  | "confirmed"
  | "leadForm"
  | "missedRow"
  | "markContacted"
  | "zoneRow"
  | "freeOver"
  | "shipChoice"
  | "connectAccount"
  | "sendOrder"
  | "printWaybill"
  | "trackStatus"
  | "copyKeys"
  | "keyCheck"
  | "cardCheckout";

/** The /features hub's chips (feature pages only). Words are under `featuresHub.categories`. */
export const FEATURE_GROUPS = ["ai", "orders", "shipping", "website"] as const;
export type FeatureGroup = (typeof FEATURE_GROUPS)[number];

export type DetailPage = {
  kind: "feature" | "integration";
  slug: string;
  /** Feature pages: the hub chip it sits under. */
  group?: FeatureGroup;
  featured?: boolean;
  icon: LucideIcon;
  /** The partner's name beside Tallaby's, on integration pages. */
  partner?: string;
  shot: DetailShot;
  /** Icons in message order; a section without icons is left out. */
  benefits?: readonly LucideIcon[];
  uses?: readonly LucideIcon[];
  /** Browser events, named as Meta names them. Descriptions are in the messages. */
  events?: readonly string[];
  steps: readonly DetailStepVisual[];
  /** Only real pages. Titles are in the messages, in this order. */
  related: readonly { href: string; icon: LucideIcon }[];
};

/** Money pages first: the footer lists the first three. */
export const FEATURE_PAGES: readonly DetailPage[] = [
  {
    kind: "feature",
    slug: "ai-online-store",
    group: "ai",
    featured: true,
    icon: Sparkles,
    shot: "ai",
    // Live AI only (SEO_PLAN.md D6): product autofill in both languages, file imports, the MCP product tools. Not the AI Store Builder.
    benefits: [Languages, Search, BadgeCheck],
    uses: [Sparkles, FileSpreadsheet, Bot, Wallet],
    steps: ["aiInput", "aiFields", "priceStock"],
    related: [
      { href: "/solutions/create-online-store", icon: MousePointerClick },
      { href: "/solutions/free-online-store", icon: Wallet },
      { href: "/templates", icon: LayoutTemplate },
      { href: "/pricing", icon: Receipt },
    ],
  },
  {
    kind: "feature",
    slug: "fake-order-protection",
    group: "orders",
    featured: true,
    icon: ShieldCheck,
    shot: "risk",
    uses: [Ban, ShieldAlert, MessageCircle, Gauge],
    steps: ["blockNumber", "riskChip", "whatsapp", "confirmed"],
    related: [
      { href: "/solutions/cash-on-delivery-store", icon: Banknote },
      { href: "/features/abandoned-checkouts", icon: ShoppingCart },
      { href: "/features/shipping", icon: Truck },
      { href: "/integrations/bosta", icon: PackageCheck },
    ],
  },
  {
    kind: "feature",
    slug: "abandoned-checkouts",
    group: "orders",
    icon: ShoppingCart,
    shot: "missed",
    benefits: [Phone, MessageCircle, RefreshCw],
    steps: ["leadForm", "missedRow", "whatsapp", "markContacted"],
    related: [
      { href: "/features/fake-order-protection", icon: ShieldCheck },
      { href: "/solutions/cash-on-delivery-store", icon: Banknote },
      { href: "/integrations/meta-pixel", icon: Activity },
      { href: "/pricing", icon: Receipt },
    ],
  },
  {
    kind: "feature",
    slug: "shipping",
    group: "shipping",
    featured: true,
    icon: Truck,
    shot: "zones",
    uses: [PackageCheck, FileSpreadsheet, Bike, MapPin],
    steps: ["zoneRow", "freeOver", "shipChoice", "trackStatus"],
    related: [
      { href: "/integrations/bosta", icon: PackageCheck },
      { href: "/solutions/online-store-egypt", icon: MapPin },
      { href: "/solutions/cash-on-delivery-store", icon: Banknote },
      { href: "/tools/profit-margin-calculator", icon: Calculator },
    ],
  },
  {
    kind: "feature",
    slug: "custom-domain",
    group: "website",
    icon: Globe,
    shot: "domain",
    benefits: [BadgeCheck, Megaphone, Search],
    steps: ["registrar", "connect", "dns", "status"],
    related: [
      { href: "/templates", icon: LayoutTemplate },
      { href: "/#builder", icon: MousePointerClick },
      { href: "/#ai", icon: Sparkles },
      { href: "/integrations/meta-pixel", icon: Activity },
    ],
  },
];

export const INTEGRATION_PAGES: readonly DetailPage[] = [
  {
    kind: "integration",
    slug: "meta-pixel",
    icon: Activity,
    partner: "Meta Pixel",
    shot: "pixel",
    uses: [ChartNoAxesCombined, Users, Target, Server],
    events: ["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "Purchase", "Lead"],
    steps: ["copyId", "openApp", "pasteId", "testEvents"],
    related: [
      { href: "/integrations", icon: PlugZap },
      { href: "/features/custom-domain", icon: Globe },
      { href: "/tools/profit-margin-calculator", icon: Calculator },
      { href: "/pricing", icon: Receipt },
    ],
  },
  {
    kind: "integration",
    slug: "bosta",
    icon: PackageCheck,
    partner: "Bosta",
    shot: "waybill",
    uses: [PackageCheck, Printer, RefreshCw, Banknote],
    steps: ["connectAccount", "sendOrder", "printWaybill", "trackStatus"],
    related: [
      { href: "/features/shipping", icon: Truck },
      { href: "/integrations", icon: PlugZap },
      { href: "/solutions/online-store-egypt", icon: MapPin },
      { href: "/solutions/cash-on-delivery-store", icon: Banknote },
    ],
  },
  {
    kind: "integration",
    slug: "paymob",
    icon: CreditCard,
    partner: "Paymob",
    shot: "gateway",
    uses: [CreditCard, Wallet, KeyRound, BadgeCheck],
    steps: ["copyKeys", "connectAccount", "keyCheck", "cardCheckout"],
    related: [
      { href: "/integrations/kashier", icon: CreditCard },
      { href: "/solutions/cash-on-delivery-store", icon: Banknote },
      { href: "/integrations", icon: PlugZap },
      { href: "/pricing", icon: Receipt },
    ],
  },
  {
    kind: "integration",
    slug: "kashier",
    icon: CreditCard,
    partner: "Kashier",
    shot: "gateway",
    uses: [CreditCard, Wallet, KeyRound, ChartNoAxesCombined],
    steps: ["copyKeys", "connectAccount", "keyCheck", "cardCheckout"],
    related: [
      { href: "/integrations/paymob", icon: CreditCard },
      { href: "/solutions/online-store-egypt", icon: MapPin },
      { href: "/integrations", icon: PlugZap },
      { href: "/tools/store-cost-calculator", icon: Calculator },
    ],
  },
];

export const findFeaturePage = (slug: string) => FEATURE_PAGES.find((page) => page.slug === slug);
export const findIntegrationPage = (slug: string) => INTEGRATION_PAGES.find((page) => page.slug === slug);

