"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function AuthCodeErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = () => {
    switch (error) {
      case "no_session":
        return "We couldn't create your session. Please try signing in again.";
      case "unexpected_error":
        return "An unexpected error occurred. Please try again.";
      default:
        return error || "There was a problem with the authentication process.";
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[60vh] py-12">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Authentication Failed
          </h1>
          <p className="text-muted-foreground text-lg">{getErrorMessage()}</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            If the problem persists, please contact our support team.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button asChild>
              <Link href="/login">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground font-mono break-all">
              Error: {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
