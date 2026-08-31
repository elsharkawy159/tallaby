"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("providers");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Switch
      checked={isActive}
      disabled={isPending}
      aria-label={isActive ? t("disableAria", { name }) : t("enableAria", { name })}
      onCheckedChange={(checked) => {
        startTransition(async () => {
          const result = await toggleProvider({ providerId, isActive: checked });
          if (result.success) {
            toast.success(result.message ?? tCommon("saved"));
            router.refresh();
          } else {
            toast.error(result.error ?? tCommon("somethingWrong"));
          }
        });
      }}
    />
  );
}
