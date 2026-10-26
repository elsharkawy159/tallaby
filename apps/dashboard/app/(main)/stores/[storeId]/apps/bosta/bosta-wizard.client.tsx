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
  UserPlus,
  UserRoundCheck,
} from "lucide-react";

import { DEFAULT_BOSTA_SETTINGS, type BostaSettings } from "@workspace/lib/integrations";
import type { BostaOverview } from "@workspace/lib/integrations/server";
import type { BostaPickupLocation } from "@workspace/lib/shipping/bosta";
import { Button } from "@workspace/ui/components/button";
import { ChoiceCard, ChoiceGroup } from "@workspace/ui/components/choice-card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { cn } from "@workspace/ui/lib/utils";
import { BUTTON_CLASS, FIELD_CLASS } from "@/components/form/form-ui";
import { BostaPreferences } from "./bosta-preferences.client";
import { updateBostaSettings, verifyBostaKey } from "./bosta.server";

export const BOSTA_DASHBOARD_URL = "https://bosta.co/dashboard";
export const BOSTA_SIGNUP_URL = "https://bosta.co";
export const BOSTA_API_KEY_GUIDE_URL = "https://docs.bosta.co/docs/how-to/get-your-api-key/";

const STEPS = ["account", "key", "verify", "prefs"] as const;
const KEY_STEPS = ["open", "otp", "create", "scope", "copy"] as const;
const SIGNUP_STEPS = ["signup", "phone", "pickup"] as const;

const b = (chunks: React.ReactNode) => <b className="font-semibold text-foreground">{chunks}</b>;

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
    <div className="flex flex-col gap-6">
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
                className="group flex w-full flex-col gap-2 text-start disabled:cursor-default"
              >
                <span
                  className={cn(
                    "h-1.5 rounded-full bg-muted transition-colors",
                    state !== "todo" && "bg-primary",
                    state === "current" && "bg-primary/70",
                  )}
                />
                <span
                  className={cn(
                    "flex items-center gap-1.5 truncate text-[12px] font-semibold text-faint sm:text-[13px]",
                    state === "current" && "text-foreground",
                    state === "done" && "text-primary group-enabled:group-hover:underline",
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

      <div className="rounded-2xl border bg-card p-4 shadow-xs sm:p-6">
        {step === 0 && (
          <StepShell title={t("account.title")} body={t("account.body")}>
            <ChoiceGroup
              stack
              className="sm:grid-cols-2"
              value={hasAccount}
              onValueChange={(value) => setHasAccount(value === "yes" ? "yes" : "no")}
              aria-label={t("account.title")}
            >
              <ChoiceCard size="lg" value="yes" indicator icon={<UserRoundCheck aria-hidden />} title={t("account.yes")} description={t("account.yesBody")} />
              <ChoiceCard size="lg" value="no" indicator icon={<UserPlus aria-hidden />} title={t("account.no")} description={t("account.noBody")} />
            </ChoiceGroup>
            {hasAccount === "no" && (
              <div className="rounded-xl bg-muted/50 p-4">
                <NumberedList keys={SIGNUP_STEPS} render={(key) => t.rich(`account.checklist.${key}`, { b })} />
                <Button asChild variant="outline" className={cn(BUTTON_CLASS, "mt-4")}>
                  <a href={BOSTA_SIGNUP_URL} target="_blank" rel="noopener noreferrer">
                    {t("account.openSignup")}
                    <ExternalLink className="size-4" aria-hidden />
                  </a>
                </Button>
              </div>
            )}
            <StepFooter>
              <Button type="button" className={BUTTON_CLASS} disabled={!hasAccount} onClick={() => go(1)}>
                {hasAccount === "no" ? t("account.doneContinue") : t("wizard.next")}
                <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
              </Button>
            </StepFooter>
          </StepShell>
        )}

        {step === 1 && (
          <StepShell title={t("key.title")} body={t("key.body")}>
            <NumberedList keys={KEY_STEPS} render={(key) => t.rich(`key.steps.${key}`, { b })} />
            <div className="flex gap-3 rounded-xl bg-primary-soft p-3.5 text-[13px] leading-relaxed text-primary-ink">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{t.rich("key.scopeNote", { b })}</span>
            </div>
            <div className="flex gap-3 rounded-xl bg-accent-soft p-3.5 text-[13px] leading-relaxed text-accent-ink">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{t("key.copyWarning")}</span>
            </div>
            <StepFooter onBack={() => go(0)}>
              <Button asChild variant="outline" className={BUTTON_CLASS}>
                <a href={BOSTA_DASHBOARD_URL} target="_blank" rel="noopener noreferrer">
                  {t("key.openDashboard")}
                  <ExternalLink className="size-4" aria-hidden />
                </a>
              </Button>
              <Button type="button" className={BUTTON_CLASS} onClick={() => go(2)}>
                {t("key.haveKey")}
                <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
              </Button>
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
              <div
                role="status"
                className={cn(
                  "flex gap-3 rounded-xl p-3.5 text-[13px]",
                  locations.length ? "bg-success-soft text-success" : "bg-accent-soft text-accent-ink",
                )}
              >
                {locations.length ? <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> : <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />}
                <span>
                  {locations.length ? t("verify.ok", { count: locations.length }) : t("verify.noLocations")}
                  {!locations.length && (
                    <a href={BOSTA_DASHBOARD_URL} target="_blank" rel="noopener noreferrer" className="ms-1 font-semibold underline">
                      {t("key.openDashboard")}
                    </a>
                  )}
                </span>
              </div>
            )}
            <StepFooter onBack={() => go(1)}>
              <Button type="button" className={BUTTON_CLASS} disabled={!locations?.length} onClick={() => go(3)}>
                {t("wizard.next")}
                <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
              </Button>
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
            <Button type="button" variant="ghost" className={cn(BUTTON_CLASS, "self-start")} onClick={() => go(2)}>
              <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
              {t("wizard.back")}
            </Button>
          </StepShell>
        )}
      </div>

      <p className="text-center text-xs text-faint">
        {t.rich("wizard.help", {
          link: (chunks) => (
            <a href={BOSTA_API_KEY_GUIDE_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">
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
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="bosta-key">{t("verify.label")}</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        {/* The key is Latin text: the whole box is LTR, so the icon, the padding and the buttons line up in Arabic too. */}
        <div dir="ltr" className="relative min-w-0 flex-1">
          <KeyRound className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
          <Input
            id="bosta-key"
            type={visible ? "text" : "password"}
            autoComplete="off"
            spellCheck={false}
            className={cn(FIELD_CLASS, "ps-10 pe-20 font-mono", error && "border-destructive")}
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
          <div className="absolute end-1.5 top-1/2 flex -translate-y-1/2 gap-0.5">
            <Button type="button" variant="ghost" size="icon" className="size-8" onClick={paste} disabled={disabled || isPending} aria-label={t("verify.paste")}>
              <ClipboardPaste className="size-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? t("verify.hide") : t("verify.show")}
            >
              {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            </Button>
          </div>
        </div>
        <Button type="button" className={BUTTON_CLASS} disabled={disabled || isPending || !canVerify} onClick={verify}>
          {isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : <ShieldCheck className="size-4" aria-hidden />}
          {isPending ? t("verify.checking") : t("verify.action")}
        </Button>
      </div>
      <p id="bosta-key-hint" className="text-xs text-muted-foreground">
        {error ? <span className="text-destructive">{error}</span> : t("verify.hint")}
      </p>
    </div>
  );
}

function StepShell({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-extrabold sm:text-xl">{title}</h2>
        <p className="mt-1 text-pretty text-[13.5px] text-muted-foreground">{body}</p>
      </div>
      {children}
    </div>
  );
}

function StepFooter({ onBack, children }: { onBack?: () => void; children: React.ReactNode }) {
  const t = useTranslations("storeApps.bosta.wizard");
  return (
    <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:items-center sm:justify-end">
      {onBack && (
        <Button type="button" variant="ghost" className={cn(BUTTON_CLASS, "sm:me-auto")} onClick={onBack}>
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
          {t("back")}
        </Button>
      )}
      {children}
    </div>
  );
}

function NumberedList<K extends string>({ keys, render }: { keys: readonly K[]; render: (key: K) => React.ReactNode }) {
  return (
    <ol className="flex flex-col">
      {keys.map((key, index) => (
        <li key={key} className="relative flex gap-3 pb-4 text-[13.5px] text-muted-foreground last:pb-0">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-ink">
            {index + 1}
          </span>
          {index < keys.length - 1 && <span className="absolute start-[11.5px] top-7 bottom-1 w-px bg-border" aria-hidden />}
          <span className="pt-0.5 leading-relaxed">{render(key)}</span>
        </li>
      ))}
    </ol>
  );
}

function DoneScreen({ storeId, settings, onSettings }: { storeId: string; settings: BostaSettings; onSettings: () => void }) {
  const t = useTranslations("storeApps.bosta.done");
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card px-5 py-10 text-center shadow-xs">
      <span className="grid size-16 place-items-center rounded-full bg-success-soft text-success">
        <CircleCheck className="size-9" aria-hidden />
      </span>
      <h2 className="text-xl font-extrabold">{t("title")}</h2>
      <p className="max-w-[440px] text-pretty text-muted-foreground">
        {settings.autoShip === "on_confirm" ? t("bodyAuto") : t("bodyManual")}
      </p>
      <div className="mt-2 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Button asChild className={BUTTON_CLASS}>
          <Link href="/orders">{t("orders")}</Link>
        </Button>
        <Button asChild variant="outline" className={BUTTON_CLASS}>
          <Link href={`/stores/${storeId}/shipping`}>{t("shipping")}</Link>
        </Button>
        <Button type="button" variant="ghost" className={BUTTON_CLASS} onClick={onSettings}>
          {t("settings")}
        </Button>
      </div>
    </div>
  );
}
