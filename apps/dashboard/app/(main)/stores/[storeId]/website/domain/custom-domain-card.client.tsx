"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BadgeCheck, CircleAlert, CircleCheck, Clock, Copy, ExternalLink, Link2, LoaderCircle, RefreshCw, Trash2 } from "lucide-react";
import { normalizeCustomDomain, storeUrl, validateCustomDomain } from "@workspace/lib/storefront";
import { addCustomDomain, removeCustomDomain, verifyCustomDomain, type CustomDomainResult, type CustomDomainView } from "@/actions/custom-domain";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { IconButton, InputGroup, Note, ResponsiveTable, SectionCard, SellerButton, StatusBadge, Tag } from "@/components/seller-ui";
import { cn } from "@/lib/utils";

/** Vercel's targets; mirrors packages/lib/src/storefront/vercel-domains.ts. */
const APEX_A_RECORD = "76.76.21.21";
const WWW_CNAME = "cname.vercel-dns.com";

/** Reasons `checkCustomDomain` reports while a domain isn't live. */
const CHECK_KEYS = new Set(["unverified", "dns", "not_attached"]);

const STEPS = ["buy", "enter", "dns"] as const;

type DnsRecord = { type: string; name: string; value: string };

function dnsRecords(view: CustomDomainView): DnsRecord[] {
  const records: DnsRecord[] = [
    { type: "A", name: "@", value: APEX_A_RECORD },
    { type: "CNAME", name: "www", value: WWW_CNAME },
  ];
  for (const v of view.verification) {
    // `_vercel.faster-eg.com` → `_vercel` (registrars want the host part).
    const name = v.domain.endsWith(`.${view.domain}`) ? v.domain.slice(0, -(view.domain.length + 1)) : v.domain;
    records.push({ type: v.type, name, value: v.value });
  }
  return records;
}

/**
 * A domain the seller owns, in the design's layout: add it, follow the DNS
 * records, verify. Same actions as /settings › CustomDomainSection. What it
 * shows is always the stored state: `view.status` for the badge, the real
 * records for this domain, and "active" only after the server has verified it.
 */
export function CustomDomainCard({ storeId, initial, readOnly }: { storeId: string; initial: CustomDomainView | null; readOnly: boolean }) {
  const t = useTranslations("settings.customDomain");
  const router = useRouter();
  const [view, setView] = useState(initial);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<"add" | "verify" | "remove" | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const normalizedDraft = normalizeCustomDomain(draft);
  const draftProblem = normalizedDraft ? validateCustomDomain(normalizedDraft) : null;
  const shownError = error ?? (draftProblem ? t(`errors.${draftProblem}`) : null);
  const canAdd = Boolean(normalizedDraft) && !draftProblem && !pending && !readOnly;

  const run = (kind: "add" | "verify" | "remove", fn: () => Promise<CustomDomainResult>, onSuccess?: (domain: CustomDomainView | null) => void) => {
    setAction(kind);
    setError(null);
    startTransition(async () => {
      const res = await fn();
      setAction(null);
      if (!res.success) {
        setError(t(`errors.${res.error}`));
        return;
      }
      setView(res.domain);
      onSuccess?.(res.domain);
      router.refresh();
    });
  };

  const add = () =>
    run("add", () => addCustomDomain(storeId, draft), () => {
      setDraft("");
      toast.success(t("added"));
    });

  const verify = () =>
    run("verify", () => verifyCustomDomain(storeId), (domain) => {
      if (domain?.status === "active") toast.success(t("nowLive", { host: domain.domain }));
      else toast.info(t("notYet"));
    });

  // The confirm closes at once; the Remove button then shows progress and any error shows inline.
  const remove = () => {
    if (!view) return;
    setConfirmRemove(false);
    run("remove", () => removeCustomDomain(storeId), () => toast.success(t("removed")));
  };

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <SectionCard
      id="custom-domain"
      icon={BadgeCheck}
      title={
        <>
          {t("title")}
          {view ? <DomainStatus status={view.status} /> : <Tag>{t("optional")}</Tag>}
        </>
      }
      description={t("description")}
    >
      {!view ? (
        <>
          <div className="flex flex-wrap items-center gap-2 max-[720px]:[&>button]:flex-1">
            <div dir="ltr" className="min-w-[240px] flex-1 max-[720px]:basis-full">
              <InputGroup
                id="custom-domain-input"
                start="https://"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canAdd) add();
                }}
                placeholder="yourstore.com"
                autoComplete="off"
                spellCheck={false}
                disabled={readOnly}
                aria-label={t("fieldLabel")}
                aria-invalid={Boolean(shownError)}
                aria-describedby="custom-domain-status"
                className={cn(shownError && "border-destructive")}
                inputClassName="font-montserrat text-[13px]"
              />
            </div>
            <SellerButton variant="solid" size="sm" onClick={add} disabled={!canAdd}>
              {action === "add" ? <LoaderCircle className="animate-spin" aria-hidden /> : <Link2 aria-hidden />}
              {t("connect")}
            </SellerButton>
          </div>
          <p id="custom-domain-status" aria-live="polite" className={cn("text-pretty text-xs", shownError ? "font-semibold text-destructive" : "text-(--s-faint)")}>
            {shownError ?? (normalizedDraft ? t("willConnect", { host: normalizedDraft }) : t("hint"))}
          </p>
          <ol className="grid grid-cols-3 gap-2.5 max-[720px]:grid-cols-1">
            {STEPS.map((step, i) => (
              <li key={step} className="flex items-start gap-2.5 rounded-2xl bg-(--s-tint) p-3 text-[12.5px] leading-[1.6] text-(--s-muted)">
                <span className="grid size-6 shrink-0 place-items-center rounded-full border border-(--s-field) bg-(--s-surface) font-montserrat text-xs font-bold text-(--s-ink)">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <b className="block font-bold text-(--s-text)">{t(`steps.${step}.title`)}</b>
                  {t(`steps.${step}.body`)}
                </span>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 max-[720px]:[&>button]:flex-1 max-[720px]:[&>a]:flex-1">
            <div dir="ltr" className="min-w-[220px] flex-1 max-[720px]:basis-full">
              <InputGroup readOnly value={view.domain} start="https://" aria-label={t("fieldLabel")} inputClassName="font-montserrat text-[13px]" />
            </div>
            {view.status === "active" ? (
              <SellerButton asChild variant="mini" size="sm">
                <a href={storeUrl("", view.domain)} target="_blank" rel="noopener noreferrer">
                  <ExternalLink aria-hidden className="rtl:-scale-x-100" />
                  {t("open")}
                </a>
              </SellerButton>
            ) : (
              <SellerButton variant="solid" size="sm" onClick={verify} disabled={pending || readOnly}>
                {action === "verify" ? <LoaderCircle className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}
                {t("verify")}
              </SellerButton>
            )}
            <SellerButton variant="mini" size="sm" className="text-destructive [&_svg]:text-destructive" onClick={() => setConfirmRemove(true)} disabled={pending || readOnly}>
              {action === "remove" ? <LoaderCircle className="animate-spin" aria-hidden /> : <Trash2 aria-hidden />}
              {t("remove")}
            </SellerButton>
            <ConfirmActionDialog
              open={confirmRemove}
              onOpenChange={setConfirmRemove}
              title={t("removeConfirm", { host: view.domain })}
              confirmLabel={t("remove")}
              destructive
              onConfirm={remove}
            />
          </div>

          {error && (
            <p role="alert" className="text-xs font-semibold text-destructive">
              {error}
            </p>
          )}

          {view.status !== "active" && (
            <div className="flex flex-col gap-2.5">
              <Note tone="amber" icon={Clock}>
                <b className="block">{t("dnsTitle")}</b>
                {t("dnsIntro")}
              </Note>
              <ResponsiveTable
                label={t("dnsTitle")}
                rows={dnsRecords(view)}
                rowKey={(r) => `${r.type}-${r.name}-${r.value}`}
                columns={[
                  { key: "type", header: t("type"), phone: "title", cell: (r) => <bdi className="font-montserrat text-[12.5px] font-semibold">{r.type}</bdi> },
                  { key: "name", header: t("name"), phone: "end", cell: (r) => <bdi dir="ltr" className="font-montserrat text-[12.5px] font-semibold">{r.name}</bdi> },
                  {
                    key: "value",
                    header: t("value"),
                    phone: "full",
                    cell: (r) => (
                      <span className="flex items-center gap-1">
                        <bdi dir="ltr" className="min-w-0 break-all font-montserrat text-[12.5px] font-semibold">
                          {r.value}
                        </bdi>
                        <IconButton onClick={() => copy(r.value)} aria-label={t("copyValue")} className="relative z-10 size-8">
                          <Copy className="!size-3.5" aria-hidden />
                        </IconButton>
                      </span>
                    ),
                  },
                ]}
              />
              {view.lastError && <Note>{t(`checks.${CHECK_KEYS.has(view.lastError) ? view.lastError : "dns"}`)}</Note>}
              <p className="text-pretty text-xs text-(--s-faint)">{t("propagation")}</p>
              <p className="text-pretty text-xs text-(--s-faint)">{t("cloudflare")}</p>
            </div>
          )}

          {view.status === "active" && (
            <Note tone="success" icon={CircleCheck}>
              {t("activeNote")}
            </Note>
          )}
        </>
      )}
    </SectionCard>
  );
}

function DomainStatus({ status }: { status: CustomDomainView["status"] }) {
  const t = useTranslations("settings.customDomain.status");
  if (status === "active") return <StatusBadge tone="success">{t("active")}</StatusBadge>;
  if (status === "failed")
    return (
      <StatusBadge tone="danger">
        <CircleAlert className="size-3" aria-hidden />
        {t("failed")}
      </StatusBadge>
    );
  return <StatusBadge tone="warning">{t("pending")}</StatusBadge>;
}
