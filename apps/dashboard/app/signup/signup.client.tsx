"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Form } from "@workspace/ui/components/form";
import { Separator } from "@workspace/ui/components/separator";
import { TextInput } from "@workspace/ui/components/inputs/text-input";

import { SubdomainField } from "@/components/stores/subdomain-field.client";
import { createClient } from "@/supabase/client";
import {
  checkSignupSubdomain,
  createStoreForCurrentUser,
  signUpWithEmail,
  startGoogleSignup,
} from "./signup.server";
import type { SignupErrorKey, SignupResult } from "./signup.dto";

const BACKGROUND =
  "https://images.unsplash.com/photo-1496917756835-20cb06e75b4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1908&q=80";
const EGYPT_MOBILE = /^(?:\+20|0020|0)?1[0125]\d{8}$/;

type FormValues = { subdomain: string; phone: string; email: string; password: string };

export function SignupForm({
  signedInEmail,
  initialError,
  initialSubdomain = "",
}: {
  /** Set when a user is already signed in (no seller row yet): the account step is skipped. */
  signedInEmail: string | null;
  initialError: SignupErrorKey | null;
  initialSubdomain?: string;
}) {
  const t = useTranslations("signup");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, setGooglePending] = useState(false);
  const [available, setAvailable] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);
  const signedIn = signedInEmail !== null;

  useEffect(() => {
    if (initialError) toast.error(t(`errors.${initialError}`));
  }, [initialError, t]);

  const schema = useMemo(
    () =>
      z.object({
        subdomain: z.string().trim().min(3, t("tooShort")).max(32, t("tooLong")),
        phone: z
          .string()
          .refine((v) => EGYPT_MOBILE.test(v.replace(/[\s-]/g, "")), t("errors.phoneInvalid")),
        email: signedIn ? z.string() : z.email(t("errors.invalidEmail")),
        password: signedIn
          ? z.string()
          : z.string().min(8, t("errors.passwordTooShort")).max(72, t("errors.passwordTooLong")),
      }),
    [signedIn, t],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { subdomain: initialSubdomain, phone: "", email: "", password: "" },
  });

  const handleResult = (result: SignupResult, email?: string) => {
    if (result.status === "done") {
      toast.success(t("created", { url: result.storeUrl.replace(/^https?:\/\//, "") }));
      router.replace("/?welcome=1");
      router.refresh();
    } else if (result.status === "confirm_email") {
      setConfirmEmail(email ?? "");
    } else if (result.status === "error") {
      if (result.error === "emailTaken") form.setError("email", { message: t("errors.emailTaken") });
      if (result.error === "subdomainTaken") form.setError("subdomain", { message: t("errors.subdomainTaken") });
      if (result.error === "phoneInvalid") form.setError("phone", { message: t("errors.phoneInvalid") });
      toast.error(t(`errors.${result.error}`));
    }
  };

  const onSubmit = (values: FormValues) => {
    if (!available) {
      form.setError("subdomain", { message: t("errors.invalidSubdomain") });
      return;
    }
    startTransition(async () => {
      const choice = { subdomain: values.subdomain, phone: values.phone };
      const result = signedIn
        ? await createStoreForCurrentUser(choice)
        : await signUpWithEmail({ ...choice, email: values.email, password: values.password });
      handleResult(result, values.email);
    });
  };

  const onGoogle = async () => {
    const valid = await form.trigger(["subdomain", "phone"]);
    if (!valid || !available) {
      if (!available) form.setError("subdomain", { message: t("errors.invalidSubdomain") });
      return;
    }
    setGooglePending(true);
    const { subdomain, phone } = form.getValues();
    const result = await startGoogleSignup({ subdomain, phone });
    if (result.status !== "ok") {
      setGooglePending(false);
      handleResult(result);
      return;
    }
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=/` },
    });
    if (error) {
      setGooglePending(false);
      toast.error(t("errors.generic"));
    }
  };

  const busy = isPending || isGooglePending;

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <Image src={BACKGROUND} alt="" fill priority sizes="100vw" className="-z-10 object-cover" />
      <div className="absolute inset-0 z-[-1] h-full w-full bg-gradient-to-b from-black/30 from-70% to-black" />
      <Card className="w-full max-w-md">
        {confirmEmail !== null ? (
          <>
            <CardHeader className="space-y-3 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                <MailCheck className="size-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle className="text-2xl font-bold">{t("confirmTitle")}</CardTitle>
              <CardDescription>{t("confirmDescription", { email: confirmEmail })}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">{t("signIn")}</Link>
              </Button>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-center text-2xl font-bold">{t("title")}</CardTitle>
              <CardDescription className="text-center">
                {signedIn ? t("signedInAs", { email: signedInEmail }) : t("subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  <SubdomainField
                    form={form}
                    name="subdomain"
                    check={checkSignupSubdomain}
                    onAvailabilityChange={setAvailable}
                    disabled={busy}
                    autoFocus
                  />
                  <div className="space-y-1">
                    <TextInput
                      form={form}
                      name="phone"
                      type="tel"
                      label={t("phone")}
                      placeholder={t("phonePlaceholder")}
                      description={t("phoneHint")}
                      disabled={busy}
                      className="text-start [direction:ltr]"
                      required
                    />
                  </div>
                  {!signedIn && (
                    <>
                      <TextInput
                        form={form}
                        name="email"
                        type="email"
                        label={t("email")}
                        placeholder={t("emailPlaceholder")}
                        disabled={busy}
                        required
                      />
                      <TextInput
                        form={form}
                        name="password"
                        type="password"
                        label={t("password")}
                        placeholder={t("passwordPlaceholder")}
                        disabled={busy}
                        required
                      />
                    </>
                  )}
                  <Button type="submit" className="w-full" disabled={busy}>
                    {isPending && <Loader2 className="size-4 animate-spin" />}
                    {t("submit")}
                    <ArrowRight className="size-4 rtl:rotate-180" />
                  </Button>

                  {!signedIn && (
                    <>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <Separator className="flex-1" />
                        {t("or")}
                        <Separator className="flex-1" />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-12 w-full"
                        onClick={onGoogle}
                        disabled={busy}
                      >
                        {isGooglePending ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
                        {t("continueWithGoogle")}
                      </Button>
                    </>
                  )}
                </form>
              </Form>

              {!signedIn && (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  {t("haveAccount")}{" "}
                  <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                    {t("signIn")}
                  </Link>
                </p>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
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
