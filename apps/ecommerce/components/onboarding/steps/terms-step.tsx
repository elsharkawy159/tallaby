"use client";

import { CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";

import { Checkbox } from "@workspace/ui/components/checkbox";
import { Label } from "@workspace/ui/components/label";
import { Link } from "@/i18n/navigation";
import type { OnboardingFormValues } from "../become-seller.dto";
import { InlineError } from "../onboarding.chunks";

export function TermsStep() {
  const t = useTranslations("onboarding");
  const form = useFormContext<OnboardingFormValues>();
  const accepted = useWatch({ control: form.control, name: "acceptTerms" });

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-muted/30 p-4">
        <h3 className="mb-3 font-semibold">{t("terms.whatNextTitle")}</h3>
        <ol className="space-y-2 text-sm">
          {(["whatNext1", "whatNext2", "whatNext3"] as const).map((key) => (
            <li key={key} className="flex items-start gap-2">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{t(`terms.${key}`)}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Checkbox
            id="accept-terms"
            className="mt-0.5"
            checked={accepted}
            onCheckedChange={(checked) => {
              form.setValue("acceptTerms", checked === true, { shouldDirty: true });
              form.clearErrors("acceptTerms");
            }}
          />
          <Label htmlFor="accept-terms" className="block font-normal leading-relaxed">
            {t.rich("terms.accept", {
              link: (chunks) => (
                <Link
                  href="/terms"
                  target="_blank"
                  className="font-medium text-primary underline underline-offset-2"
                >
                  {chunks}
                </Link>
              ),
            })}
          </Label>
        </div>
        <InlineError name="acceptTerms" />
      </div>
    </div>
  );
}
