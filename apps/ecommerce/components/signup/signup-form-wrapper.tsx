"use client";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@workspace/ui/components/tabs";
import { useSearchParams } from "next/navigation";
import { SignInForm, SignUpForm } from "../auth/auth-dialog.chunks";
import { OAuth } from "../auth/o-auth";
import { Separator } from "@workspace/ui/components";
import { useState } from "react";
import type { AuthMode } from "../auth/auth-dialog.types";

export function SignupFormWrapper() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const [mode, setMode] = useState<AuthMode>("signin");
  const [signInCredentials, setSignInCredentials] = useState<{
    email?: string;
    password?: string;
  } | null>(null);

  return (
    <Tabs
      value={mode}
      className="w-full"
      onValueChange={(value) => setMode(value as AuthMode)}
    >
      <TabsList className="grid w-full grid-cols-2 mb-5">
        <TabsTrigger value="signin">Sign In</TabsTrigger>
        <TabsTrigger value="signup">Create Account</TabsTrigger>
      </TabsList>

      <TabsContent value="signin" className="mt-0">
        <SignInForm
          key={signInCredentials?.email || "signin-form"}
          redirectTo={redirectTo}
          initialValues={signInCredentials || undefined}
        />
      </TabsContent>

      <TabsContent value="signup" className="mt-0">
        <SignUpForm
          onSuccess={(credentials) => {
            if (credentials) {
              setSignInCredentials(credentials);
            }
            setMode("signin");
          }}
        />
      </TabsContent>

      <div className="space-y-4 mt-5">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or sign in with
            </span>
          </div>
        </div>

        <OAuth next={redirectTo} />
      </div>
    </Tabs>
  );
}
