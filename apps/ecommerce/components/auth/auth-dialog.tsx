"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";

import {
  SignInForm,
  SignUpForm,
  ForgotPasswordForm,
} from "./auth-dialog.chunks";
import type { AuthMode, AuthDialogProps } from "./auth-dialog.types";

export function AuthDialog({
  open,
  onOpenChange,
  defaultMode = "signin",
}: AuthDialogProps) {
  
  const [mode, setMode] = useState<AuthMode>(defaultMode);

  const getDialogContent = () => {
    switch (mode) {
      case "signin":
        return {
          title: "Sign In",
          description: "Sign in to your account to continue shopping",
        };
      case "signup":
        return {
          title: "Create Account",
          description: "Join us and start your shopping journey",
        };
      case "forgot-password":
        return {
          title: "Reset Password",
          description: "Enter your email to receive reset instructions",
        };
    }
  };

  const content = getDialogContent();

  const handleSuccess = () => {
    onOpenChange(false);
    if (mode === "forgot-password") {
      setMode("signin");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {content.title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {content.description}
          </DialogDescription>
        </DialogHeader>

        {mode === "signin" && <SignInForm onSuccess={handleSuccess} />}

        {mode === "signup" && <SignUpForm onSuccess={handleSuccess} />}

        {mode === "forgot-password" && (
          <ForgotPasswordForm onSuccess={handleSuccess} />
        )}

        <div className="space-y-4">
          {mode !== "forgot-password" && (
            <>
              <Separator />
              <div className="text-center text-sm">
                {mode === "signin" ? (
                  <>
                    Don't have an account?{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto font-normal"
                      onClick={() => setMode("signup")}
                    >
                      Create one here
                    </Button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto font-normal"
                      onClick={() => setMode("signin")}
                    >
                      Sign in here
                    </Button>
                  </>
                )}
              </div>
            </>
          )}

          {mode === "signin" && (
            <div className="text-center">
              <Button
                variant="link"
                className="p-0 h-auto font-normal text-sm"
                onClick={() => setMode("forgot-password")}
              >
                Forgot your password?
              </Button>
            </div>
          )}

          {mode === "forgot-password" && (
            <div className="text-center">
              <Button
                variant="link"
                className="p-0 h-auto font-normal text-sm"
                onClick={() => setMode("signin")}
              >
                Back to sign in
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
