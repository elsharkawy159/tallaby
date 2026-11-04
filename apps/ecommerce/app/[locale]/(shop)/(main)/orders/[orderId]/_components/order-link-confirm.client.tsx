"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { confirmOrderFromLink } from "@/actions/manual-order-link";

/** Shown on an order the store created for the customer, until they confirm it (ROADMAP.md F-05c). */
export function OrderLinkConfirm({ orderId, accessToken }: { orderId: string; accessToken: string }) {
  const t = useTranslations("orderLinkConfirm");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const confirm = () =>
    startTransition(async () => {
      const result = await confirmOrderFromLink(orderId, accessToken);
      if (result.success) toast.success(t("confirmed"));
      else toast.error(t("failed"));
      router.refresh();
    });

  return (
    <section className="mx-auto mb-6 w-full max-w-3xl rounded-2xl border border-primary/30 bg-primary/5 p-5 text-center">
      <h2 className="font-semibold">{t("title")}</h2>
      <p className="mt-1 text-pretty text-sm opacity-80">{t("body")}</p>
      <Button className="mt-3" disabled={pending} onClick={confirm}>
        {t("confirm")}
      </Button>
    </section>
  );
}
