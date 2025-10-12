"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useContext } from "react";
import { getUser, signOutAction } from "@/actions/auth";
import { getSellerProfile } from "@/actions/seller";
import { createClient } from "@/supabase/client";
import type { User } from "@supabase/supabase-js";

interface SellerData {
  id: string;
  displayName: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  returnPolicy: string | null;
  shippingPolicy: string | null;
  storeRating: number | null;
  positiveRatingPercent: number | null;
  totalRatings: number;
  productCount: number;
  isVerified: boolean;
  joinDate: string | null;
  status?: "pending" | "approved" | "suspended" | "restricted";
}

interface AuthContextType {
  user: User | null;
  seller: SellerData | null;
  isLoading: boolean;
  isSellerLoading: boolean;
  logout: () => void;
  isSigningOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Query for user auth data - this returns the Supabase auth user data (faster)
  const { isLoading, data: user } = useQuery<User | null, Error>({
    queryKey: ["user"],
    queryFn: async () => {
      const authData = await getUser();
      // Return the user data directly from Supabase auth
      return authData?.user ?? null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Query for seller data if user is a seller
  const { data: seller, isLoading: isSellerLoading } = useQuery<
    SellerData | null,
    Error
  >({
    queryKey: ["seller", user?.id],
    queryFn: async (): Promise<SellerData | null> => {
      if (!user?.id) return null;

      // Check if user is a seller from metadata
      const isSeller = user.user_metadata?.is_seller === true;

      if (!isSeller) return null;

      // Fetch seller basic info (lightweight, no products)
      const result = await getSellerProfile(user.id);

      if (!result.success || !result.data) {
        return null;
      }

      return result.data as SellerData;
    },
    enabled: !!user?.id, // Only run if user is logged in
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Logout mutation
  const { mutate: logout, isPending: isSigningOut } = useMutation({
    mutationFn: async () => {
      await signOutAction();
    },
    onSuccess: () => {
      // Clear all queries
      queryClient.invalidateQueries({
        queryKey: ["user"],
        refetchType: "active",
      });
      queryClient.invalidateQueries({
        queryKey: ["seller"],
        refetchType: "active",
      });
      queryClient.clear();
      router.refresh();
    },
    onError: (error) => {
      console.error("Logout error:", error);
    },
  });

  const auth: AuthContextType = {
    user: user ?? null,
    seller: seller ?? null,
    isLoading,
    isSellerLoading,
    logout,
    isSigningOut,
  };

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
