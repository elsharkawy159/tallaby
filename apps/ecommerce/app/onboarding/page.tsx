import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { OnboardingFormWrapper } from "@/components/onboarding/onboarding-form-wrapper";

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <div className="mb-8">
              <Logo className="*:text-primary" />
            </div>
            <h2 className="mt-8 text-2xl/9 font-bold tracking-tight text-gray-900">
              Become a Seller
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Create your vendor account and start selling on our platform.{" "}
              <Link
                href="/login"
                className="font-semibold text-primary hover:text-primary/80"
              >
                Already have an account? Sign in
              </Link>
            </p>
          </div>
          <div className="mt-10">
            <Suspense fallback={<div>Loading...</div>}>
              <OnboardingFormWrapper />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 m-6">
          <Image
            alt=""
            src="/auth-bg.jpg"
            fill
            className="rounded-2xl object-cover"
            priority
          />
        </div>
      </div>
    </div>
  );
}
