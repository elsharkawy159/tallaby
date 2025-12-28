import { createClient } from "@/supabase/server";
import { getSellerProfile } from "@/actions/seller";
import { UserMenu } from "./user-menu";
import { signOutAction } from "@/actions/auth";
import { AuthLinkClient } from "./auth-link-client";

interface AuthLinkProps {
  variant?: "mobile" | "desktop";
  className?: string;
}

export const AuthLink = async ({
  variant = "desktop",
  className,
}: AuthLinkProps) => {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user ?? null;

  // If user is authenticated, show UserMenu
  if (user) {
    let seller: any = null;
    if (user.user_metadata?.is_seller === true) {
      const sellerResult = await getSellerProfile(user.id);
      if (sellerResult.success && sellerResult.data) {
        seller = sellerResult.data;
      }
    }

    return (
      <UserMenu
        variant={variant}
        user={user}
        seller={seller}
        logout={signOutAction}
        isSigningOut={false}
        className={className}
      />
    );
  }

  // If not authenticated, show Link to login
  return <AuthLinkClient variant={variant} className={className} />;
};
