"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { FileText, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Field, Note, SectionCard, SellerButton, TextArea } from "@/components/seller-ui";
import { savePolicies } from "./policies.server";

/** Return, shipping and privacy text for every store on this account (F-46c). */
export function PoliciesSection({
  returnPolicy,
  shippingPolicy,
  privacyPolicy,
}: {
  returnPolicy: string | null;
  shippingPolicy: string | null;
  privacyPolicy: string | null;
}) {
  const t = useTranslations("settings.account");
  const [values, setValues] = useState({
    returnPolicy: returnPolicy ?? "",
    shippingPolicy: shippingPolicy ?? "",
    privacyPolicy: privacyPolicy ?? "",
  });
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

  const area = (key: keyof typeof values, label: string, note?: string) => (
    <Field label={label} htmlFor={key} note={note}>
      <TextArea
        id={key}
        rows={5}
        maxLength={5000}
        disabled={isPending}
        value={values[key]}
        onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
      />
    </Field>
  );

  return (
    <div ref={sectionRef} className="scroll-mt-24">
      <SectionCard id="policies" icon={FileText} title={t("policies.title")} description={t("policies.description")}>
        {area("returnPolicy", t("policies.returns"))}
        {area("shippingPolicy", t("policies.shipping"))}
        {area("privacyPolicy", t("policies.privacy"), t("policies.privacyHint"))}
        {error && (
          <Note tone="danger">
            <span role="alert">{error}</span>
          </Note>
        )}
        <div className="flex justify-end">
          <SellerButton variant="solid" onClick={save} disabled={isPending}>
            {isPending && <LoaderCircle className="animate-spin" aria-hidden />}
            {t("save")}
          </SellerButton>
        </div>
      </SectionCard>
    </div>
  );
}
