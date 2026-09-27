"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Form } from "@workspace/ui/components/form";
import { Separator } from "@workspace/ui/components/separator";
import { TextInput } from "@workspace/ui/components/inputs/text-input";

import { login, resetPassword } from "@/actions/auth";
import {
  createSignInSchema,
  createResetPasswordSchema,
  type SignInFormData,
  type ResetPasswordFormData,
} from "@/lib/validations/vendor-schemas";
import { OAuth } from "@/components/auth/o-auth";

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
      <div className="relative min-h-screen flex items-center justify-center from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Image
          src="https://images.unsplash.com/photo-1496917756835-20cb06e75b4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1908&q=80"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover -z-10"
        />
        <div className="absolute inset-0 w-full h-full z-[-1] bg-gradient-to-b from-black/30 to-black from-70%" />
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {resetSuccess ? t("checkEmailTitle") : t("resetPasswordTitle")}
            </CardTitle>
            <CardDescription className="text-center">
              {resetSuccess
                ? t("checkEmailDescription")
                : t("resetPasswordDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resetSuccess ? (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("didntReceiveEmail")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setResetSuccess(false);
                      setShowResetForm(false);
                    }}
                  >
                    {t("backToSignIn")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setResetSuccess(false)}
                  >
                    {t("tryAnotherEmail")}
                  </Button>
                </div>
              </div>
            ) : (
              <Form {...resetForm}>
                <form
                  onSubmit={resetForm.handleSubmit(handleResetPassword)}
                  className="space-y-4"
                >
                  <TextInput
                    form={resetForm}
                    name="resetEmail"
                    label={t("email")}
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    disabled={isPending}
                    required
                  />
                  <div className="space-y-2">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isPending}
                    >
                      {isPending && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {t("sendResetLink")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowResetForm(false)}
                      disabled={isPending}
                    >
                      <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                      {t("backToSignIn")}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Image
        src="https://images.unsplash.com/photo-1496917756835-20cb06e75b4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1908&q=80"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover -z-10"
      />
      <div className="absolute inset-0 w-full h-full z-[-1] bg-gradient-to-b from-black/30 to-black from-70%" />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {t("title")}
          </CardTitle>
          <CardDescription className="text-center">
            {t("subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...signInForm}>
            <form
              onSubmit={signInForm.handleSubmit(handleSignIn)}
              className="space-y-4"
            >
              <TextInput
                form={signInForm}
                name="email"
                label={t("email")}
                type="email"
                placeholder={t("emailPlaceholder")}
                disabled={isPending}
                required
              />
              <TextInput
                form={signInForm}
                name="password"
                label={t("password")}
                type="password"
                placeholder={t("passwordPlaceholder")}
                disabled={isPending}
                required
              />
              <div className="space-y-2">
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {t("signIn")}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-sm"
                  onClick={() => setShowResetForm(true)}
                  disabled={isPending}
                >
                  {t("forgotPassword")}
                </Button>
              </div>
              <OAuth next={"/"} />
            </form>
          </Form>

          <Separator className="my-4" />

          <div className="text-center text-sm text-muted-foreground">
            {t.rich("legal", {
              terms: (chunks) => (
                <Button variant="link" className="p-0 h-auto font-normal text-sm">
                  {chunks}
                </Button>
              ),
              privacy: (chunks) => (
                <Button variant="link" className="p-0 h-auto font-normal text-sm">
                  {chunks}
                </Button>
              ),
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
