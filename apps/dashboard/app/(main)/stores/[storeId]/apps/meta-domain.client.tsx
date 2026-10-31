"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";

import { FACEBOOK_DOMAIN_VERIFICATION_RE } from "@workspace/lib/stores";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { cn } from "@workspace/ui/lib/utils";
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
    <div className="flex flex-col gap-3 rounded-xl border p-3.5">
      <div>
        <p className="text-sm font-bold">{t("title")}</p>
        <p className="text-xs text-muted-foreground">{t("hint")}</p>
      </div>
      {!hasCustomDomain && (
        <p className="rounded-xl bg-accent-soft p-2.5 text-xs text-accent-ink">{t("needsDomain")}</p>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="meta-domain-token" className="text-[13px] font-semibold">
          {t("label")}
        </Label>
        <Input
          id="meta-domain-token"
          dir="ltr"
          autoComplete="off"
          spellCheck={false}
          className={cn("h-10 rounded-xl bg-muted/40 px-3 font-mono text-xs", !valid && "border-destructive")}
          value={value}
          placeholder={PLACEHOLDER}
          disabled={readOnly || isPending}
          aria-invalid={!valid || undefined}
          onChange={(event) => setValue(event.target.value)}
          // A pasted tag becomes its token right away.
          onBlur={() => setValue(token)}
        />
        {!valid ? (
          <p className="text-xs text-destructive">{t("invalid")}</p>
        ) : (
          saved &&
          !dirty && <p className="text-xs text-success">{t("live")}</p>
        )}
      </div>
      <Button
        type="button"
        variant="secondary"
        className="h-9 self-start rounded-[10px] font-semibold"
        disabled={readOnly || isPending || !dirty || !valid}
        onClick={save}
      >
        {isPending && <LoaderCircle className="animate-spin" aria-hidden />}
        {t("save")}
      </Button>
    </div>
  );
}
