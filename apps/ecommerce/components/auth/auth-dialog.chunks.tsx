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
            result.message || "Sign in failed. Please try again."
          );
        }
      } catch (error) {
        console.error("Sign in error:", error);
        setErrorMessage("Something went wrong. Please try again.");
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
          placeholder="Enter your email"
          disabled={isPending}
          required
        />

        <TextInput
          form={form}
          name="password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          disabled={isPending}
          required
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Signing In..." : "Sign In"}
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
          toast.success(
            "Account created successfully! Please check your email to verify your account."
          );
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
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <TextInput
          form={form}
          name="fullName"
          label="Full Name"
          type="text"
          placeholder="John"
          disabled={isPending}
          required
        />

        <TextInput
          form={form}
          name="email"
          label="Email Address"
          type="email"
          placeholder="john.doe@example.com"
          disabled={isPending}
          required
        />

        <TextInput
          form={form}
          name="password"
          label="Password"
          type="password"
          placeholder="Create a strong password"
          disabled={isPending}
          required
        />

        <TextInput
          form={form}
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          disabled={isPending}
          required
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Creating Account..." : "Create Account"}
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
        toast.error("Something went wrong. Please try again.");
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
