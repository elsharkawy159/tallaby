"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Form } from "@workspace/ui/components/form";
import { TextInput } from "@workspace/ui/components/inputs";
import { Button } from "@workspace/ui/components/button";

import {
  signInSchema,
  type SignInFormData,
} from "@/lib/validations/auth-schemas";

import { signInAction } from "@/actions/auth";
import { useQueryClient } from "@tanstack/react-query";

interface LoginFormClientProps {
  redirectTo?: string;
}

export function LoginFormClient({ redirectTo }: LoginFormClientProps) {
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = (data: SignInFormData) => {
    startTransition(async () => {
      try {
        const result = await signInAction(data);
        queryClient.invalidateQueries({ queryKey: ["user"] });

        if (result.success) {
          toast.success("Signed in successfully");

          // Redirect to previous URL or home (prioritize prop, then searchParams, then home)
          const redirect = redirectTo || searchParams.get("redirect") || "/";
          router.push(redirect);
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error("Sign in error:", error);
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <TextInput
          form={form}
          name="email"
          label="Email address"
          type="email"
          placeholder="Enter your email"
          disabled={isPending}
          required
          showIcon={false}
          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
        />

        <TextInput
          form={form}
          name="password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          disabled={isPending}
          required
          showIcon={false}
          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
        />

        <div className="flex items-center justify-between">
          <div className="text-sm/6">
            <Link
              href="/forgot-password"
              className="font-semibold text-primary"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in
          </Button>
        </div>
      </form>
    </Form>
  );
}
