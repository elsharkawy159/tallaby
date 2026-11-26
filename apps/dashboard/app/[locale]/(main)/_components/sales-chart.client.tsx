"use client";

import dynamic from "next/dynamic";
import { LineChart } from "lucide-react";
import { useTranslations } from "next-intl";
import { IconTile, SellerButton } from "@/components/seller-ui";
import { useRange } from "./home-range.client";

export type SalesChartPoint = { day: string; revenue: number; orders: number };

// recharts loads as its own chunk; the sized box below holds the space meanwhile.
const SalesChartCanvas = dynamic(() => import("./sales-chart-canvas.client").then((m) => m.SalesChartCanvas));

/** Revenue line over daily order bars. RTL puts the newest day on the left. */
export function SalesChart({
  data,
  hasOrders,
  unit,
}: {
  data: SalesChartPoint[];
  /** The currency the revenue line is in. */
  unit: string;
  /** Whether the store has ever had an order (picks the empty-state copy). */
  hasOrders: boolean;
}) {
  const t = useTranslations("home.chart");
  const { range, setRange } = useRange();
  const empty = data.every((p) => p.revenue === 0 && p.orders === 0);

  return (
    <div className="relative">
      <div className="h-[240px] w-full text-xs [&_.recharts-cartesian-axis-tick_text]:fill-faint [&_.recharts-surface]:outline-hidden">
        <SalesChartCanvas data={data} unit={unit} empty={empty} />
      </div>

      {empty && (
        <div className="pointer-events-none absolute inset-x-0 bottom-10 top-0 grid place-items-center text-center">
          <div className="pointer-events-auto flex flex-col items-center gap-1.5 rounded-[20px] border border-(--s-line) bg-(--s-surface) px-[22px] py-4 shadow-[0_14px_34px_rgb(13_55_67/0.08)]">
            <IconTile icon={LineChart} className="size-10 rounded-[13px]" />
            <b className="text-sm font-bold text-(--s-ink)">{t(hasOrders ? "emptyRangeTitle" : "emptyTitle")}</b>
            <span className="text-[12.5px] text-(--s-subtle)">{t(hasOrders ? "emptyRangeDescription" : "emptyDescription")}</span>
            {hasOrders && range < 30 && (
              <SellerButton variant="mini" size="xs" className="mt-1.5" onClick={() => setRange(30)}>
                {t("try30")}
              </SellerButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
