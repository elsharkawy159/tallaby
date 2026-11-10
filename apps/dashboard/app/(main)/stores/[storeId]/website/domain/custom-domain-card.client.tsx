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
import { dnsRecords, type DnsRecord } from "./domain-dns.lib";
import { DnsRegistrarSteps } from "./dns-registrar-steps.client";

/** Reasons `checkCustomDomain` reports while a domain isn't live. */
const CHECK_KEYS = new Set(["unverified", "dns", "not_attached"]);

const STEPS = ["buy", "enter", "dns"] as const;

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

  const records = view ? dnsRecords(view.domain, view.verification) : [];

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
                rows={records}
                rowKey={(r) => `${r.type}-${r.name}-${r.value}`}
                columns={[
                  { key: "type", header: t("type"), phone: "title", cell: (r) => <bdi className="font-montserrat text-[12.5px] font-semibold">{r.type}</bdi> },
                  { key: "name", header: t("name"), phone: "full", cell: (r) => <CopyCell value={r.name} label={t("copyName")} onCopy={copy} /> },
                  { key: "value", header: t("value"), phone: "full", cell: (r) => <CopyCell value={r.value} label={t("copyValue")} onCopy={copy} breakAll /> },
                  { key: "ttl", header: t("ttl"), phone: "full", cell: (r) => <CopyCell value={String(r.ttl)} label={t("copyTtl")} onCopy={copy} suffix={t("ttlHuman")} /> },
                ]}
              />
              {records.some((r) => r.name === "@") && <p className="text-pretty text-xs text-(--s-faint)">{t("nameHint")}</p>}
              <p className="text-pretty text-xs text-(--s-faint)">{t("ttlNote")}</p>
              {view.lastError && <Note>{t(`checks.${CHECK_KEYS.has(view.lastError) ? view.lastError : "dns"}`)}</Note>}
              <DnsRegistrarSteps names={cleanupNames(records)} />
              <p className="text-pretty text-xs text-(--s-faint)">{t("cloudflare")}</p>
              <div className="flex flex-wrap items-center gap-2.5 max-[720px]:[&>button]:w-full">
                <p className="min-w-0 flex-1 basis-[240px] text-pretty text-xs text-(--s-faint)">{t("propagation")}</p>
                <SellerButton variant="mini" size="sm" onClick={verify} disabled={pending || readOnly}>
                  {action === "verify" ? <LoaderCircle className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}
                  {t("verify")}
                </SellerButton>
              </div>
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

/** The A/CNAME record names, for "delete old records with the same name". */
function cleanupNames(records: DnsRecord[]): string {
  return [...new Set(records.filter((r) => r.type === "A" || r.type === "CNAME").map((r) => r.name))].join(" / ");
}

/** A record field in Latin with its copy button; `suffix` is a small note after it (the TTL in words). */
function CopyCell({ value, label, onCopy, suffix, breakAll }: { value: string; label: string; onCopy: (value: string) => void; suffix?: string; breakAll?: boolean }) {
  return (
    <span className="flex items-center gap-1">
      <span className="min-w-0">
        <bdi dir="ltr" className={cn("font-montserrat text-[12.5px] font-semibold", breakAll && "break-all")}>
          {value}
        </bdi>
        {suffix && <small className="ms-1.5 whitespace-nowrap text-[11.5px] text-(--s-subtle)">({suffix})</small>}
      </span>
      <IconButton onClick={() => onCopy(value)} aria-label={`${label}: ${value}`} className="relative z-10 size-8 shrink-0">
        <Copy className="!size-3.5" aria-hidden />
      </IconButton>
    </span>
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
