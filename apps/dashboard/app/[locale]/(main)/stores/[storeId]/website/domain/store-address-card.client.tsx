"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, Facebook, Instagram, LoaderCircle, MessageCircle, Pencil, X } from "lucide-react";
import { normalizeSubdomain, storeHostname, storefrontRootDomain, storeUrl, SUBDOMAIN_MAX_LENGTH } from "@workspace/lib/storefront";
import { checkStoreSubdomain, updateStoreSubdomain } from "@/actions/seller";
import { Field, InputGroup, SellerButton } from "@/components/seller-ui";
import { cn } from "@/lib/utils";

type Availability = { state: "idle" } | { state: "checking" } | { state: "available" } | { state: "unavailable"; reason: string };

const CHECK_DELAY_MS = 400;

/**
 * The store's address ({subdomain}.tallaby.com) in the design's layout, with
 * the same actions as /settings › StoreLinkSection: copy it, or change it (an
 * explicit save, because it moves a public link). Availability comes from the
 * server; once the store has its own domain, that is the link to share.
 */
export function StoreAddressCard({
  storeId,
  initialSubdomain,
  customDomain,
  readOnly,
}: {
  storeId: string;
  initialSubdomain: string;
  customDomain: string | null;
  readOnly: boolean;
}) {
  const t = useTranslations("settings.storeLink");
  const router = useRouter();
  const [subdomain, setSubdomain] = useState(initialSubdomain);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialSubdomain);
  const [availability, setAvailability] = useState<Availability>({ state: "idle" });
  const [isSaving, startSaving] = useTransition();

  const url = storeUrl(subdomain, customDomain);
  const normalizedDraft = normalizeSubdomain(draft);
  const unchanged = normalizedDraft === subdomain;

  useEffect(() => setSubdomain(initialSubdomain), [initialSubdomain]);

  useEffect(() => {
    if (!editing || unchanged || !normalizedDraft) {
      setAvailability({ state: "idle" });
      return;
    }
    setAvailability({ state: "checking" });
    let cancelled = false;
    const timer = setTimeout(async () => {
      const res = await checkStoreSubdomain(storeId, normalizedDraft);
      if (cancelled) return;
      setAvailability(res.success ? { state: "available" } : { state: "unavailable", reason: t(`errors.${res.error}`) });
    }, CHECK_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [editing, normalizedDraft, unchanged, t, storeId]);

  const copy = async (message = t("copied")) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(message);
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const save = () =>
    startSaving(async () => {
      const res = await updateStoreSubdomain(storeId, normalizedDraft);
      if (!res.success) {
        setAvailability({ state: "unavailable", reason: t(`errors.${res.error}`) });
        return;
      }
      setSubdomain(res.subdomain);
      setDraft(res.subdomain);
      setEditing(false);
      toast.success(t("saved", { host: storeHostname(res.subdomain) }));
      router.refresh();
    });

  if (editing) {
    return (
      <div className="flex flex-col gap-2">
        <Field label={t("fieldLabel")} htmlFor="store-subdomain">
          <div dir="ltr">
            <InputGroup
              id="store-subdomain"
              start="https://"
              end={`.${storefrontRootDomain()}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              maxLength={SUBDOMAIN_MAX_LENGTH}
              autoComplete="off"
              spellCheck={false}
              autoFocus
              aria-describedby="store-subdomain-status"
              aria-invalid={availability.state === "unavailable" || undefined}
              className={cn(availability.state === "unavailable" && "border-destructive")}
              inputClassName="font-montserrat text-[13px]"
            />
          </div>
        </Field>
        <p
          id="store-subdomain-status"
          aria-live="polite"
          className={cn(
            "flex min-h-5 items-center gap-1.5 text-xs",
            availability.state === "available" && "text-success",
            availability.state === "unavailable" && "text-destructive",
            (availability.state === "idle" || availability.state === "checking") && "text-(--s-faint)",
          )}
        >
          {availability.state === "checking" && <LoaderCircle className="size-3.5 animate-spin" aria-hidden />}
          {availability.state === "available" && <Check className="size-3.5" aria-hidden />}
          {availability.state === "unavailable" && <X className="size-3.5" aria-hidden />}
          {availability.state === "checking"
            ? t("checking")
            : availability.state === "available"
              ? t("available", { host: storeHostname(normalizedDraft) })
              : availability.state === "unavailable"
                ? availability.reason
                : t("rules")}
        </p>
        <p className="text-pretty text-xs text-(--s-faint)">{t("redirectNote")}</p>
        <div className="mt-1 flex gap-2 max-[480px]:[&>*]:flex-1">
          <SellerButton variant="solid" size="sm" onClick={save} disabled={unchanged || isSaving || availability.state !== "available"}>
            {isSaving && <LoaderCircle className="animate-spin" aria-hidden />}
            {t("save")}
          </SellerButton>
          <SellerButton
            variant="mini"
            size="sm"
            disabled={isSaving}
            onClick={() => {
              setDraft(subdomain);
              setEditing(false);
            }}
          >
            {t("cancel")}
          </SellerButton>
        </div>
      </div>
    );
  }

  const shareText = encodeURIComponent(url);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 max-[720px]:[&>button]:flex-1 max-[720px]:[&>a]:flex-1">
        <div dir="ltr" className="min-w-[240px] flex-1 max-[720px]:basis-full">
          <InputGroup readOnly value={url.replace(/^https?:\/\//, "")} start="https://" aria-label={t("fieldLabel")} inputClassName="font-montserrat text-[13px]" />
        </div>
        <SellerButton size="sm" onClick={() => void copy()}>
          <Copy aria-hidden />
          {t("copy")}
        </SellerButton>
        <SellerButton asChild variant="mini" size="sm">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden className="rtl:-scale-x-100" />
            {t("open")}
          </a>
        </SellerButton>
        {!readOnly && (
          <SellerButton variant="mini" size="sm" onClick={() => setEditing(true)}>
            <Pencil aria-hidden />
            {t("change")}
          </SellerButton>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-(--s-faint)">{t("shareLabel")}</span>
        <SellerButton asChild variant="mini" size="xs">
          <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle aria-hidden />
            {t("whatsapp")}
          </a>
        </SellerButton>
        <SellerButton asChild variant="mini" size="xs">
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareText}`} target="_blank" rel="noopener noreferrer">
            <Facebook aria-hidden />
            {t("facebook")}
          </a>
        </SellerButton>
        {/* Instagram has no share URL; copy the link for the seller's bio or story. */}
        <SellerButton variant="mini" size="xs" onClick={() => void copy(t("instagramCopied"))}>
          <Instagram aria-hidden />
          {t("instagram")}
        </SellerButton>
      </div>
    </>
  );
}
