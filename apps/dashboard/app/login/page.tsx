"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@workspace/ui/components/button";
import { Form } from "@workspace/ui/components/form";

import { login, resetPassword } from "@/actions/auth";
import {
  createSignInSchema,
  createResetPasswordSchema,
  type SignInFormData,
  type ResetPasswordFormData,
} from "@/lib/validations/vendor-schemas";
import { OAuth } from "@/components/auth/o-auth";
import { AuthShell, AuthTabs } from "./auth-shell.client";
import { AuthField } from "./auth-field.client";

const PRIMARY_BUTTON =
  "h-[50px] w-full rounded-full bg-accent text-[15px] font-semibold text-[#171717] hover:bg-[#e89318]";

export default function AuthPage() {
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
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
    startTransition(async () => {
      try {
        await login(data.email, data.password);
        toast.success(tToast("redirectingToDashboard"));
        router.push("/");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : tToast("failedToSignIn")
        );
      }
    });
  };

  const handleResetPassword = (data: ResetPasswordFormData) => {
    startTransition(async () => {
      try {
        await resetPassword(data.resetEmail);
        setResetSuccess(true);
        toast.success(tToast("passwordResetLinkSent"));
        resetForm.reset();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : tToast("failedToSendResetEmail")
        );
      }
    });
  };

  if (showResetForm) {
    return (
      <AuthShell>
        <AuthHeading
          eyebrow={t("title")}
          title={resetSuccess ? t("checkEmailTitle") : t("resetPasswordTitle")}
          subtitle={
            resetSuccess
              ? t("checkEmailDescription")
              : t("resetPasswordDescription")
          }
        />
        {resetSuccess ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 rounded-xl bg-primary-soft p-4 text-sm text-foreground">
              <MailCheck className="mt-0.5 size-5 shrink-0 text-primary" />
              <p>{t("didntReceiveEmail")}</p>
            </div>
            <Button
              type="button"
              className={PRIMARY_BUTTON}
              onClick={() => {
                setResetSuccess(false);
                setShowResetForm(false);
              }}
            >
              <ArrowLeft className="size-[18px] rtl:rotate-180" />
              {t("backToSignIn")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-[50px] w-full rounded-full text-[15px] font-semibold"
              onClick={() => setResetSuccess(false)}
            >
              {t("tryAnotherEmail")}
            </Button>
          </div>
        ) : (
          <Form {...resetForm}>
            <form
              onSubmit={resetForm.handleSubmit(handleResetPassword)}
              className="flex flex-col gap-[22px]"
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
              <Button type="submit" className={PRIMARY_BUTTON} disabled={isPending}>
                {isPending && <Loader2 className="size-[18px] animate-spin" />}
                {t("sendResetLink")}
              </Button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                onClick={() => setShowResetForm(false)}
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
        eyebrow={t("title")}
        title={t("welcomeBack")}
        subtitle={t("signInSubtitle")}
      />
      <AuthTabs active="signin" />
      <OAuth next={"/"} />
      <div className="flex items-center gap-3.5 text-[13px] text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
        {t("orWithEmail")}
      </div>

      <Form {...signInForm}>
        <form
          onSubmit={signInForm.handleSubmit(handleSignIn)}
          className="flex flex-col gap-[22px]"
          noValidate
        >
          <div className="flex flex-col gap-4">
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
                  className="text-[13px] font-semibold text-primary hover:underline"
                  onClick={() => setShowResetForm(true)}
                  disabled={isPending}
                >
                  {t("forgotPassword")}
                </button>
              }
            />
          </div>
          <Button type="submit" className={PRIMARY_BUTTON} disabled={isPending}>
            {isPending && <Loader2 className="size-[18px] animate-spin" />}
            {t("signIn")}
            {!isPending && <ArrowRight className="size-[18px] rtl:rotate-180" />}
          </Button>
        </form>
      </Form>

      <p className="m-0 text-center text-sm text-muted-foreground">
        {t("newToTallaby")}{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          {t("createSellerAccount")}
        </Link>
      </p>
      <p className="m-0 text-[12.5px] leading-relaxed text-muted-foreground">
        {t.rich("legal", {
          terms: (chunks) => <span className="font-semibold text-primary">{chunks}</span>,
          privacy: (chunks) => <span className="font-semibold text-primary">{chunks}</span>,
        })}
      </p>
    </AuthShell>
  );
}

function AuthHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <div className="text-[12.5px] font-semibold tracking-[0.08em] text-[#2c6e80] uppercase rtl:tracking-normal">
        {eyebrow}
      </div>
      <h1 className="mt-1.5 mb-2 text-[26px] leading-tight font-bold tracking-[-0.01em] text-foreground rtl:tracking-normal lg:text-[32px]">
        {title}
      </h1>
      <p className="m-0 text-[15px] leading-relaxed text-pretty text-muted-foreground">
        {subtitle}
      </p>
    </div>
  );
}
