import {
  Calculator,
  CalendarX,
  ChartNoAxesCombined,
  CodeXml,
  CreditCard,
  Globe,
  Languages,
  LayoutTemplate,
  MousePointerClick,
  PlugZap,
  Receipt,
  Search,
  Sparkles,
  Truck,
  type LucideIcon,
} from "lucide-react";

/**
 * Keyword landing pages at /solutions/[slug]. One entry here plus one
 * `solutionPages.<slug>` block in the messages adds a page.
 */
export type Solution = {
  slug: string;
  trustIcons: readonly LucideIcon[];
  featureIcons: readonly LucideIcon[];
  /** Only real pages. Titles are in the messages, in this order. */
  related: readonly { href: string; icon: LucideIcon }[];
};

export const SOLUTIONS: readonly Solution[] = [
  {
    slug: "create-online-store",
    trustIcons: [CalendarX, Receipt, CodeXml, Languages],
    featureIcons: [Sparkles, LayoutTemplate, MousePointerClick, Globe, CreditCard, Truck, ChartNoAxesCombined, Search],
    related: [
      { href: "/integrations", icon: PlugZap },
      { href: "/templates", icon: LayoutTemplate },
      { href: "/pricing", icon: Receipt },
      { href: "/tools/profit-margin-calculator", icon: Calculator },
    ],
  },
];

export const findSolution = (slug: string) => SOLUTIONS.find((solution) => solution.slug === slug);
