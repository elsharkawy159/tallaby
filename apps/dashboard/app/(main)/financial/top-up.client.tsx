"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { LoaderCircle, Plus } from "lucide-react";
import { parseStoreTopUpAmount } from "@workspace/lib/store-wallet";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { BUTTON_CLASS, FIELD_CLASS } from "@/components/form/form-ui";
import { startTopUp } from "./top-up.server";

const PRESETS = ["100", "250", "500", "1000"];

/** "Top up" on the store wallet card: amount → Kashier payment page. */
export function TopUpButton({ disabled }: { disabled?: boolean }) {
  const t = useTranslations("storeWallet.topUp");
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("250");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    const parsed = parseStoreTopUpAmount(amount);
    if (!parsed.success) {
      setError(t(`errors.${parsed.error}`));
      return;
    }
    startTransition(async () => {
      const result = await startTopUp(parsed.amount);
      if (!result.success) {
        setError(t(`errors.${result.error}`));
        return;
      }
      window.location.assign(result.sessionUrl);
    });
  };

  return (
    <>
      <Button type="button" className={BUTTON_CLASS} disabled={disabled} onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        {t("button")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={amount === value ? "default" : "outline"}
                  onClick={() => {
                    setAmount(value);
                    setError(null);
                  }}
                >
                  <span dir="ltr">{value}</span>
                </Button>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="top-up-amount">{t("amount")}</Label>
              <Input
                id="top-up-amount"
                dir="ltr"
                inputMode="decimal"
                className={FIELD_CLASS}
                value={amount}
                aria-invalid={error ? true : undefined}
                aria-describedby="top-up-hint"
                onChange={(event) => {
                  setAmount(event.target.value);
                  setError(null);
                }}
              />
              <p id="top-up-hint" className="text-xs text-muted-foreground">
                {error ? <span className="text-destructive">{error}</span> : t("limits")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" className={BUTTON_CLASS} disabled={isPending} onClick={submit}>
              {isPending && <LoaderCircle className="animate-spin" aria-hidden />}
              {t("continue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
