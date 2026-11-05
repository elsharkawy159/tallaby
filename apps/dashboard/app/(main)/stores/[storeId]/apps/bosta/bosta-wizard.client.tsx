"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  ClipboardPaste,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { DEFAULT_BOSTA_SETTINGS, type BostaSettings } from "@workspace/lib/integrations";
import type { BostaOverview } from "@workspace/lib/integrations/server";
import type { BostaPickupLocation } from "@workspace/lib/shipping/bosta";
import { Field, IconButton, Note, OptionCard, OptionCards, SellerButton, SellerCard, TextInput } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { BostaPreferences } from "./bosta-preferences.client";
import { updateBostaSettings, verifyBostaKey } from "./bosta.server";

export const BOSTA_DASHBOARD_URL = "https://bosta.co/dashboard";
export const BOSTA_SIGNUP_URL = "https://bosta.co";
export const BOSTA_API_KEY_GUIDE_URL = "https://docs.bosta.co/docs/how-to/get-your-api-key/";

const STEPS = ["account", "key", "verify", "prefs"] as const;
const KEY_STEPS = ["open", "otp", "create", "scope", "copy"] as const;
const SIGNUP_STEPS = ["signup", "phone", "pickup"] as const;

const b = (chunks: React.ReactNode) => <b className="font-semibold text-(--s-text)">{chunks}</b>;

/**
 * The 4-step Bosta connect wizard (BS-06): account → create a key → paste
 * and verify → shipping preferences → done. Steps already passed can be
 * revisited from the progress bar.
 */
export function BostaWizard({
  storeId,
  initial,
  readOnly,
  onFinished,
}: {
  storeId: string;
  initial: BostaOverview | null;
  readOnly: boolean;
  onFinished: (overview: BostaOverview) => void;
}) {
  const t = useTranslations("storeApps.bosta");
  const tErr = useTranslations("storeApps.errors");
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [hasAccount, setHasAccount] = useState<"yes" | "no" | "">("");
  const [overview, setOverview] = useState<BostaOverview | null>(initial);
  const [locations, setLocations] = useState<BostaPickupLocation[] | null>(null);
  const [done, setDone] = useState<BostaSettings | null>(null);
  const [isPending, startTransition] = useTransition();

  const go = (next: number) => {
    setStep(next);
    setReached((r) => Math.max(r, next));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finish = (values: Parameters<typeof updateBostaSettings>[1]) => {
    startTransition(async () => {
      const result = await updateBostaSettings(storeId, values);
      if (!result.success) {
        toast.error(tErr(result.error));
        return;
      }
      setOverview(result.data);
      setDone(result.data.settings);
    });
  };

  if (done && overview) {
    return <DoneScreen storeId={storeId} settings={done} onSettings={() => onFinished(overview)} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <ol className="grid grid-cols-4 gap-1.5" aria-label={t("wizard.progress")}>
        {STEPS.map((key, index) => {
          const state = index < step ? "done" : index === step ? "current" : "todo";
          const reachable = index <= reached && index !== step;
          return (
            <li key={key} className="min-w-0">
              <button
                type="button"
                disabled={!reachable}
                aria-current={state === "current" ? "step" : undefined}
                onClick={() => go(index)}
                className="group flex min-h-10 w-full flex-col gap-2 text-start disabled:cursor-default"
              >
                <span
                  className={cn(
                    "h-1.5 rounded-full bg-(--s-fill) transition-colors",
                    state !== "todo" && "bg-(--s-primary)",
                  )}
                />
                <span
                  className={cn(
                    "flex items-center gap-1.5 truncate text-[12px] font-semibold text-(--s-faint) sm:text-[13px]",
                    state === "current" && "text-(--s-ink)",
                    state === "done" && "text-(--s-link) group-enabled:group-hover:underline",
                  )}
                >
                  {state === "done" ? <Check className="size-3.5 shrink-0" aria-hidden /> : <span className="shrink-0">{index + 1}.</span>}
                  <span className="truncate">{t(`wizard.steps.${key}`)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <SellerCard className="p-6 max-[720px]:p-4">
        {step === 0 && (
          <StepShell title={t("account.title")} body={t("account.body")}>
            <OptionCards>
              <OptionCard name="bosta-has-account" title={t("account.yes")} description={t("account.yesBody")} checked={hasAccount === "yes"} onChange={() => setHasAccount("yes")} />
              <OptionCard name="bosta-has-account" title={t("account.no")} description={t("account.noBody")} checked={hasAccount === "no"} onChange={() => setHasAccount("no")} />
            </OptionCards>
            {hasAccount === "no" && (
              <div className="rounded-2xl bg-(--s-tint) p-4">
                <NumberedList keys={SIGNUP_STEPS} render={(key) => t.rich(`account.checklist.${key}`, { b })} />
                <SellerButton asChild variant="outline" className="mt-4">
                  <a href={BOSTA_SIGNUP_URL} target="_blank" rel="noopener noreferrer">
                    {t("account.openSignup")}
                    <ExternalLink aria-hidden />
                  </a>
                </SellerButton>
              </div>
            )}
            <StepFooter>
              <SellerButton disabled={!hasAccount} onClick={() => go(1)}>
                {hasAccount === "no" ? t("account.doneContinue") : t("wizard.next")}
                <ArrowRight className="rtl:rotate-180" aria-hidden />
              </SellerButton>
            </StepFooter>
          </StepShell>
        )}

        {step === 1 && (
          <StepShell title={t("key.title")} body={t("key.body")}>
            <NumberedList keys={KEY_STEPS} render={(key) => t.rich(`key.steps.${key}`, { b })} />
            <Note icon={ShieldCheck}>{t.rich("key.scopeNote", { b })}</Note>
            <Note tone="amber" icon={TriangleAlert}>
              {t("key.copyWarning")}
            </Note>
            <StepFooter onBack={() => go(0)}>
              <SellerButton asChild variant="outline">
                <a href={BOSTA_DASHBOARD_URL} target="_blank" rel="noopener noreferrer">
                  {t("key.openDashboard")}
                  <ExternalLink aria-hidden />
                </a>
              </SellerButton>
              <SellerButton onClick={() => go(2)}>
                {t("key.haveKey")}
                <ArrowRight className="rtl:rotate-180" aria-hidden />
              </SellerButton>
            </StepFooter>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell title={t("verify.title")} body={t("verify.body")}>
            <BostaKeyField
              storeId={storeId}
              saved={overview?.summary.credentialsSaved ? overview.settings.keyHint : null}
              disabled={readOnly}
              onVerified={(result) => {
                setOverview(result.overview);
                setLocations(result.pickupLocations);
              }}
            />
            {locations && (
              <Note tone={locations.length ? "success" : "amber"} icon={locations.length ? CircleCheck : TriangleAlert}>
                <span role="status">
                  {locations.length ? t("verify.ok", { count: locations.length }) : t("verify.noLocations")}
                  {!locations.length && (
                    <a href={BOSTA_DASHBOARD_URL} target="_blank" rel="noopener noreferrer" className="ms-1 font-semibold underline">
                      {t("key.openDashboard")}
                    </a>
                  )}
                </span>
              </Note>
            )}
            <StepFooter onBack={() => go(1)}>
              <SellerButton disabled={!locations?.length} onClick={() => go(3)}>
                {t("wizard.next")}
                <ArrowRight className="rtl:rotate-180" aria-hidden />
              </SellerButton>
            </StepFooter>
          </StepShell>
        )}

        {step === 3 && overview && (
          <StepShell title={t("prefs.title")} body={t("prefs.body")}>
            <BostaPreferences
              settings={overview.settings ?? DEFAULT_BOSTA_SETTINGS}
              locations={locations}
              pending={isPending}
              disabled={readOnly}
              submitLabel={t("wizard.finish")}
              onSubmit={finish}
            />
            <SellerButton variant="mini" className="self-start" onClick={() => go(2)}>
              <ArrowLeft className="rtl:rotate-180" aria-hidden />
              {t("wizard.back")}
            </SellerButton>
          </StepShell>
        )}
      </SellerCard>

      <p className="text-center text-xs text-(--s-faint)">
        {t.rich("wizard.help", {
          link: (chunks) => (
            <a href={BOSTA_API_KEY_GUIDE_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-(--s-link) underline max-[600px]:inline-flex max-[600px]:min-h-10 max-[600px]:items-center">
              {chunks}
            </a>
          ),
        })}
      </p>
    </div>
  );
}

/**
 * The write-only key input with paste and show/hide. It never shows a saved
 * key: only its last 4 characters, and an empty field re-checks it.
 */
export function BostaKeyField({
  storeId,
  saved,
  disabled,
  onVerified,
}: {
  storeId: string;
  /** The saved key's last 4 characters, or null when no key is saved. */
  saved: string | null;
  disabled?: boolean;
  onVerified: (result: { overview: BostaOverview; pickupLocations: BostaPickupLocation[] }) => void;
}) {
  const t = useTranslations("storeApps.bosta");
  const tErr = useTranslations("storeApps.errors");
  const [key, setKey] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canVerify = Boolean(key.trim()) || Boolean(saved);

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setKey(text.trim());
        setError(null);
      }
    } catch {
      toast.error(t("verify.pasteBlocked"));
    }
  };

  const verify = () => {
    startTransition(async () => {
      const result = await verifyBostaKey(storeId, key);
      if (!result.success) {
        setError(tErr(result.error));
        return;
      }
      setKey("");
      setVisible(false);
      setError(null);
      onVerified(result.data);
    });
  };

  return (
    <Field label={t("verify.label")} htmlFor="bosta-key">
      <div className="flex flex-wrap gap-2">
        {/* The key is Latin text: the whole box is LTR, so the icon, the padding and the buttons line up in Arabic too. */}
        <div dir="ltr" className="relative min-w-[220px] flex-1">
          <KeyRound className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-(--s-subtle)" aria-hidden />
          <TextInput
            id="bosta-key"
            type={visible ? "text" : "password"}
            autoComplete="off"
            spellCheck={false}
            className="ps-10 pe-24 font-montserrat"
            value={key}
            placeholder={saved ? t("verify.savedPlaceholder", { hint: saved }) : t("verify.placeholder")}
            aria-invalid={error ? true : undefined}
            aria-describedby="bosta-key-hint"
            disabled={disabled || isPending}
            onChange={(event) => {
              setKey(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && canVerify) verify();
            }}
          />
          <div className="absolute end-0.5 top-1/2 flex -translate-y-1/2">
            <IconButton className="size-10 max-[600px]:size-10" onClick={paste} disabled={disabled || isPending} aria-label={t("verify.paste")}>
              <ClipboardPaste aria-hidden />
            </IconButton>
            <IconButton className="size-10 max-[600px]:size-10" onClick={() => setVisible((v) => !v)} aria-label={visible ? t("verify.hide") : t("verify.show")}>
              {visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
            </IconButton>
          </div>
        </div>
        <SellerButton variant="solid" className="h-[46px] max-[600px]:w-full" disabled={disabled || isPending || !canVerify} onClick={verify}>
          {isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : <ShieldCheck aria-hidden />}
          {isPending ? t("verify.checking") : t("verify.action")}
        </SellerButton>
      </div>
      <p id="bosta-key-hint" className="text-xs text-(--s-faint)">
        {error ? <span className="font-semibold text-destructive">{error}</span> : t("verify.hint")}
      </p>
    </Field>
  );
}

function StepShell({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[16.5px] font-bold text-(--s-ink)">{title}</h2>
        <p className="mt-0.5 text-pretty text-[13px] text-(--s-subtle)">{body}</p>
      </div>
      {children}
    </div>
  );
}

function StepFooter({ onBack, children }: { onBack?: () => void; children: React.ReactNode }) {
  const t = useTranslations("storeApps.bosta.wizard");
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-(--s-line-soft) pt-4">
      {onBack && (
        <SellerButton variant="mini" className="me-auto" onClick={onBack}>
          <ArrowLeft className="rtl:rotate-180" aria-hidden />
          {t("back")}
        </SellerButton>
      )}
      {children}
    </div>
  );
}

function NumberedList<K extends string>({ keys, render }: { keys: readonly K[]; render: (key: K) => React.ReactNode }) {
  return (
    <ol className="flex flex-col">
      {keys.map((key, index) => (
        <li key={key} className="relative flex gap-3 pb-4 text-[13px] text-(--s-muted) last:pb-0">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft font-montserrat text-[11.5px] font-bold text-primary-ink">
            {index + 1}
          </span>
          {index < keys.length - 1 && <span className="absolute start-[11.5px] top-7 bottom-1 w-px bg-(--s-line)" aria-hidden />}
          <span className="pt-0.5 leading-relaxed">{render(key)}</span>
        </li>
      ))}
    </ol>
  );
}

function DoneScreen({ storeId, settings, onSettings }: { storeId: string; settings: BostaSettings; onSettings: () => void }) {
  const t = useTranslations("storeApps.bosta.done");
  return (
    <SellerCard className="flex flex-col items-center gap-4 px-5 py-10 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-success-soft text-success">
        <CircleCheck className="size-9" aria-hidden />
      </span>
      <h2 className="text-xl font-bold text-(--s-ink)">{t("title")}</h2>
      <p className="max-w-[440px] text-pretty text-[13.5px] text-(--s-muted)">
        {settings.autoShip === "on_confirm" ? t("bodyAuto") : t("bodyManual")}
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2 max-[600px]:w-full max-[600px]:[&>*]:flex-1">
        <SellerButton asChild>
          <Link href="/orders">{t("orders")}</Link>
        </SellerButton>
        <SellerButton asChild variant="outline">
          <Link href={`/stores/${storeId}/shipping`}>{t("shipping")}</Link>
        </SellerButton>
        <SellerButton variant="mini" onClick={onSettings}>
          {t("settings")}
        </SellerButton>
      </div>
    </SellerCard>
  );
}
