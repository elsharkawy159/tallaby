import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { LoginFormWrapper } from "@/components/login/login-form-wrapper";

interface LoginPageProps {
  searchParams: { redirect?: string };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const redirectTo = searchParams.redirect || undefined;

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <div className="mb-8">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                <span className="text-indigo-600">t</span>
                <span>allaby</span>
              </Link>
            </div>
            <h2 className="mt-8 text-2xl/9 font-bold tracking-tight text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm/6 text-gray-500">
              Not a member?{" "}
              <Link
                href="/signup"
                className="font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Start a 14 day free trial
              </Link>
            </p>
          </div>

          <div className="mt-10">
            <Suspense fallback={<div>Loading...</div>}>
              <LoginFormWrapper redirectTo={redirectTo} />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 m-4">
          <Image
            alt=""
            src="/banner6.jpg"
            fill
            className="rounded-2xl object-cover"
            priority
          />
        </div>
      </div>
    </div>
  );
}
