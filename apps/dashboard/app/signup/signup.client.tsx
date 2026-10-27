"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
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

import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormField,
  FormItem,
  FormMessage,
} from "@workspace/ui/components/form";

import { SubdomainField } from "@/components/stores/subdomain-field.client";
import { logout, resendConfirmation } from "@/actions/auth";
import { OTHER_INDUSTRY_ID, SIGNUP_INDUSTRIES } from "@/lib/stores/industries.lib";
import { cn } from "@/lib/utils";
import { createClient } from "@/supabase/client";
import { AuthField } from "../login/auth-field.client";
import { AuthShell, AuthTabs } from "../login/auth-shell.client";
import {
  AUTH_INPUT_BOX,
  AuthHeading,
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
}: {
  /** Set when a user is already signed in (no seller row yet): step 2. */
  signedInEmail: string | null;
  initialError: SignupErrorKey | null;
  initialSubdomain?: string;
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
      router.replace("/?welcome=1");
      router.refresh();
    } else if (result.status === "account_created") {
      // Signed in now: the server page renders step 2.
      router.refresh();
    } else if (result.status === "confirm_email") {
      setConfirmEmail(email ?? "");
    } else if (result.status === "error") {
      if (result.error === "emailTaken")
        form.setError("email", { message: t("errors.emailTaken") });
      if (result.error === "subdomainTaken")
        form.setError("subdomain", { message: t("errors.subdomainTaken") });
      if (result.error === "phoneInvalid")
        form.setError("phone", { message: t("errors.phoneInvalid") });
      if (result.error === "industryRequired")
        form.setError("industry", { message: t("errors.industryRequired") });
      toast.error(t(`errors.${result.error}`));
    }
  };

  const onSubmit = (values: FormValues) => {
    if (signedIn && !available) {
      form.setError("subdomain", { message: t("errors.invalidSubdomain") });
      return;
    }
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
          });
      handleResult(result, values.email);
    });
  };

  // One click: the store is set up after Google, in step 2.
  const onGoogle = async () => {
    setGooglePending(true);
    const result = await startGoogleSignup(initialSubdomain);
    if (result.status !== "ok") {
      setGooglePending(false);
      handleResult(result);
      return;
    }
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/`,
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
        <div className="grid size-12 place-items-center rounded-full bg-primary-soft">
          <MailCheck className="size-6 text-primary" />
        </div>
        <AuthHeading
          eyebrow={tAuth("title")}
          title={t("confirmTitle")}
          subtitle={t("confirmDescription", { email: confirmEmail })}
        />
        <p className="m-0 text-sm text-muted-foreground">
          {t("confirmSpamHint")}
        </p>
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            className={PRIMARY_BUTTON}
            onClick={onResend}
            disabled={isResending || resendCooldown > 0}
          >
            {isResending && <Loader2 className="size-[18px] animate-spin" />}
            {resendCooldown > 0
              ? t("resendIn", { seconds: resendCooldown })
              : t("resend")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className={OUTLINE_BUTTON}
            onClick={() => setConfirmEmail(null)}
          >
            {t("useDifferentEmail")}
          </Button>
          <Link
            href="/login"
            className="text-center text-sm font-semibold text-primary hover:underline"
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
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 rounded-xl bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
          <UserRound className="size-4 shrink-0" />
          {/* The whole email on one line: the LTR address inside Arabic text gets its own direction. */}
          <span className="min-w-0 overflow-x-auto whitespace-nowrap">
            {t.rich("signedInAs", {
              email: signedInEmail,
              b: (chunks) => (
                <bdi dir="ltr" className="font-semibold text-foreground">
                  {chunks}
                </bdi>
              ),
            })}
          </span>
          <button
            type="button"
            className="ms-auto inline-flex shrink-0 items-center gap-1.5 font-semibold text-primary hover:underline disabled:opacity-50"
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
          <Button
            type="button"
            variant="outline"
            className="h-[50px] w-full gap-2 rounded-full border-input bg-white text-[15px] font-semibold text-foreground hover:bg-muted dark:bg-card"
            onClick={onGoogle}
            disabled={busy}
          >
            {isGooglePending ? (
              <Loader2 className="size-[18px] animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {t("continueWithGoogle")}
          </Button>
          <div className="flex items-center gap-3.5 text-[13px] text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
            {t("orWithEmail")}
          </div>
        </>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-[22px]"
          noValidate
        >
          {signedIn ? (
            <div className="flex flex-col gap-4">
              <SubdomainField
                form={form}
                name="subdomain"
                check={checkSignupSubdomain}
                onAvailabilityChange={setAvailable}
                disabled={busy}
                autoFocus
                className={AUTH_INPUT_BOX}
                inputClassName="px-3.5 text-[15px] md:text-[15px]"
                labelClassName="text-sm font-semibold text-foreground"
              />
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <p
                      className="m-0 text-sm font-semibold text-foreground"
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
                            "rounded-full border px-3 py-1.5 text-[13px] transition-colors disabled:opacity-50",
                            field.value === option.id
                              ? "border-primary bg-primary/5 font-semibold text-primary"
                              : "border-input hover:border-primary/40",
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
          <Button type="submit" className={PRIMARY_BUTTON} disabled={busy}>
            {isPending && <Loader2 className="size-[18px] animate-spin" />}
            {signedIn ? t("submit") : t("createAccount")}
            {!isPending && (
              <ArrowRight className="size-[18px] rtl:rotate-180" />
            )}
          </Button>
        </form>
      </Form>

      {!signedIn && (
        <>
          <p className="m-0 text-center text-sm text-muted-foreground">
            {t("haveAccount")}{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              {t("signIn")}
            </Link>
          </p>
          <p className="m-0 text-[12.5px] leading-relaxed text-muted-foreground">
            {tAuth.rich("legal", {
              terms: (chunks) => (
                <span className="font-semibold text-primary">{chunks}</span>
              ),
              privacy: (chunks) => (
                <span className="font-semibold text-primary">{chunks}</span>
              ),
            })}
          </p>
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
