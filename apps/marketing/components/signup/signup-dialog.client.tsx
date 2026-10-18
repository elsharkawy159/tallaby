"use client";

import * as React from "react";
import { Check, CircleAlert, CircleCheck, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Label } from "@workspace/ui/components/label";
import { cn } from "@workspace/ui/lib/utils";
import { Link } from "@/i18n/navigation";
import { DASHBOARD_URL, LOGIN_URL, ROOT_DOMAIN, hasArabic, slugify } from "@/lib/site.lib";
import { CtaButton } from "@/components/site/cta-button";
import { createClient } from "@/supabase/client";
import { checkSubdomainAvailability } from "./subdomain.server";
import type { SubdomainAvailability } from "./subdomain.dto";
import { signUpWithEmail, startGoogleSignup } from "./signup.server";
import { EGYPT_MOBILE, type SignupErrorKey, type SignupResult } from "./signup.dto";

type SignupContextValue = { openSignup: (slug?: string) => void };

const SignupContext = React.createContext<SignupContextValue | null>(null);

export function useSignup(): SignupContextValue {
  const ctx = React.useContext(SignupContext);
  if (!ctx) throw new Error("useSignup must be used inside <SignupProvider>");
  return ctx;
}

const KNOWN_ERRORS: SignupErrorKey[] = ["subdomainTaken", "generic"];

/**
 * Site-wide "create your store" dialog: account (email + password or Google)
 * and the seller's first store in one step, through the same
 * `ensureSellerAccount` flow as the dashboard signup (PLAN.md §6).
 */
export function SignupProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [initialSlug, setInitialSlug] = React.useState("");
  const [initialError, setInitialError] = React.useState<SignupErrorKey | null>(null);
  const [session, setSession] = React.useState(0);

  const openSignup = React.useCallback((slug?: string) => {
    setInitialSlug(slug ? slugify(slug) : "");
    setInitialError(null);
    setSession((n) => n + 1);
    setOpen(true);
  }, []);

  // `/#signup` opens the dialog (design); `?signup_error=` comes back from the auth callback.
  React.useEffect(() => {
    const fromUrl = () => {
      const url = new URL(window.location.href);
      const error = url.searchParams.get("signup_error") as SignupErrorKey | null;
      if (error || url.hash === "#signup") {
        openSignup();
        if (error && KNOWN_ERRORS.includes(error)) setInitialError(error);
        if (error) {
          url.searchParams.delete("signup_error");
          window.history.replaceState(null, "", url);
        }
      }
    };
    fromUrl();
    window.addEventListener("hashchange", fromUrl);
    return () => window.removeEventListener("hashchange", fromUrl);
  }, [openSignup]);

  const value = React.useMemo(() => ({ openSignup }), [openSignup]);

  return (
    <SignupContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100vh-32px)] overflow-auto rounded-[20px] p-[26px] sm:max-w-[440px] sm:p-8">
          {open ? <SignupForm key={session} initialSlug={initialSlug} initialError={initialError} /> : null}
        </DialogContent>
      </Dialog>
    </SignupContext.Provider>
  );
}

type SlugState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "local"; message: "tooShort" | "arabic" | "required" }
  | { kind: "result"; result: SubdomainAvailability };

type Step = { kind: "form" } | { kind: "confirm"; email: string } | { kind: "done"; subdomain: string };

const inputBox =
  "flex h-12 items-center overflow-hidden rounded-[10px] border bg-white transition-[border-color,box-shadow] focus-within:border-teal-700 focus-within:ring-[3px] focus-within:ring-teal-700/12";
const inputEl = "h-full min-w-0 flex-1 bg-transparent px-3.5 text-[15px] outline-none";

function useSlugCheck(slug: string, initialSlug: string) {
  const [state, setState] = React.useState<SlugState>({ kind: "idle" });
  const requestId = React.useRef(0);

  const run = React.useCallback((value: string) => {
    const id = ++requestId.current;
    if (!value) return setState({ kind: "idle" });
    if (value.length < 3) return setState({ kind: "local", message: "tooShort" });
    setState({ kind: "checking" });
    checkSubdomainAvailability(value)
      .then((result) => id === requestId.current && setState({ kind: "result", result }))
      .catch(() => id === requestId.current && setState({ kind: "result", result: { status: "unknown", subdomain: value, suggestions: [] } }));
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => run(slug), slug === initialSlug ? 0 : 350);
    return () => window.clearTimeout(timer);
  }, [slug, initialSlug, run]);

  return [state, setState] as const;
}

function SignupForm({ initialSlug, initialError }: { initialSlug: string; initialError: SignupErrorKey | null }) {
  const t = useTranslations("signup");
  const [step, setStep] = React.useState<Step>({ kind: "form" });
  const [slug, setSlug] = React.useState(initialSlug);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [touched, setTouched] = React.useState(false);
  const [formError, setFormError] = React.useState<SignupErrorKey | null>(initialError);
  const [pending, startTransition] = React.useTransition();
  const [googlePending, setGooglePending] = React.useState(false);
  const [slugState, setSlugState] = useSlugCheck(slug, initialSlug);
  const slugRef = React.useRef<HTMLInputElement>(null);

  const slugStatus = slugState.kind === "result" ? slugState.result.status : null;
  const slugOk = slugStatus === "available" || slugStatus === "unknown";
  const slugBad = slugState.kind === "local" || (slugState.kind === "result" && !slugOk);
  const phoneOk = EGYPT_MOBILE.test(phone.replace(/[\s-]/g, ""));
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const busy = pending || googlePending;

  const onSlugChange = (raw: string) => {
    const next = slugify(raw);
    setSlug(next);
    if (next !== raw && hasArabic(raw)) setSlugState({ kind: "local", message: "arabic" });
  };

  /** Store link + phone, needed by both signup paths. */
  const storeChoiceValid = () => {
    if (!slug) setSlugState({ kind: "local", message: "required" });
    const ok = Boolean(slug) && slugOk && phoneOk;
    if (!ok) slugRef.current?.focus();
    return ok;
  };

  const handleResult = (result: SignupResult) => {
    if (result.status === "done") setStep({ kind: "done", subdomain: result.subdomain });
    else if (result.status === "confirm_email") setStep({ kind: "confirm", email: email.trim() });
    else if (result.status === "error") setFormError(result.error);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    setFormError(null);
    if (!storeChoiceValid() || !emailOk || password.length < 8) return;
    startTransition(async () => {
      handleResult(await signUpWithEmail({ subdomain: slug, phone, email: email.trim(), password }));
    });
  };

  const onGoogle = async () => {
    setTouched(true);
    setFormError(null);
    if (!storeChoiceValid()) return;
    setGooglePending(true);
    const result = await startGoogleSignup({ subdomain: slug, phone });
    if (result.status !== "ok") {
      setGooglePending(false);
      handleResult(result);
      return;
    }
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (error) {
      setGooglePending(false);
      setFormError("generic");
    }
  };

  if (step.kind === "done") {
    return (
      <div className="text-center">
        <span className="mx-auto mt-1 mb-[18px] grid size-16 place-items-center rounded-full bg-success-soft text-success">
          <Check className="size-[30px]" aria-hidden />
        </span>
        <DialogTitle className="text-2xl font-extrabold text-teal-900">{t("doneTitle")}</DialogTitle>
        <DialogDescription asChild>
          <span
            dir="ltr"
            className="mt-2.5 mb-[22px] inline-block max-w-full truncate rounded-[10px] bg-teal-50 px-3.5 py-2 font-latin text-[15px] font-bold text-teal-700"
          >
            {step.subdomain}.{ROOT_DOMAIN}
          </span>
        </DialogDescription>
        <div className="grid gap-2">
          <CtaButton asChild className="w-full rounded-xl">
            <a href={`${DASHBOARD_URL}products/add`}>{t("addProduct")}</a>
          </CtaButton>
          <CtaButton asChild tone="outline" className="w-full rounded-xl">
            <a href={`${DASHBOARD_URL}?welcome=1`}>{t("goDashboard")}</a>
          </CtaButton>
        </div>
      </div>
    );
  }

  if (step.kind === "confirm") {
    return (
      <div className="text-center">
        <span className="mx-auto mt-1 mb-[18px] grid size-16 place-items-center rounded-full bg-teal-50 text-teal-700">
          <MailCheck className="size-[30px]" aria-hidden />
        </span>
        <DialogTitle className="text-2xl font-extrabold text-teal-900">{t("confirmTitle")}</DialogTitle>
        <DialogDescription className="mt-2.5 text-sm text-neutral-600">
          {t.rich("confirmBody", { email: step.email, b: (c) => <b>{c}</b> })}
        </DialogDescription>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <DialogHeader className="mb-[22px] text-start">
        <DialogTitle className="text-2xl font-extrabold text-teal-900">{t("title")}</DialogTitle>
        <DialogDescription className="text-sm text-neutral-600">{t("subtitle")}</DialogDescription>
      </DialogHeader>

      <button
        type="button"
        onClick={onGoogle}
        disabled={busy}
        className="flex h-[50px] w-full items-center justify-center gap-2.5 rounded-xl border border-neutral-200 text-[15px] font-semibold hover:bg-neutral-50 disabled:opacity-60"
      >
        {googlePending ? (
          <Loader2 className="size-5 animate-spin" aria-hidden />
        ) : (
          <span aria-hidden className="relative size-5 rounded-full bg-[conic-gradient(#ea4335_0_25%,#fbbc05_0_50%,#34a853_0_75%,#4285f4_0)] after:absolute after:inset-1 after:rounded-full after:bg-white after:content-['']" />
        )}
        {t("google")}
      </button>
      <div className="my-[18px] flex items-center gap-3 text-[13px] text-neutral-500 before:h-px before:flex-1 before:bg-neutral-200 before:content-[''] after:h-px after:flex-1 after:bg-neutral-200 after:content-['']">
        {t("or")}
      </div>

      <FieldLabel htmlFor="signup-slug">{t("slugLabel")}</FieldLabel>
      <div dir="ltr" className={cn(inputBox, slugBad ? "border-destructive" : "border-neutral-200")}>
        <input
          ref={slugRef}
          id="signup-slug"
          value={slug}
          onChange={(e) => onSlugChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          autoFocus={!initialSlug}
          placeholder="yourbrand"
          aria-describedby="signup-slug-hint"
          aria-invalid={slugBad || undefined}
          className={cn(inputEl, "pe-1 font-latin font-semibold text-teal-900")}
        />
        <span className="pe-3.5 font-latin text-[15px] text-neutral-500">.{ROOT_DOMAIN}</span>
      </div>
      <SlugHint id="signup-slug-hint" state={slugState} host={`${slug}.${ROOT_DOMAIN}`} onPick={setSlug} />

      <FieldLabel htmlFor="signup-email" className="mt-3.5">
        {t("email")}
      </FieldLabel>
      <div className={cn(inputBox, touched && !emailOk ? "border-destructive" : "border-neutral-200")}>
        <input
          id="signup-email"
          type="email"
          dir="ltr"
          autoComplete="email"
          autoFocus={Boolean(initialSlug)}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={(touched && !emailOk) || undefined}
          className={inputEl}
        />
      </div>
      <Hint tone={touched && !emailOk ? "bad" : "muted"}>{touched && !emailOk ? t("errEmail") : null}</Hint>

      <FieldLabel htmlFor="signup-password" className="mt-1.5">
        {t("password")}
      </FieldLabel>
      <div className={cn(inputBox, touched && password.length < 8 ? "border-destructive" : "border-neutral-200")}>
        <input
          id="signup-password"
          type={showPassword ? "text" : "password"}
          dir="ltr"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby="signup-password-hint"
          aria-invalid={(touched && password.length < 8) || undefined}
          className={inputEl}
        />
        <button
          type="button"
          onClick={() => setShowPassword((s) => !s)}
          aria-label={showPassword ? t("hidePassword") : t("showPassword")}
          className="grid h-full w-11 place-items-center text-neutral-600"
        >
          {showPassword ? <EyeOff className="size-[18px]" aria-hidden /> : <Eye className="size-[18px]" aria-hidden />}
        </button>
      </div>
      <Hint id="signup-password-hint" tone={password.length >= 8 ? "ok" : touched ? "bad" : "muted"}>
        {password.length >= 8 ? t("passwordOk") : t("passwordHint")}
      </Hint>

      <FieldLabel htmlFor="signup-phone" className="mt-1.5">
        {t("phone")}
      </FieldLabel>
      <div className={cn(inputBox, touched && !phoneOk ? "border-destructive" : "border-neutral-200")}>
        <input
          id="signup-phone"
          type="tel"
          dir="ltr"
          inputMode="tel"
          autoComplete="tel"
          placeholder="01xxxxxxxxx"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          aria-describedby="signup-phone-hint"
          aria-invalid={(touched && !phoneOk) || undefined}
          className={cn(inputEl, "font-latin")}
        />
      </div>
      <Hint id="signup-phone-hint" tone={touched && !phoneOk ? "bad" : "muted"}>
        {touched && !phoneOk ? t("errors.phoneInvalid") : t("phoneHint")}
      </Hint>

      {formError ? (
        <p role="alert" className="mt-1 mb-2 flex items-start gap-1.5 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 flex-none" aria-hidden />
          <span>
            {t.rich(`errors.${formError}`, {
              login: (c) => (
                <a href={LOGIN_URL} className="font-semibold underline">
                  {c}
                </a>
              ),
            })}
          </span>
        </p>
      ) : null}

      <CtaButton type="submit" disabled={busy} className="mt-1.5 w-full rounded-xl">
        {pending ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            {t("creating")}
          </>
        ) : (
          t("submit")
        )}
      </CtaButton>
      <p className="mt-3.5 text-center text-xs text-neutral-600">
        {t.rich("terms", {
          terms: (chunks) => (
            <Link href="/terms" className="text-teal-700 underline-offset-2 hover:underline">
              {chunks}
            </Link>
          ),
          privacy: (chunks) => (
            <Link href="/privacy" className="text-teal-700 underline-offset-2 hover:underline">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </form>
  );
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return <Label className={cn("mb-1.5 text-sm font-semibold text-neutral-800", className)} {...props} />;
}

function Hint({ id, tone, children }: { id?: string; tone: "ok" | "bad" | "muted"; children: React.ReactNode }) {
  return (
    <p
      id={id}
      className={cn(
        "mt-1.5 flex min-h-5 items-center gap-1.5 text-[12.5px]",
        tone === "ok" ? "text-success" : tone === "bad" ? "text-destructive" : "text-neutral-600",
      )}
    >
      {tone === "ok" && children ? <CircleCheck className="size-3.5" aria-hidden /> : null}
      {tone === "bad" && children ? <CircleAlert className="size-3.5" aria-hidden /> : null}
      {children}
    </p>
  );
}

function SlugHint({ id, state, host, onPick }: { id: string; state: SlugState; host: string; onPick: (slug: string) => void }) {
  const t = useTranslations("signup");

  if (state.kind === "checking") {
    return (
      <p id={id} role="status" className="mt-1.5 flex min-h-5 items-center gap-1.5 text-[12.5px] text-neutral-600">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        {t("checking")}
      </p>
    );
  }
  if (state.kind === "local") {
    return (
      <Hint id={id} tone="bad">
        {t(state.message)}
      </Hint>
    );
  }
  if (state.kind === "result") {
    const { status, suggestions } = state.result;
    if (status === "available") {
      return (
        <Hint id={id} tone="ok">
          {t("available", { host })}
        </Hint>
      );
    }
    if (status === "unknown") {
      return (
        <Hint id={id} tone="muted">
          {t("slugHint")}
        </Hint>
      );
    }
    return (
      <div id={id} role="status" className="mt-1.5 flex min-h-5 flex-wrap items-center gap-1.5 text-[12.5px] text-destructive">
        <CircleAlert className="size-3.5" aria-hidden />
        <span>{t(status)}</span>
        {suggestions.length ? (
          <span className="flex flex-wrap items-center gap-1.5 text-neutral-600">
            {t("suggestions")}
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onPick(s)}
                className="rounded-full bg-teal-50 px-2 py-0.5 font-latin font-semibold text-teal-700 hover:bg-teal-100"
              >
                {s}
              </button>
            ))}
          </span>
        ) : null}
      </div>
    );
  }
  return (
    <Hint id={id} tone="muted">
      {t("slugHint")}
    </Hint>
  );
}
