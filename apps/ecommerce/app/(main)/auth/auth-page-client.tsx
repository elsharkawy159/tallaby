"use client";

import { useEffect } from "react";
import { useAuthDialog } from "@/hooks/use-auth-dialog";

export const AuthPageClient = () => {
  const { open } = useAuthDialog();

  useEffect(() => {
    // Open the auth dialog when the page loads
    open("signin");
  }, [open]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
        <p className="text-gray-600">
          Sign in to your account to continue shopping
        </p>
      </div>
    </div>
  );
};
