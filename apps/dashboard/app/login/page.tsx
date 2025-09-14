"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

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
  signInSchema,
  resetPasswordSchema,
  type SignInFormData,
  type ResetPasswordFormData,
} from "@/lib/validations/vendor-schemas";
import Image from "next/image";

export default function AuthPage() {
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if user returned from password reset email
  useEffect(() => {
    const resetParam = searchParams.get("reset");
    if (resetParam === "true") {
      toast.success(
        "Password reset successful! You can now sign in with your new password."
      );
    }
  }, [searchParams]);

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
        toast.success("Redirecting to dashboard...");
        router.push("/");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to sign in"
        );
      }
    });
  };

  const handleResetPassword = (data: ResetPasswordFormData) => {
    startTransition(async () => {
      try {
        await resetPassword(data.resetEmail);
        setResetSuccess(true);
        toast.success("Password reset link sent to your email!");
        resetForm.reset();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to send reset email"
        );
      }
    });
  };

  if (showResetForm) {
    return (
      <div className="min-h-screen flex items-center justify-center from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <img
          src="https://images.unsplash.com/photo-1496917756835-20cb06e75b4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1908&q=80"
          alt="Background"
          className="object-cover absolute top-0 left-0 w-full h-full z-[-1]"
        />
        <div className="absolute top-0 left-0 w-full h-full z-[-1] bg-gradient-to-b from-black/30 to-black from-70%" />
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {resetSuccess ? "Check Your Email" : "Reset Password"}
            </CardTitle>
            <CardDescription className="text-center">
              {resetSuccess ? (
                <>
                  We've sent a password reset link to your email address. Please
                  check your inbox and follow the instructions to reset your
                  password.
                </>
              ) : (
                <>
                  Enter your email address and we'll send you a link to reset
                  your password
                </>
              )}
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
                    Didn't receive the email? Check your spam folder or try
                    again.
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
                    Back to Sign In
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setResetSuccess(false)}
                  >
                    Try Another Email
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
                    label="Email"
                    type="email"
                    placeholder="Enter your email"
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
                      Send Reset Link
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowResetForm(false)}
                      disabled={isPending}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Sign In
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
    <div className="min-h-screen flex items-center justify-center from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <img
        src="https://images.unsplash.com/photo-1496917756835-20cb06e75b4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1908&q=80"
        alt="Background"
        className="object-cover absolute top-0 left-0 w-full h-full z-[-1]"
      />
      <div className="absolute top-0 left-0 w-full h-full z-[-1] bg-gradient-to-b from-black/30 to-black from-70%" />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Vendor Dashboard
          </CardTitle>
          <CardDescription className="text-center">
            Access your seller account to manage products and orders
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
                label="Email"
                type="email"
                placeholder="Enter your email"
                disabled={isPending}
                required
              />
              <TextInput
                form={signInForm}
                name="password"
                label="Password"
                type="password"
                placeholder="Enter your password"
                disabled={isPending}
                required
              />
              <div className="space-y-2">
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-sm"
                  onClick={() => setShowResetForm(true)}
                  disabled={isPending}
                >
                  Forgot your password?
                </Button>
              </div>
            </form>
          </Form>

          <Separator className="my-4" />

          <div className="text-center text-sm text-muted-foreground">
            By continuing, you agree to our{" "}
            <Button variant="link" className="p-0 h-auto font-normal text-sm">
              Terms of Service
            </Button>{" "}
            and{" "}
            <Button variant="link" className="p-0 h-auto font-normal text-sm">
              Privacy Policy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
