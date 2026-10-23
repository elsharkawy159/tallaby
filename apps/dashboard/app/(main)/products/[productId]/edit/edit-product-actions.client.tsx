"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { EyeOff, ExternalLink, LoaderCircle, Rocket } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { setProductPublished } from "@/actions/products";
import { BUTTON_CLASS } from "@/components/form/form-ui";
import { cn } from "@/lib/utils";

export type EditProductStatus = "draft" | "pending" | "active" | "rejected";

/**
 * Header actions on the edit page, beside Save: Publish / Unpublish (the same
 * action as the list's switch) and Preview, which opens the product on the
 * seller's own store and only works while the product is published.
 */
export function EditProductActions({
  productId,
  status,
  previewUrl,
}: {
  productId: string;
  status: EditProductStatus;
  /** The product page on the seller's store; null when no store shows it. */
  previewUrl: string | null;
}) {
  const router = useRouter();
  const t = useTranslations("productForm.page");
  const tPublish = useTranslations("products.publish");
  const tToast = useTranslations("toast");
  const [current, setCurrent] = useState(status);
  const [isPending, startTransition] = useTransition();

  const published = current === "active";
  const canToggle = current !== "rejected";
  const canPreview = published && Boolean(previewUrl);
  const previewTitle = !published ? t("previewNeedsPublish") : !previewUrl ? t("previewNoStore") : t("previewOnStoreHint");

  const toggle = () => {
    if (!canToggle || isPending) return;
    const next = !published;
    startTransition(async () => {
      const result = await setProductPublished(productId, next);
      if (!result.success) {
        toast.error(result.error || tToast("failedToUpdateProductStatus"));
        return;
      }
      setCurrent(next ? "active" : "draft");
      toast.success(next ? tToast("productPublished") : tToast("productUnpublished"));
      router.refresh();
    });
  };

  return (
    <>
      {/* Wrapper keeps the hint on hover while the button is disabled. */}
      <span title={previewTitle} className="inline-flex">
        {canPreview ? (
          <Button asChild variant="soft" className={cn(BUTTON_CLASS, "rounded-xl")}>
            <a href={previewUrl!} target="_blank" rel="noopener noreferrer">
              <ExternalLink />
              {t("previewOnStore")}
            </a>
          </Button>
        ) : (
          <Button type="button" variant="soft" className={cn(BUTTON_CLASS, "rounded-xl")} disabled>
            <ExternalLink />
            {t("previewOnStore")}
          </Button>
        )}
      </span>
      <span title={canToggle ? undefined : tPublish("onlyToggleable")} className="inline-flex">
        <Button
          type="button"
          variant="neutral"
          className={cn(BUTTON_CLASS, "rounded-xl")}
          onClick={toggle}
          disabled={!canToggle || isPending}
          aria-busy={isPending}
        >
          {isPending ? <LoaderCircle className="animate-spin" /> : published ? <EyeOff /> : <Rocket />}
          {published ? tPublish("unpublish") : tPublish("publish")}
        </Button>
      </span>
    </>
  );
}
