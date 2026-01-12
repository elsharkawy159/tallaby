"use client";

import { useTransition, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import { TextInput } from "@workspace/ui/components/inputs";
import { Form } from "@workspace/ui/components/form";

import {
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
  type SignInFormData,
  type SignUpFormData,
  type ForgotPasswordFormData,
} from "@/lib/validations/auth-schemas";

import type { AuthFormProps } from "./auth-dialog.types";
import { forgotPasswordAction, signInAction, signUpUser } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

// Sign In Form Component
export function SignInForm({
  redirectTo,
  onSuccess,
  initialValues,
}: {
  redirectTo?: string;
  onSuccess?: () => void;
  initialValues?: { email?: string; password?: string };
}) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations("auth");
  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: initialValues?.email || "",
      password: initialValues?.password || "",
    },
  });

  // Update form values when initialValues change
  useEffect(() => {
    if (initialValues?.email || initialValues?.password) {
      form.reset({
        email: initialValues.email || "",
        password: initialValues.password || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues?.email, initialValues?.password]);

  const handleSubmit = (data: SignInFormData) => {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const result = await signInAction(data);

        if (result.success) {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push(redirectTo || "/");
          }
        } else {
          setErrorMessage(
            result.message || t("signInFailed")
          );
        }
      } catch (error) {
        console.error("Sign in error:", error);
        setErrorMessage(t("somethingWentWrong"));
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <TextInput
          form={form}
          name="email"
          label={t("emailAddress")}
          type="email"
          placeholder={t("enterEmail")}
          disabled={isPending}
          required
        />

        <TextInput
          form={form}
          name="password"
          label={t("password")}
          type="password"
          placeholder={t("enterPassword")}
          disabled={isPending}
          required
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? t("signingIn") : t("signIn")}
        </Button>

        {errorMessage && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}
      </form>
    </Form>
  );
}

// Sign Up Form Component
export function SignUpForm({
  onSuccess,
}: {
  onSuccess?: (credentials?: { email: string; password: string }) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("auth");

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = (data: SignUpFormData) => {
    startTransition(async () => {
      try {
        const result = await signUpUser(data);
        if (result.success) {
          toast.success(t("accountCreated"));
          // Store credentials before resetting
          const credentials = {
            email: data.email,
            password: data.password,
          };
          form.reset();
          onSuccess?.(credentials);

          // If user is signed in automatically, refresh the page
          if (result.data?.id) {
            // window.location.reload();
          }
        } else {
          toast.error(result.error);
        }
      } catch (error) {
        console.error("Sign up error:", error);
        toast.error(t("somethingWentWrong"));
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <TextInput
          form={form}
          name="fullName"
          label={t("fullName")}
          type="text"
          placeholder={t("enterFullName")}
          disabled={isPending}
          required
        />

        <TextInput
          form={form}
          name="email"
          label={t("emailAddress")}
          type="email"
          placeholder={t("enterEmail")}
          disabled={isPending}
          required
        />

        <TextInput
          form={form}
          name="password"
          label={t("password")}
          type="password"
          placeholder={t("enterPassword")}
          disabled={isPending}
          required
        />

        <TextInput
          form={form}
          name="confirmPassword"
          label={t("confirmPassword")}
          type="password"
          placeholder={t("enterConfirmPassword")}
          disabled={isPending}
          required
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? t("signingUp") : t("createAccount")}
        </Button>
      </form>
    </Form>
  );
}

// Forgot Password Form Component
export function ForgotPasswordForm({
  onSuccess,
}: Omit<AuthFormProps, "isLoading" | "setIsLoading">) {
  const [isPending, startTransition] = useTransition();
  const tToast = useTranslations("toast");

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = (data: ForgotPasswordFormData) => {
    startTransition(async () => {
      try {
        const result = await forgotPasswordAction(data);

        if (result.success) {
          toast.success(result.message);
          form.reset();
          onSuccess();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error("Forgot password error:", error);
        toast.error(tToast("forgotPasswordError"));
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <TextInput
          form={form}
          name="email"
          label="Email Address"
          type="email"
          placeholder="Enter your email address"
          disabled={isPending}
          required
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isPending || !form.formState.isValid}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Sending Instructions..." : "Send Instructions"}
        </Button>
      </form>
    </Form>
  );
}
