"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";

import { FACEBOOK_DOMAIN_VERIFICATION_RE } from "@workspace/lib/stores";
import { Field, Note, SellerButton, TextInput } from "@/components/seller-ui";
import { saveMetaDomainVerification } from "./meta-domain.server";

/** What Meta Business Manager shows; kept in code (not translated). */
const PLACEHOLDER = '<meta name="facebook-domain-verification" content="…" />';

/**
 * Meta shows the token inside a whole tag; sellers paste the tag. Keep only
 * the content value. The server checks the token pattern again.
 */
function extractMetaDomainToken(input: string): string {
  const value = input.trim();
  const match = /content\s*=\s*["']([^"']*)["']/i.exec(value);
  return (match ? match[1]! : value).trim();
}

/**
 * Meta Pixel › Domain verification: sellers paste Meta's
 * `facebook-domain-verification` tag and the storefront adds it to the head
 * of every page of this store (sellers cannot edit the store's HTML).
 */
export function MetaDomainVerification({
  storeId,
  initial,
  hasCustomDomain,
  readOnly,
}: {
  storeId: string;
  initial: string | null;
  hasCustomDomain: boolean;
  readOnly: boolean;
}) {
  const t = useTranslations("storeApps.metaDomain");
  const tApps = useTranslations("storeApps");
  const router = useRouter();
  const [saved, setSaved] = useState(initial ?? "");
  const [value, setValue] = useState(initial ?? "");
  const [isPending, startTransition] = useTransition();
  const token = extractMetaDomainToken(value);
  const valid = token === "" || FACEBOOK_DOMAIN_VERIFICATION_RE.test(token);
  const dirty = token !== saved;

  const save = () => {
    if (!valid) return;
    startTransition(async () => {
      const result = await saveMetaDomainVerification(storeId, token);
      if (!result.success) {
        toast.error(result.error === "invalidId" ? t("invalid") : tApps(`errors.${result.error}`));
        return;
      }
      const next = result.data.token ?? "";
      setSaved(next);
      setValue(next);
      toast.success(next ? t("saved") : t("removed"));
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-(--s-line) p-3.5">
      <div>
        <p className="text-sm font-bold text-(--s-text)">{t("title")}</p>
        <p className="text-xs text-(--s-subtle)">{t("hint")}</p>
      </div>
      {!hasCustomDomain && (
        <Note tone="amber">{t("needsDomain")}</Note>
      )}
      <Field label={t("label")} htmlFor="meta-domain-token">
        <TextInput
          id="meta-domain-token"
          dir="ltr"
          autoComplete="off"
          spellCheck={false}
          className="text-start font-mono text-xs"
          value={value}
          placeholder={PLACEHOLDER}
          disabled={readOnly || isPending}
          aria-invalid={!valid || undefined}
          onChange={(event) => setValue(event.target.value)}
          // A pasted tag becomes its token right away.
          onBlur={() => setValue(token)}
        />
        {!valid ? (
          <p className="text-xs font-semibold text-destructive">{t("invalid")}</p>
        ) : (
          saved &&
          !dirty && <p className="text-xs text-success">{t("live")}</p>
        )}
      </Field>
      <SellerButton
        variant="solid"
        size="sm"
        className="self-start"
        disabled={readOnly || isPending || !dirty || !valid}
        onClick={save}
      >
        {isPending && <LoaderCircle className="animate-spin" aria-hidden />}
        {t("save")}
      </SellerButton>
    </div>
  );
}
