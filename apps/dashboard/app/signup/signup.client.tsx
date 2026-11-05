"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  LogOut,
  MailCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";

import {
  Form,
  FormField,
  FormItem,
  FormMessage,
} from "@workspace/ui/components/form";

import { Note, SellerButton } from "@/components/seller-ui";
import { SubdomainField } from "@/components/stores/subdomain-field.client";
import { logout, resendConfirmation } from "@/actions/auth";
import { OTHER_INDUSTRY_ID, SIGNUP_INDUSTRIES } from "@/lib/stores/industries.lib";
import { cn } from "@/lib/utils";
import { createClient } from "@/supabase/client";
import { AuthField } from "../login/auth-field.client";
import { AuthLegal, AuthShell, AuthTabs } from "../login/auth-shell.client";
import {
  AUTH_DIVIDER,
  AUTH_LINK,
  AuthHeading,
  GOOGLE_BUTTON,
  OUTLINE_BUTTON,
  PRIMARY_BUTTON,
} from "../login/auth-ui";
import {
  checkSignupSubdomain,
  createStoreForCurrentUser,
  signUpWithEmail,
  startGoogleSignup,
} from "./signup.server";
import type { SignupErrorKey, SignupResult } from "./signup.dto";

const EGYPT_MOBILE = /^(?:\+20|0020|0)?1[0125]\d{8}$/;

type FormValues = {
  subdomain: string;
  industry: string;
  /** The seller's own words when the industry is "Other". */
  industryOther: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

/**
 * Two steps on one page. Signed out: step 1, the account (Google, or email +
 * password + confirmation). Signed in without a store: step 2, the store
 * (address, industry, phone).
 */
export function SignupForm({
  signedInEmail,
  initialError,
  initialSubdomain = "",
  afterSignup = null,
}: {
  /** Set when a user is already signed in (no seller row yet): step 2. */
  signedInEmail: string | null;
  initialError: SignupErrorKey | null;
  initialSubdomain?: string;
  /** Where to go once the store exists, when the seller came for it. */
  afterSignup?: string | null;
}) {
  const t = useTranslations("signup");
  const tAuth = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, setGooglePending] = useState(false);
  const [isSigningOut, setSigningOut] = useState(false);
  const [available, setAvailable] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);
  // Stays on the page beside the button, as well as the toast: some of these name no field.
  const [formError, setFormError] = useState<SignupErrorKey | null>(null);
  const signedIn = signedInEmail !== null;

  useEffect(() => {
    if (initialError) toast.error(t(`errors.${initialError}`));
  }, [initialError, t]);

  const schema = useMemo(
    () =>
      signedIn
        ? z
            .object({
              subdomain: z
                .string()
                .trim()
                .min(3, t("tooShort"))
                .max(32, t("tooLong")),
              industry: z.string().min(1, t("errors.industryRequired")),
              industryOther: z.string().max(60),
              phone: z
                .string()
                .refine(
                  (v) => EGYPT_MOBILE.test(v.replace(/[\s-]/g, "")),
                  t("errors.phoneInvalid"),
                ),
              email: z.string(),
              password: z.string(),
              confirmPassword: z.string(),
            })
            .refine(
              (v) =>
                v.industry !== OTHER_INDUSTRY_ID ||
                v.industryOther.trim().length >= 2,
              {
                path: ["industryOther"],
                message: t("errors.industryOtherRequired"),
              },
            )
        : z
            .object({
              subdomain: z.string(),
              industry: z.string(),
              industryOther: z.string(),
              phone: z.string(),
              email: z.email(t("errors.invalidEmail")),
              password: z
                .string()
                .min(8, t("errors.passwordTooShort"))
                .max(72, t("errors.passwordTooLong")),
              confirmPassword: z.string(),
            })
            .refine((v) => v.password === v.confirmPassword, {
              path: ["confirmPassword"],
              message: t("errors.passwordMismatch"),
            }),
    [signedIn, t],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      subdomain: initialSubdomain,
      industry: "",
      industryOther: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const industry = form.watch("industry");

  const handleResult = (result: SignupResult, email?: string) => {
    if (result.status === "done") {
      toast.success(
        t("created", { url: result.storeUrl.replace(/^https?:\/\//, "") }),
      );
      router.replace(`${afterSignup ?? "/"}?welcome=1${result.signup ? `&signup=${result.signup}` : ""}`);
      router.refresh();
    } else if (result.status === "account_created") {
      // Signed in now: the server page renders step 2.
      router.refresh();
    } else if (result.status === "confirm_email") {
      setConfirmEmail(email ?? "");
    } else if (result.status === "error") {
      if (result.error === "emailTaken")
        form.setError("email", { message: t("errors.emailTaken") });
      else if (result.error === "subdomainTaken")
        form.setError("subdomain", { message: t("errors.subdomainTaken") });
      else if (result.error === "phoneInvalid")
        form.setError("phone", { message: t("errors.phoneInvalid") });
      else if (result.error === "industryRequired")
        form.setError("industry", { message: t("errors.industryRequired") });
      else setFormError(result.error);
      toast.error(t(`errors.${result.error}`));
    }
  };

  const onSubmit = (values: FormValues) => {
    if (signedIn && !available) {
      form.setError("subdomain", { message: t("errors.invalidSubdomain") });
      return;
    }
    setFormError(null);
    startTransition(async () => {
      const result = signedIn
        ? await createStoreForCurrentUser({
            subdomain: values.subdomain,
            phone: values.phone,
            industry: values.industry,
            industryOther: values.industryOther,
          })
        : await signUpWithEmail({
            subdomain: initialSubdomain,
            email: values.email,
            password: values.password,
          }, afterSignup);
      handleResult(result, values.email);
    });
  };

  // One click: the store is set up after Google, in step 2.
  const onGoogle = async () => {
    setGooglePending(true);
    setFormError(null);
    const result = await startGoogleSignup(initialSubdomain);
    if (result.status !== "ok") {
      setGooglePending(false);
      handleResult(result);
      return;
    }
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${afterSignup ?? "/"}`,
      },
    });
    if (error) {
      setGooglePending(false);
      toast.error(t("errors.generic"));
    }
  };

  const busy = isPending || isGooglePending;

  // "Check your email": resend, at most once a minute (the server also rate limits).
  const [isResending, startResending] = useTransition();
  const [resendCooldown, setResendCooldown] = useState(0);
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const onResend = () => {
    if (!confirmEmail) return;
    startResending(async () => {
      const result = await resendConfirmation(confirmEmail);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(tAuth("resendSent", { email: confirmEmail }));
      setResendCooldown(60);
    });
  };

  if (confirmEmail !== null) {
    return (
      <AuthShell>
        <span className="mx-auto grid size-[60px] place-items-center rounded-full bg-success-soft text-success">
          <MailCheck className="size-7" />
        </span>
        <AuthHeading
          center
          title={t("confirmTitle")}
          subtitle={t("confirmDescription", { email: confirmEmail })}
        />
        <Note>{t("confirmSpamHint")}</Note>
        <div className="flex flex-col gap-3">
          <SellerButton
            className={PRIMARY_BUTTON}
            onClick={onResend}
            disabled={isResending || resendCooldown > 0}
          >
            {isResending && <Loader2 className="size-[18px] animate-spin" />}
            {resendCooldown > 0
              ? t("resendIn", { seconds: resendCooldown })
              : t("resend")}
          </SellerButton>
          <SellerButton
            variant="outline"
            className={OUTLINE_BUTTON}
            onClick={() => setConfirmEmail(null)}
          >
            {t("useDifferentEmail")}
          </SellerButton>
          <Link
            href="/login"
            className={`${AUTH_LINK} grid min-h-10 place-items-center text-[13.5px]`}
          >
            {t("signIn")}
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthHeading
        eyebrow={t("stepOf", { step: signedIn ? 2 : 1, total: 2 })}
        title={signedIn ? t("setupTitle") : t("title")}
        subtitle={signedIn ? t("setupSubtitle") : t("subtitle")}
      />
      {signedIn ? (
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-[14px] border border-(--s-line) bg-(--s-tint) px-3.5 py-1 text-[13px] text-(--s-muted)">
          <UserRound className="size-4 shrink-0" />
          {/* A long address wraps rather than hiding its start; it gets its own direction inside Arabic text. */}
          <span className="min-w-0 flex-[1_1_70%] [overflow-wrap:anywhere]">
            {t.rich("signedInAs", {
              email: signedInEmail,
              b: (chunks) => (
                <bdi dir="ltr" className="font-semibold text-(--s-text)">
                  {chunks}
                </bdi>
              ),
            })}
          </span>
          <button
            type="button"
            className={`${AUTH_LINK} ms-auto inline-flex min-h-10 shrink-0 items-center gap-1.5 disabled:opacity-50`}
            onClick={() => {
              setSigningOut(true);
              void logout();
            }}
            disabled={busy || isSigningOut}
          >
            {isSigningOut ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4 rtl:rotate-180" />
            )}
            {t("signOut")}
          </button>
        </div>
      ) : (
        <>
          <AuthTabs active="signup" />
          <SellerButton
            variant="outline"
            className={GOOGLE_BUTTON}
            onClick={onGoogle}
            disabled={busy}
          >
            {isGooglePending ? (
              <Loader2 className="size-[18px] animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {t("continueWithGoogle")}
          </SellerButton>
          <div className={AUTH_DIVIDER}>{t("orWithEmail")}</div>
        </>
      )}

      <Form {...form}>
        <form
          method="post"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-3.5"
          noValidate
        >
          {signedIn ? (
            <div className="flex flex-col gap-3.5 [&_button[dir=ltr]]:min-h-10 [&_button[dir=ltr]]:px-3.5">
              <SubdomainField
                form={form}
                name="subdomain"
                check={checkSignupSubdomain}
                onAvailabilityChange={setAvailable}
                disabled={busy}
                autoFocus
                className="h-[50px] rounded-[14px] border-[1.5px] border-(--s-field) bg-(--s-surface) shadow-none focus-within:border-(--s-primary) focus-within:shadow-[0_0_0_4px_var(--s-focus-soft)] focus-within:ring-0 aria-invalid:border-destructive max-[480px]:h-[52px]"
                inputClassName="px-3.5 text-[15px] text-(--s-text) placeholder:text-(--s-placeholder) md:text-[15px]"
                labelClassName="text-[13px] font-bold text-(--s-text)"
              />
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <p
                      className="text-[13px] font-bold text-(--s-text)"
                      id="signup-industry"
                    >
                      {t("industry")}
                    </p>
                    <div
                      className="flex flex-wrap gap-2"
                      role="radiogroup"
                      aria-labelledby="signup-industry"
                    >
                      {[
                        ...SIGNUP_INDUSTRIES.map((option) => ({
                          id: option.id,
                          label: locale === "en" ? option.en : option.ar,
                        })),
                        { id: OTHER_INDUSTRY_ID, label: t("industryOther") },
                      ].map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          role="radio"
                          aria-checked={field.value === option.id}
                          disabled={busy}
                          onClick={() =>
                            form.setValue("industry", option.id, {
                              shouldValidate: true,
                            })
                          }
                          className={cn(
                            "inline-flex h-9 cursor-pointer items-center rounded-full border border-(--s-field) bg-(--s-surface) px-3.5 text-[13px] font-semibold text-(--s-muted) transition-colors duration-150 hover:border-(--tallaby-teal-300) disabled:opacity-50 max-[600px]:h-10",
                            field.value === option.id &&
                              "border-(--s-solid) bg-(--s-solid) text-(--s-solid-fg)",
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {industry === OTHER_INDUSTRY_ID && (
                <AuthField
                  form={form}
                  name="industryOther"
                  type="text"
                  label={t("industryOtherLabel")}
                  placeholder={t("industryOtherPlaceholder")}
                  disabled={busy}
                  autoFocus
                />
              )}
              <AuthField
                form={form}
                name="phone"
                type="tel"
                label={t("phone")}
                placeholder={t("phonePlaceholder")}
                description={t("phoneHint")}
                autoComplete="tel"
                disabled={busy}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <AuthField
                form={form}
                name="email"
                type="email"
                label={t("email")}
                placeholder={t("emailPlaceholder")}
                autoComplete="email"
                disabled={busy}
              />
              <AuthField
                form={form}
                name="password"
                type="password"
                label={t("password")}
                placeholder={t("passwordPlaceholder")}
                autoComplete="new-password"
                disabled={busy}
                meter
              />
              <AuthField
                form={form}
                name="confirmPassword"
                type="password"
                label={t("confirmPassword")}
                placeholder={t("confirmPasswordPlaceholder")}
                autoComplete="new-password"
                disabled={busy}
              />
            </div>
          )}
          {formError && (
            <div role="alert">
              <Note tone="danger" icon={AlertCircle}>
                {t(`errors.${formError}`)}
              </Note>
            </div>
          )}
          <SellerButton type="submit" className={PRIMARY_BUTTON} disabled={busy}>
            {isPending && <Loader2 className="size-[18px] animate-spin" />}
            {signedIn ? t("submit") : t("createAccount")}
            {!isPending && (
              <ArrowRight className="size-[18px] rtl:rotate-180" />
            )}
          </SellerButton>
        </form>
      </Form>

      {!signedIn && (
        <>
          <p className="text-center text-[13.5px] text-(--s-muted)">
            {t("haveAccount")}{" "}
            <Link href="/login" className={`${AUTH_LINK} inline-flex min-h-10 items-center`}>
              {t("signIn")}
            </Link>
          </p>
          <AuthLegal />
        </>
      )}
    </AuthShell>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M47.532 24.553c0-1.632-.132-3.272-.415-4.877H24.48v9.242h12.963a11.11 11.11 0 0 1-4.797 7.293v5.997h7.734c4.542-4.18 7.152-10.353 7.152-17.655Z"
        fill="#4285F4"
      />
      <path
        d="M24.48 48.002c6.473 0 11.932-2.126 15.909-5.794l-7.734-5.997c-2.152 1.464-4.93 2.293-8.166 2.293-6.261 0-11.57-4.224-13.475-9.903H3.033v6.182A23.999 23.999 0 0 0 24.48 48.002Z"
        fill="#34A853"
      />
      <path
        d="M11.005 28.6a14.373 14.373 0 0 1 0-9.189v-6.181H3.033a24.019 24.019 0 0 0 0 21.552L11.005 28.6Z"
        fill="#FBBC04"
      />
      <path
        d="M24.48 9.5a13.04 13.04 0 0 1 9.207 3.597l6.852-6.852A23.065 23.065 0 0 0 24.48.002 23.999 23.999 0 0 0 3.033 13.23l7.972 6.181C12.901 13.724 18.219 9.5 24.48 9.5Z"
        fill="#EA4335"
      />
    </svg>
  );
}
