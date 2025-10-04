import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { AuthPageClient } from "./auth-page-client";

// Force this page to be dynamic since it uses cookies
export const dynamic = "force-dynamic";

async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { user: null };
    }

    return { user };
  } catch (error) {
    console.error("Error getting current user:", error);
    return { user: null };
  }
}

export default async function CustomerAuthPage() {
  // Check if user is already authenticated
  const { user } = await getCurrentUser();

  if (user) {
    // Redirect to home for authenticated users
    redirect("/");
  }

  return <AuthPageClient />;
}

export const metadata = {
  title: "Sign In | Tallaby.com",
  description:
    "Sign in to your Tallaby.com account or create a new one to start shopping with us. Secure authentication for your e-commerce experience.",
};
