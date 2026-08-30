import { Suspense } from "react";

import { Skeleton } from "@workspace/ui/components/skeleton";

import { LoginForm } from "./_components/login-form";

// LoginForm reads useSearchParams() to surface the ?error=forbidden toast, so it
// has to sit behind a Suspense boundary for the shell to prerender.
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
          <Skeleton className="h-96 w-full max-w-sm rounded-xl" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
