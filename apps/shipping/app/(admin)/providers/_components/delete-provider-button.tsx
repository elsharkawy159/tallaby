"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Delete ${name}`}
      disabled={isPending || shipmentCount > 0}
      title={shipmentCount > 0 ? `Cannot delete: ${shipmentCount} shipment(s) use this provider` : undefined}
      onClick={() => {
        startTransition(async () => {
          const result = await deleteProvider({ providerId });
          if (result.success) {
            toast.success(result.message ?? "Deleted");
            router.refresh();
          } else {
            toast.error(result.error ?? "Something went wrong");
          }
        });
      }}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </Button>
  );
}
