"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { refreshStoreCacheAction } from "./store-cache.server";

/** "Refresh cache" in the store page header: clears this store's storefront caches. */
export function RefreshStoreCacheButton({ storeId }: { storeId: string }) {
  const [pending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      const result = await refreshStoreCacheAction(storeId);
      if (result.success) toast.success(result.message);
      else toast.error(result.error);
    });

  return (
    <Button variant="outline" size="sm" onClick={run} disabled={pending}>
      <RefreshCw className={`mr-1 h-3.5 w-3.5${pending ? " animate-spin" : ""}`} aria-hidden />
      {pending ? "Refreshing…" : "Refresh cache"}
    </Button>
  );
}
