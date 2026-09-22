"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { updateProductDirectCheckout } from "@/actions/products";

interface ProductDirectCheckoutToggleProps {
  productId: string;
  directCheckout: boolean;
}

export function ProductDirectCheckoutToggle({
  productId,
  directCheckout,
}: ProductDirectCheckoutToggleProps) {
  const router = useRouter();
  const [checked, setChecked] = useState(directCheckout);
  const [isPending, startTransition] = useTransition();

  const handleChange = (next: boolean) => {
    setChecked(next);
    startTransition(async () => {
      const result = await updateProductDirectCheckout(productId, next);

      if (result.success) {
        toast.success(
          next ? "Direct checkout enabled" : "Direct checkout disabled"
        );
        router.refresh();
        return;
      }

      setChecked(!next);
      toast.error(result.error || "Failed to update direct checkout");
    });
  };

  return (
    <div className="flex items-center gap-2 rounded-md border px-3 h-9">
      <Switch
        id="direct-checkout"
        checked={checked}
        onCheckedChange={handleChange}
        disabled={isPending}
      />
      <Label htmlFor="direct-checkout" className="cursor-pointer text-sm">
        Direct Checkout
      </Label>
    </div>
  );
}
