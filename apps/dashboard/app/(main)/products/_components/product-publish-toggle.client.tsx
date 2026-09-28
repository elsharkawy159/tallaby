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

export function ProductStatusCell({
  productId,
  status,
}: ProductStatusCellProps) {
  const router = useRouter();
  const tToast = useTranslations("toast");
  const t = useTranslations("products.publish");
  const tStatus = useTranslations("status");
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState(status);

  useEffect(() => {
    setCurrentStatus(status);
  }, [status]);

  const isPublished = currentStatus === "active";
  const canToggle = currentStatus === "active" || currentStatus === "draft";

  const handleCheckedChange = (checked: boolean) => {
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

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Switch
                checked={isPublished}
                onCheckedChange={handleCheckedChange}
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
