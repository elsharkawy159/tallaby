import Image from "next/image";
import { Suspense } from "react";
import { SignupFormWrapper } from "@/components/signup/signup-form-wrapper";
import { Logo } from "@/components/logo";

export default function AuthPage() {
  return (
    <div className="flex min-h-screen relative">
      <div className="absolute top-10 left-1/2 md:hidden -translate-x-1/2">
        <Logo color="primary" />
      </div>
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8 md:block hidden">
            <Logo color="primary" />
          </div>
          <div></div>
          <div className="mt-10">
            <Suspense fallback={<div>{/* Loading... */}</div>}>
              <SignupFormWrapper />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 m-6">
          <Image
            alt="auth background"
            src="/auth-bg.jpg"
            fill
            className="rounded-2xl object-cover"
            priority
            loading="eager"
            fetchPriority="high"
          />
        </div>
      </div>
    </div>
  );
}
