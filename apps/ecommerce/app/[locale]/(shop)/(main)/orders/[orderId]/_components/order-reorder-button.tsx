"use client";

import { useTransition } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { reorderAction } from "@/actions/reorder";
import { useRouter } from "@/i18n/navigation";
import { useCart } from "@/providers/cart-provider";

/**
 * "Order again" on a store order (ROADMAP.md F-01e): the order's products
 * that are still sold go back in the cart at today's prices, then the cart
 * opens. Shown only to the order's owner on the store's own website.
 */
export function OrderReorderButton({ orderId }: { orderId: string }) {
  const t = useTranslations("orders.reorder");
  const router = useRouter();
  const { refreshCart } = useCart();
  const [pending, startTransition] = useTransition();

  const reorder = () =>
    startTransition(async () => {
      const result = await reorderAction(orderId);
      if (!result.success) {
        toast.error(t(result.error === "nothingAvailable" ? "nothingAvailable" : "failed"));
        return;
      }
      if (result.skipped || result.capped) toast.warning(t("partial"));
      else toast.success(t("added"));
      await refreshCart();
      router.push("/cart");
    });

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border p-4 text-center sm:flex-row sm:justify-between sm:text-start">
      <div>
        <p className="text-sm font-semibold">{t("title")}</p>
        <p className="text-muted-foreground text-xs">{t("pricesNote")}</p>
      </div>
      <Button type="button" onClick={reorder} disabled={pending} className="shrink-0 rounded-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
        {t("button")}
      </Button>
    </div>
  );
}
