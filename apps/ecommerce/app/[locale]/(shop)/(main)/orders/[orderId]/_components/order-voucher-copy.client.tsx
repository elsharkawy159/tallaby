"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Copy } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

/** Copy button for the EasyKash Fawry / Aman payment number (ROADMAP.md F-98e). */
export function OrderVoucherCopy({ value }: { value: string }) {
  const t = useTranslations("checkout.transfer");
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(t("copied"));
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(t("copyFailed"));
    }
  };
  return (
    <Button type="button" variant="outline" size="sm" onClick={copy} className="shrink-0 gap-1.5">
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? t("copied") : t("copy")}
    </Button>
  );
}
