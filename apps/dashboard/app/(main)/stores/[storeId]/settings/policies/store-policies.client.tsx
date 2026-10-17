"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileLock2, LoaderCircle, RotateCcw, Save, ScrollText, Truck, type LucideIcon } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@workspace/ui/components/form";
import { Textarea } from "@workspace/ui/components/textarea";
import { BUTTON_CLASS, LabelNote, SectionCard, TEXTAREA_CLASS } from "@/components/form/form-ui";
import { saveStorePolicies } from "../store-settings.server";
import type { StorePoliciesFormValues } from "../store-settings.dto";

const MAX = 20_000;

const POLICIES: { key: keyof StorePoliciesFormValues; icon: LucideIcon; onStorefront: boolean }[] = [
  { key: "return", icon: RotateCcw, onStorefront: true },
  { key: "shipping", icon: Truck, onStorefront: true },
  { key: "privacy", icon: FileLock2, onStorefront: false },
  { key: "terms", icon: ScrollText, onStorefront: false },
];

export function StorePoliciesForm({
  storeId,
  initial,
  readOnly,
}: {
  storeId: string;
  initial: StorePoliciesFormValues;
  readOnly: boolean;
}) {
  const t = useTranslations("storeSettings");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<StorePoliciesFormValues>({ defaultValues: initial });
  const values = useWatch({ control: form.control });
  const disabled = readOnly || isPending;

  const onSubmit = (v: StorePoliciesFormValues) =>
    startTransition(async () => {
      const result = await saveStorePolicies(storeId, v);
      if (result.success) {
        toast.success(t("saved"));
        form.reset(v);
        router.refresh();
      } else {
        toast.error(t(`errors.${result.error}`));
      }
    });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {readOnly && <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{t("readOnly")}</p>}
        {POLICIES.map(({ key, icon, onStorefront }) => (
          <SectionCard
            key={key}
            id={`policy-${key}`}
            icon={icon}
            title={t(`policies.${key}.title`)}
            description={t(`policies.${key}.description`)}
            tag={onStorefront ? <LabelNote>{t("policies.shownOnStore")}</LabelNote> : undefined}
          >
            <FormField
              control={form.control}
              name={key}
              rules={{ maxLength: { value: MAX, message: t("errors.policyTooLong") } }}
              render={({ field }) => (
                <FormItem className="gap-1.5">
                  <FormControl>
                    <Textarea
                      className={TEXTAREA_CLASS}
                      rows={6}
                      maxLength={MAX}
                      disabled={disabled}
                      placeholder={t(`policies.${key}.placeholder`)}
                      aria-label={t(`policies.${key}.title`)}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-end">
                    <LabelNote>
                      <span dir="ltr" className="tabular-nums">
                        {(values[key] ?? "").length}/{MAX}
                      </span>
                    </LabelNote>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SectionCard>
        ))}
        <div className="sticky bottom-0 flex justify-end border-t bg-background/95 py-3 backdrop-blur">
          <Button type="submit" className={BUTTON_CLASS} disabled={disabled || !form.formState.isDirty}>
            {isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
            {t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
