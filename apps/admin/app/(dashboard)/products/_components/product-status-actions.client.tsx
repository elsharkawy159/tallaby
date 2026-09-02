"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { updateProductStatus } from "@/actions/products";
import {
  canApproveProduct,
  canRejectProduct,
} from "../products.lib";
import type { ProductStatus } from "../products.types";

interface ProductStatusActionsProps {
  productId: string;
  status: ProductStatus;
}

export function ProductStatusActions({
  productId,
  status,
}: ProductStatusActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (nextStatus: ProductStatus) => {
    startTransition(async () => {
      const result = await updateProductStatus(productId, nextStatus);

      if (result.success) {
        toast.success(
          nextStatus === "active"
            ? "Product approved"
            : nextStatus === "rejected"
              ? "Product rejected"
              : "Product status updated"
        );
        router.refresh();
        return;
      }

      toast.error(result.error || "Failed to update product status");
    });
  };

  if (!canApproveProduct(status) && !canRejectProduct(status)) {
    return null;
  }

  return (
    <>
      {canApproveProduct(status) && (
        <Button
          size="sm"
          onClick={() => handleStatusChange("active")}
          disabled={isPending}
          className="bg-green-600 hover:bg-green-700"
        >
          <Check className="h-4 w-4 mr-2" />
          Approve
        </Button>
      )}
      {canRejectProduct(status) && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleStatusChange("rejected")}
          disabled={isPending}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <X className="h-4 w-4 mr-2" />
          Reject
        </Button>
      )}
    </>
  );
}
