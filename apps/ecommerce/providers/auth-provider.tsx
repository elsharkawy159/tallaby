"use client";

import type { User } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, type ReactNode, useContext } from "react";
import {
  getUser,
  signOutAction,
  getUserWithSellerProfile,
} from "@/actions/auth";
import { createClient } from "@/supabase/client";
import { transformSupabaseUser } from "@/app/(main)/profile/profile.lib";
import type { SupabaseUser } from "@/app/(main)/profile/profile.types";

interface SellerProfile {
  id: string;
  [key: string]: any; // Add other seller fields as needed
}

interface UserWithSeller {
  user: any;
  seller: SellerProfile | null;
  error: any;
}

interface AuthContextType {
  user: User | null;
  userWithSeller: UserWithSeller | null;
  isLoading: boolean;
  isLoadingUserWithSeller: boolean;
  logout: () => void;
  isSigningOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Query for basic user data
  const { isLoading, data: user } = useQuery<User | null, Error>({
    queryKey: ["user"],
    queryFn: async () => {
      const user = await getUser();
      return user?.user ?? null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Query for user with seller profile data
  const { isLoading: isLoadingUserWithSeller, data: userWithSeller } = useQuery<
    UserWithSeller | null,
    Error
  >({
    queryKey: ["userWithSeller"],
    queryFn: async () => {
      const result = await getUserWithSellerProfile();
      if (result.user) {
        // Transform Supabase user to our internal structure
        const transformedUser = transformSupabaseUser(
          result.user as SupabaseUser
        );
        return {
          user: transformedUser,
          seller: result.seller,
          error: result.error,
        };
      }
      return null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!user, // Only run if we have a basic user
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
        queryKey: ["userWithSeller"],
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
    userWithSeller: userWithSeller ?? null,
    isLoading,
    isLoadingUserWithSeller,
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
