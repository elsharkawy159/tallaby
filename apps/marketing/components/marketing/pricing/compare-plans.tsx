import {
  BarChart3,
  Check,
  ChevronDown,
  ClipboardList,
  CreditCard,
  LayoutTemplate,
  type LucideIcon,
  Megaphone,
  Package,
  Receipt,
  Sparkles,
  Truck,
  UserRound,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { PRICE_TOKENS } from "@/lib/marketing/pricing.lib";
import { COMPARE_GROUPS, type CompareCell, type CompareGroupId, rowDiffers } from "./compare-plans.lib";
import { CompareGroupsToggle } from "./compare-groups-toggle.client";
import { withPrices } from "./with-prices";

const GROUP_ICONS: Record<CompareGroupId, LucideIcon> = {
  plan: Receipt,
  website: LayoutTemplate,
  products: Package,
  orders: ClipboardList,
  payments: CreditCard,
  shipping: Truck,
  marketing: Megaphone,
  ai: Sparkles,
  analytics: BarChart3,
  account: UserRound,
};

/** Shared by the sticky plan bar, the group headers and every table, so the columns line up. */
const COLS = "grid grid-cols-[minmax(0,1fr)_76px_76px] min-[641px]:grid-cols-[minmax(0,1fr)_150px_150px] min-[861px]:grid-cols-[minmax(0,1fr)_210px_210px]";
/** Group headers span the full width on phones, and line up with the plan columns from 641px. */
const SUMMARY_COLS = "block min-[641px]:grid min-[641px]:grid-cols-[minmax(0,1fr)_150px_150px] min-[861px]:grid-cols-[minmax(0,1fr)_210px_210px]";
const PLAN_COL = "w-[76px] min-[641px]:w-[150px] min-[861px]:w-[210px]";
/** The Pro column's tint, unbroken from the sticky bar to the last row. */
const PRO_TINT = "bg-teal-50/70";

/**
 * "Compare plans": every live feature, grouped like a Shopify-style plan
 * table (owner, 2026-11-12). Server-rendered; each group is a native
 * `<details>` holding a real `<table>` (row headers, sr-only column headers),
 * and the plan bar sticks under the site header. The only client part is the
 * open/close-all button, which also folds the groups after the first on phones.
 */
export async function ComparePlans() {
  const t = await getTranslations("pricing");

  const cell = (value: CompareCell, strong: boolean) => {
    if (value.kind === "yes") {
      return (
        <>
          <Check className="mx-auto size-[18px] text-[#16a34a]" aria-hidden />
          <span className="sr-only">{t("compare.included")}</span>
        </>
      );
    }
    return (
      <span className={cn("block text-[12.5px] leading-snug text-pretty min-[641px]:text-[14px]", strong ? "font-bold text-teal-900" : "font-semibold text-ink-600")}>
        {withPrices(t(`compare.values.${value.key}`, { ...PRICE_TOKENS, ...value.values }))}
      </span>
    );
  };

  const rowCount = COMPARE_GROUPS.reduce((sum, group) => sum + group.rows.length, 0);

  return (
    <div id="compare-table" className="mx-auto max-w-[1040px]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[13px] text-ink-500">
        <span>{t("compare.count", { count: rowCount, groups: COMPARE_GROUPS.length })}</span>
        <CompareGroupsToggle containerId="compare-table" openLabel={t("compare.openAll")} closeLabel={t("compare.closeAll")} />
      </div>

      <div className="rounded-card border border-line bg-white shadow-soft">
        {/* Plan bar: sticks under the 68px site header while the table scrolls. */}
        <div className={cn(COLS, "sticky top-[68px] z-20 rounded-t-card border-b border-line bg-white")}>
          <div className="flex items-end p-3 ps-4 min-[641px]:p-5 min-[641px]:ps-6">
            <span className="text-[13px] font-semibold text-ink-500 min-[641px]:text-sm">{t("compare.featureCol")}</span>
          </div>
          <PlanHead name={t("plans.freeName")} price={withPrices(t("compare.headFree", PRICE_TOKENS))}>
            <SignupTrigger tone="outline" size="sm" className="mt-2 hidden w-full min-[861px]:inline-flex">
              {t("plans.freeCta")}
            </SignupTrigger>
          </PlanHead>
          <PlanHead name="Pro" latin price={withPrices(t("compare.headPro", PRICE_TOKENS))} className={cn(PRO_TINT, "rounded-se-card")}>
            <SignupTrigger tone="amber" size="sm" plan="pro" className="mt-2 hidden w-full min-[861px]:inline-flex">
              {t("plans.proCta")}
            </SignupTrigger>
          </PlanHead>
        </div>

        {COMPARE_GROUPS.map((group, index) => {
          const Icon = GROUP_ICONS[group.id];
          const title = t(`compare.groups.${group.id}`);
          const last = index === COMPARE_GROUPS.length - 1;
          return (
            <details key={group.id} open data-compare-group className={cn("group", !last && "border-b border-line")}>
              <summary
                className={cn(
                  SUMMARY_COLS,
                  "cursor-pointer list-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-700 [&::-webkit-details-marker]:hidden",
                  last && "group-not-open:rounded-b-card",
                )}
              >
                <h3 className="m-0 flex min-w-0 items-center gap-3 px-4 py-4 min-[641px]:px-6 min-[641px]:py-5">
                  <span className="grid size-9 flex-none place-items-center rounded-[12px] bg-teal-50 text-teal-700 [&_svg]:size-[18px]">
                    <Icon aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[16px] leading-snug font-bold text-teal-900 min-[641px]:text-[18px]">{title}</span>
                    <span className="block text-xs font-normal text-ink-400">{t("compare.groupCount", { count: group.rows.length })}</span>
                  </span>
                  <ChevronDown className="ms-auto size-5 flex-none text-ink-500 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
                </h3>
                <span aria-hidden className="hidden min-[641px]:block" />
                <span aria-hidden className={cn(PRO_TINT, "hidden min-[641px]:block", last && "group-not-open:rounded-ee-card")} />
              </summary>

              <table className="w-full table-fixed border-collapse">
                <caption className="sr-only">{title}</caption>
                <colgroup>
                  <col />
                  <col className={PLAN_COL} />
                  <col className={PLAN_COL} />
                </colgroup>
                <thead className="sr-only">
                  <tr>
                    <th scope="col">{t("compare.featureCol")}</th>
                    <th scope="col">{t("plans.freeName")}</th>
                    <th scope="col">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row, rowIndex) => {
                    const strong = rowDiffers(row);
                    const lastRow = last && rowIndex === group.rows.length - 1;
                    return (
                      <tr key={row.id} className="border-t border-line-soft">
                        <th scope="row" className="px-4 py-3.5 text-start align-top font-normal min-[641px]:px-6 min-[641px]:py-4">
                          <span className="block text-[14px] leading-snug font-semibold text-ink-900 min-[641px]:text-[15px]">{t(`compare.rows.${row.id}.label`)}</span>
                          <span className="mt-1 block text-[12.5px] leading-relaxed text-pretty text-ink-500 min-[641px]:text-[13.5px]">{t(`compare.rows.${row.id}.desc`)}</span>
                        </th>
                        <td className="px-1.5 py-3.5 text-center align-top min-[641px]:px-3 min-[641px]:py-4">{cell(row.free, strong)}</td>
                        <td className={cn(PRO_TINT, "px-1.5 py-3.5 text-center align-top min-[641px]:px-3 min-[641px]:py-4", lastRow && "rounded-ee-card")}>
                          {cell(row.pro, strong)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </details>
          );
        })}
      </div>

      <p className="mx-auto mt-5 max-w-[720px] text-center text-[13px] text-pretty text-ink-500">{t("compare.note")}</p>
    </div>
  );
}

function PlanHead({ name, latin, price, className, children }: { name: string; latin?: boolean; price: React.ReactNode; className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col items-center justify-end px-1.5 py-3 text-center min-[641px]:px-4 min-[641px]:py-5", className)}>
      <span className={cn("text-[15px] leading-tight font-bold text-teal-900 min-[641px]:text-[19px]", latin && "font-latin")}>{name}</span>
      <span className="mt-1 text-[11.5px] leading-snug text-pretty text-ink-500 min-[641px]:text-[13px]">{price}</span>
      {children}
    </div>
  );
}
