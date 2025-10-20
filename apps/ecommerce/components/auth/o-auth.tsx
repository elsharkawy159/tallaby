"use client";

import Image from "next/image";
import { useTransition } from "react";
import { getShareUrl } from "@/lib/utils";
import { createClient } from "@/supabase/client";
import { Button } from "@workspace/ui/components/button";

export function OAuth({ next }: { next?: string }) {
  const [isPending, startTransition] = useTransition();
  const baseUrl = getShareUrl();

  const handleOAuthSignin = (provider: "google" | "twitter" | "facebook") => {
    startTransition(async () => {
      // await loginWithOAuth(provider);
      const supabase = createClient();
      const redirectUrl = `${baseUrl}/auth/callback?next=${next || "/"}`;

      supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: redirectUrl,
        },
      });
    });
  };

  return (
    <div className="grid grid-cols-3 gap-x-3">
      <Button
        className="flex items-center justify-center py-2.5 min-h-12 border rounded-lg hover:bg-gray-50 duration-150 active:bg-gray-100"
        onClick={() => handleOAuthSignin("google")}
        disabled={isPending}
        type="button"
        variant="outline">
        <svg className="size-6" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_17_40)">
            <path
              d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z"
              fill="#4285F4"
            />
            <path
              d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z"
              fill="#34A853"
            />
            <path
              d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03298C-0.371021 20.0112 -0.371021 28.0009 3.03298 34.7825L11.0051 28.6006Z"
              fill="#FBBC04"
            />
            <path
              d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4055 0.00161733 7.10718 5.11644 3.03296 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z"
              fill="#EA4335"
            />
          </g>
          <defs>
            <clipPath id="clip0_17_40">
              <rect width="48" height="48" fill="white" />
            </clipPath>
          </defs>
        </svg>
      </Button>
      <Button
        className="flex items-center justify-center py-2.5 min-h-12 border rounded-lg hover:bg-gray-50 duration-150 active:bg-gray-100"
        type="button"
        onClick={() => handleOAuthSignin("twitter")}
        disabled={isPending}
        variant="outline">
        <svg className="size-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
          <path d="M11.4678 8.77491L17.2961 2H15.915L10.8543 7.88256L6.81232 2H2.15039L8.26263 10.8955L2.15039 18H3.53159L8.87581 11.7878L13.1444 18H17.8063L11.4675 8.77491H11.4678ZM9.57608 10.9738L8.95678 10.0881L4.02925 3.03974H6.15068L10.1273 8.72795L10.7466 9.61374L15.9156 17.0075H13.7942L9.57608 10.9742V10.9738Z" />
        </svg>
      </Button>
      <Button
        className="flex items-center justify-center py-2.5 min-h-12 border rounded-lg hover:bg-gray-50 duration-150 active:bg-gray-100"
        onClick={() => handleOAuthSignin("facebook")}
        disabled={isPending}
        type="button"
        variant="outline">
        <Image src="/icons/auth-facebook.png" width={24} height={24} className="size-6" alt="facebook" />
      </Button>
    </div>
  );
}
