"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";

import { deleteProvider } from "../providers.server";

export function DeleteProviderButton({
  providerId,
  name,
  shipmentCount,
}: {
  providerId: string;
  name: string;
  shipmentCount: number;
}) {
  const t = useTranslations("providers");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t("deleteAria", { name })}
      disabled={isPending || shipmentCount > 0}
      title={
        shipmentCount > 0
          ? t("cannotDelete", { count: shipmentCount })
          : undefined
      }
      onClick={() => {
        startTransition(async () => {
          const result = await deleteProvider({ providerId });
          if (result.success) {
            toast.success(result.message ?? t("deleted"));
            router.refresh();
          } else {
            toast.error(result.error ?? tCommon("somethingWrong"));
          }
        });
      }}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </Button>
  );
}
