"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { SectionCard } from "./settings-ui";
import { savePolicies } from "./policies.server";

/** Return and shipping text for every store on this account (F-46c). */
export function PoliciesSection({
  returnPolicy,
  shippingPolicy,
}: {
  returnPolicy: string | null;
  shippingPolicy: string | null;
}) {
  const t = useTranslations("settings.account");
  const [values, setValues] = useState({ returnPolicy: returnPolicy ?? "", shippingPolicy: shippingPolicy ?? "" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const sectionRef = useRef<HTMLDivElement>(null);

  // The page streams in, so a link to #policies has nothing to land on until now.
  useEffect(() => {
    if (window.location.hash === "#policies") sectionRef.current?.scrollIntoView({ block: "start" });
  }, []);

  const save = () =>
    startTransition(async () => {
      setError(null);
      const result = await savePolicies(values);
      if (result.success) toast.success(t("saved"));
      else setError(t(`errors.${result.error}`));
    });

  return (
    <div ref={sectionRef} className="scroll-mt-24">
      <SectionCard id="policies" icon={FileText} title={t("policies.title")} description={t("policies.description")}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="returnPolicy" className="text-[13px] font-semibold">
              {t("policies.returns")}
            </Label>
            <Textarea
              id="returnPolicy"
              rows={5}
              maxLength={5000}
              disabled={isPending}
              value={values.returnPolicy}
              onChange={(e) => setValues((v) => ({ ...v, returnPolicy: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="shippingPolicy" className="text-[13px] font-semibold">
              {t("policies.shipping")}
            </Label>
            <Textarea
              id="shippingPolicy"
              rows={5}
              maxLength={5000}
              disabled={isPending}
              value={values.shippingPolicy}
              onChange={(e) => setValues((v) => ({ ...v, shippingPolicy: e.target.value }))}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div>
            <Button type="button" onClick={save} disabled={isPending}>
              {t("save")}
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
