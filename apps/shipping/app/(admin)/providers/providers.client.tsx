"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Switch } from "@workspace/ui/components/switch";

import { toggleProvider } from "./providers.server";

interface ProviderToggleProps {
  providerId: string;
  name: string;
  isActive: boolean;
}

export function ProviderToggle({
  providerId,
  name,
  isActive,
}: ProviderToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Switch
      checked={isActive}
      disabled={isPending}
      aria-label={`${isActive ? "Disable" : "Enable"} ${name}`}
      onCheckedChange={(checked) => {
        startTransition(async () => {
          const result = await toggleProvider({ providerId, isActive: checked });
          if (result.success) {
            toast.success(result.message ?? "Saved");
            router.refresh();
          } else {
            toast.error(result.error ?? "Something went wrong");
          }
        });
      }}
    />
  );
}
