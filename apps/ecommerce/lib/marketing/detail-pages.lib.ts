import {
  Activity,
  BadgeCheck,
  Calculator,
  ChartNoAxesCombined,
  Globe,
  LayoutTemplate,
  Megaphone,
  MousePointerClick,
  PlugZap,
  Receipt,
  Search,
  Server,
  Sparkles,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * /features/[slug] and /integrations/[slug]. One entry here plus one
 * `detailPages.<slug>` block in the messages adds a page. List only what the
 * product really does: check the code first.
 */

export type DetailShot = "domain" | "pixel";
export type DetailStepVisual = "registrar" | "connect" | "dns" | "status" | "copyId" | "openApp" | "pasteId" | "testEvents";

export type DetailPage = {
  kind: "feature" | "integration";
  slug: string;
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

export const FEATURE_PAGES: readonly DetailPage[] = [
  {
    kind: "feature",
    slug: "custom-domain",
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
];

export const findFeaturePage = (slug: string) => FEATURE_PAGES.find((page) => page.slug === slug);
export const findIntegrationPage = (slug: string) => INTEGRATION_PAGES.find((page) => page.slug === slug);

