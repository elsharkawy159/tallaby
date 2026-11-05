"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Form } from "@workspace/ui/components/form";

import { login, resendConfirmation, resetPassword } from "@/actions/auth";
import {
  createSignInSchema,
  createResetPasswordSchema,
  type SignInFormData,
  type ResetPasswordFormData,
} from "@/lib/validations/vendor-schemas";
import { OAuth } from "@/components/auth/o-auth";
import { Note, SellerButton } from "@/components/seller-ui";
import { AuthLegal, AuthShell, AuthTabs } from "./auth-shell.client";
import { AuthField } from "./auth-field.client";
import { AUTH_DIVIDER, AUTH_LINK, AuthHeading, OUTLINE_BUTTON, PRIMARY_BUTTON } from "./auth-ui";
import { safeNextPath } from "@/lib/auth/safe-next.lib";

export default function AuthPage() {
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Email of an account that tried to sign in before confirming: offers "Resend confirmation".
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [isResending, startResending] = useTransition();
  // The server's answer stays on the page, beside the button that asked (a toast would be gone by the time it's read).
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  // Where to go after signing in (e.g. back to the public /roadmap); same-site paths only.
  const next = safeNextPath(searchParams.get("next"));
  const tToast = useTranslations("toast");
  const t = useTranslations("auth");
  const tValidation = useTranslations("validation");
  const signInSchema = useMemo(() => createSignInSchema(tValidation), [tValidation]);
  const resetPasswordSchema = useMemo(
    () => createResetPasswordSchema(tValidation),
    [tValidation]
  );

  // Check if user returned from password reset email
  useEffect(() => {
    const resetParam = searchParams.get("reset");
    if (resetParam === "true") {
      toast.success(tToast("passwordResetSuccessful"));
    }
  }, [searchParams, tToast]);

  // Sign In Form
  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Reset Password Form
  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      resetEmail: "",
    },
  });

  const handleSignIn = (data: SignInFormData) => {
    setFormError(null);
    startTransition(async () => {
      const result = await login(data.email, data.password);
      if (result.error) {
        const unconfirmed = result.code === "emailNotConfirmed";
        setUnconfirmedEmail(unconfirmed ? data.email : null);
        // The unconfirmed box below already says it, and offers the resend.
        setFormError(unconfirmed ? null : result.error);
        return;
      }
      setUnconfirmedEmail(null);
      toast.success(tToast("redirectingToDashboard"));
      router.push(next);
    });
  };

  const handleResend = () => {
    if (!unconfirmedEmail) return;
    startResending(async () => {
      const result = await resendConfirmation(unconfirmedEmail);
      if (result.error) toast.error(result.error);
      else toast.success(t("resendSent", { email: unconfirmedEmail }));
    });
  };

  const handleResetPassword = (data: ResetPasswordFormData) => {
    setFormError(null);
    startTransition(async () => {
      const result = await resetPassword(data.resetEmail);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      setResetSuccess(true);
      toast.success(tToast("passwordResetLinkSent"));
      resetForm.reset();
    });
  };

  if (showResetForm) {
    return (
      <AuthShell>
        {resetSuccess && (
          <span className="mx-auto grid size-[60px] place-items-center rounded-full bg-success-soft text-success">
            <MailCheck className="size-7" />
          </span>
        )}
        <AuthHeading
          center={resetSuccess}
          title={resetSuccess ? t("checkEmailTitle") : t("resetPasswordTitle")}
          subtitle={
            resetSuccess
              ? t("checkEmailDescription")
              : t("resetPasswordDescription")
          }
        />
        {resetSuccess ? (
          <div className="flex flex-col gap-3">
            <Note>{t("didntReceiveEmail")}</Note>
            <SellerButton
              className={PRIMARY_BUTTON}
              onClick={() => {
                setResetSuccess(false);
                setShowResetForm(false);
              }}
            >
              <ArrowLeft className="size-[18px] rtl:rotate-180" />
              {t("backToSignIn")}
            </SellerButton>
            <SellerButton
              variant="outline"
              className={OUTLINE_BUTTON}
              onClick={() => setResetSuccess(false)}
            >
              {t("tryAnotherEmail")}
            </SellerButton>
          </div>
        ) : (
          <Form {...resetForm}>
            <form
              onSubmit={resetForm.handleSubmit(handleResetPassword)}
              className="flex flex-col gap-3.5"
              noValidate
            >
              <AuthField
                form={resetForm}
                name="resetEmail"
                label={t("email")}
                type="email"
                placeholder={t("emailPlaceholder")}
                autoComplete="email"
                disabled={isPending}
              />
              {formError && (
                <div role="alert">
                  <Note tone="danger" icon={AlertCircle}>
                    {formError}
                  </Note>
                </div>
              )}
              <SellerButton type="submit" className={PRIMARY_BUTTON} disabled={isPending}>
                {isPending && <Loader2 className="size-[18px] animate-spin" />}
                {t("sendResetLink")}
              </SellerButton>
              <button
                type="button"
                className={`${AUTH_LINK} inline-flex min-h-10 items-center justify-center gap-1.5 text-[13.5px]`}
                onClick={() => {
                  setFormError(null);
                  setShowResetForm(false);
                }}
                disabled={isPending}
              >
                <ArrowLeft className="size-4 rtl:rotate-180" />
                {t("backToSignIn")}
              </button>
            </form>
          </Form>
        )}
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthHeading
        title={t("welcomeBack")}
        subtitle={t("signInSubtitle")}
      />
      <AuthTabs active="signin" />
      {/* OAuth is shared: only its shape changes here, to the design's field-like box. */}
      <div className="[&_button]:rounded-[14px] [&_button]:border-(--s-field) [&_button]:text-(--s-text)">
        <OAuth next={next} />
      </div>
      <div className={AUTH_DIVIDER}>{t("orWithEmail")}</div>

      <Form {...signInForm}>
        <form
          onSubmit={signInForm.handleSubmit(handleSignIn)}
          className="flex flex-col gap-3.5"
          noValidate
        >
          <div className="flex flex-col gap-3.5">
            <AuthField
              form={signInForm}
              name="email"
              label={t("email")}
              type="email"
              placeholder={t("emailPlaceholder")}
              autoComplete="email"
              disabled={isPending}
            />
            <AuthField
              form={signInForm}
              name="password"
              label={t("password")}
              type="password"
              placeholder={t("passwordPlaceholder")}
              autoComplete="current-password"
              disabled={isPending}
              labelAction={
                <button
                  type="button"
                  className={`${AUTH_LINK} -my-2 inline-flex min-h-10 items-center text-[12.5px]`}
                  onClick={() => {
                    setFormError(null);
                    setShowResetForm(true);
                  }}
                  disabled={isPending}
                >
                  {t("forgotPassword")}
                </button>
              }
            />
          </div>
          {formError && (
            <div role="alert">
              <Note tone="danger" icon={AlertCircle}>
                {formError}
              </Note>
            </div>
          )}
          <SellerButton type="submit" className={PRIMARY_BUTTON} disabled={isPending}>
            {isPending && <Loader2 className="size-[18px] animate-spin" />}
            {t("signIn")}
            {!isPending && <ArrowRight className="size-[18px] rtl:rotate-180" />}
          </SellerButton>
          {unconfirmedEmail && (
            <div role="alert" className="flex flex-col gap-3 rounded-[14px] bg-accent-soft p-3.5 text-[13px] text-accent-ink">
              <p>{t("unconfirmedHint", { email: unconfirmedEmail })}</p>
              <SellerButton
                variant="outline"
                className={OUTLINE_BUTTON}
                onClick={handleResend}
                disabled={isResending}
              >
                {isResending ? <Loader2 className="size-[18px] animate-spin" /> : <MailCheck className="size-[18px]" />}
                {t("resendConfirmation")}
              </SellerButton>
            </div>
          )}
        </form>
      </Form>

      <p className="text-center text-[13.5px] text-(--s-muted)">
        {t("newToTallaby")}{" "}
        <Link href="/signup" className={`${AUTH_LINK} inline-flex min-h-10 items-center`}>
          {t("createSellerAccount")}
        </Link>
      </p>
      <AuthLegal />
    </AuthShell>
  );
}
