"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { translateStatus } from "@/lib/i18n/status";
import { toast } from "sonner";
import { Badge } from "@workspace/ui/components/badge";
import { Switch } from "@workspace/ui/components/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { setProductPublished } from "@/actions/products";

type ProductStatus = "draft" | "pending" | "active" | "rejected";

const statusStyles: Record<ProductStatus, string> = {
  draft: "bg-muted text-foreground",
  pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300",
  active: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
  rejected: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
};

interface ProductStatusCellProps {
  productId: string;
  status: ProductStatus;
}

/** Optimistic publish/unpublish shared by the table cell and the card switch. */
function useProductPublish(productId: string, status: ProductStatus) {
  const router = useRouter();
  const tToast = useTranslations("toast");
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState(status);

  useEffect(() => {
    setCurrentStatus(status);
  }, [status]);

  const isPublished = currentStatus === "active";
  const canToggle = currentStatus !== "rejected";

  const setPublished = (checked: boolean) => {
    if (!canToggle || isPending) return;

    const previousStatus = currentStatus;
    setCurrentStatus(checked ? "active" : "draft");

    startTransition(async () => {
      const result = await setProductPublished(productId, checked);

      if (!result.success) {
        setCurrentStatus(previousStatus);
        toast.error(result.error || tToast("failedToUpdateProductStatus"));
        return;
      }

      toast.success(
        checked ? tToast("productPublished") : tToast("productUnpublished")
      );
      router.refresh();
    });
  };

  return { currentStatus, isPublished, canToggle, isPending, setPublished };
}

export function ProductStatusCell({
  productId,
  status,
}: ProductStatusCellProps) {
  const t = useTranslations("products.publish");
  const tStatus = useTranslations("status");
  const { currentStatus, isPublished, canToggle, isPending, setPublished } =
    useProductPublish(productId, status);

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Switch
                checked={isPublished}
                onCheckedChange={setPublished}
                disabled={!canToggle || isPending}
                aria-label={isPublished ? t("unpublishProduct") : t("publishProduct")}
              />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {canToggle
              ? isPublished
                ? t("unpublish")
                : t("publish")
              : t("onlyToggleable")}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Badge className={statusStyles[currentStatus]}>
        {translateStatus(tStatus, "product", currentStatus)}
      </Badge>
    </div>
  );
}

/** Card footer switch: green when published, labelled Published / Draft. */
export function ProductPublishSwitch({
  productId,
  status,
}: ProductStatusCellProps) {
  const t = useTranslations("products.publish");
  const tStatus = useTranslations("status");
  const { currentStatus, isPublished, canToggle, isPending, setPublished } =
    useProductPublish(productId, status);

  const label = canToggle
    ? isPublished
      ? t("published")
      : t("draft")
    : translateStatus(tStatus, "product", currentStatus);

  const control = (
    <label
      className={cn(
        "inline-flex cursor-pointer select-none items-center gap-2 text-xs font-semibold text-muted-foreground",
        isPublished && "text-success",
        !canToggle && "cursor-not-allowed text-destructive"
      )}
    >
      <Switch
        size="sm"
        checked={isPublished}
        onCheckedChange={setPublished}
        disabled={!canToggle || isPending}
        className="data-[state=checked]:bg-success disabled:opacity-60"
        aria-label={isPublished ? t("unpublishProduct") : t("publishProduct")}
      />
      {label}
    </label>
  );

  if (canToggle) return control;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{control}</TooltipTrigger>
        <TooltipContent>{t("onlyToggleable")}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
