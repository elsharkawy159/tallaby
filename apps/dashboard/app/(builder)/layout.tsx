import { redirect } from "next/navigation";
import { SellerAccessBlocked } from "@/components/layout/seller-access-blocked";
import { getSellerAccess } from "@/lib/auth/seller-access";
import { createClient } from "@/supabase/server";

/**
 * Full-screen builder routes (PLAN.md P4-06): the same seller gate as the
 * dashboard layout, without the sidebar.
 */
export default async function BuilderLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const access = await getSellerAccess(user.id);
  if (!access.allowed && access.reason === "no_seller") redirect("/signup");
  if (!access.allowed) return <SellerAccessBlocked access={access} />;

  return <div className="min-h-dvh bg-background">{children}</div>;
}
