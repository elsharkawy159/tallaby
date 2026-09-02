import { getTranslations } from "next-intl/server";

import { Badge } from "@workspace/ui/components/badge";
import type { AutomationSettings } from "@/lib/automation";

import { ALL_PAGE_SECTIONS, TERMINAL_STAGES, type ShippingFilters } from "../orders.dto";
import type { ProviderOption, StageOrdersMap } from "../orders.types";
import { OrdersBoard } from "./orders-board";

interface OrdersAllSectionsProps {
  sections: StageOrdersMap;
  filters: ShippingFilters;
  providers: ProviderOption[];
  automation: AutomationSettings;
}

export async function OrdersAllSections({
  sections,
  filters,
  providers,
  automation,
}: OrdersAllSectionsProps) {
  const t = await getTranslations("orders");

  return (
    <div className="space-y-8">
      {ALL_PAGE_SECTIONS.map((stage, index) => {
        const result = sections[stage];
        const rows = result?.data ?? [];
        const totalCount = result?.totalCount ?? 0;
        const isFirstTerminal =
          TERMINAL_STAGES[0] === stage && index > 0;

        return (
          <section key={stage} className="space-y-3">
            {isFirstTerminal && (
              <div className="border-t pt-6">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("terminalStagesHeading")}
                </p>
              </div>
            )}
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              {t(`stages.${stage}`)}
              <Badge variant="secondary">{totalCount}</Badge>
            </h2>
            {rows.length === 0 ? (
              <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                {t("noOrdersInStage")}
              </p>
            ) : (
              <OrdersBoard
                rows={rows}
                stage={stage}
                filters={{ ...filters, stage }}
                totalCount={totalCount}
                providers={providers}
                automation={automation}
              />
            )}
          </section>
        );
      })}
    </div>
  );
}
