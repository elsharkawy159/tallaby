"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { setAutoAssign, setAutoConfirm } from "../automation.server";

interface AutomationToggleProps {
  kind: "confirm" | "assign";
  initialEnabled: boolean;
}

/**
 * The Auto Confirm (Pending tab) / Auto Assign (Confirmed tab) switch.
 *
 * Optimistic on purpose: a switch that waits for a round-trip before moving
 * reads as broken. The server's value is applied on the response, so a
 * rejected write snaps it back rather than leaving the UI lying.
 */
export function AutomationToggle({ kind, initialEnabled }: AutomationToggleProps) {
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  const id = `automation-${kind}`;
  const label = kind === "confirm" ? t("autoConfirm") : t("autoAssign");
  const hint = kind === "confirm" ? t("autoConfirmHint") : t("autoAssignHint");

  function onChange(next: boolean) {
    setEnabled(next);

    startTransition(async () => {
      const result = await (kind === "confirm" ? setAutoConfirm(next) : setAutoAssign(next));

      if (!result.success) {
        setEnabled(!next);
        toast.error(result.error ?? tCommon("somethingWrong"));
        return;
      }

      setEnabled(kind === "confirm" ? result.data!.autoConfirm : result.data!.autoAssign);

      if (next) {
        const affected = result.affected ?? 0;
        toast.success(
          affected > 0
            ? kind === "confirm"
              ? t("autoConfirmSweep", { name: label, count: affected })
              : t("autoAssignSweep", { name: label, count: affected })
            : t("automationOn", { name: label })
        );
      } else {
        toast.success(t("automationOff", { name: label }));
      }

      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2" title={hint}>
      {isPending && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
      <Label htmlFor={id} className="cursor-pointer text-sm font-normal">
        {label}
      </Label>
      <Switch id={id} checked={enabled} onCheckedChange={onChange} disabled={isPending} />
    </div>
  );
}
