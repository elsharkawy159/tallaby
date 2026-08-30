import { getAuthUser } from "@/lib/auth/current-user";
import { getSellerProfile } from "@/actions/seller";
import { UserMenu } from "./user-menu";
import { signOutAction } from "@/actions/auth";
import { AuthLinkClient } from "./auth-link-client";
import { getGuestUserId } from "@/lib/guest-user";
import { getProfileContext } from "@/app/(main)/profile/_components/profile.server";
import { GuestProfileLink } from "./guest-profile-link";

interface AuthLinkProps {
  variant?: "mobile" | "desktop";
  className?: string;
}

export const AuthLink = async ({
  variant = "desktop",
  className,
}: AuthLinkProps) => {
  const user = await getAuthUser();

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

  const guestUserId = await getGuestUserId();
  if (guestUserId) {
    const profileContext = await getProfileContext();
    const displayName =
      profileContext.user?.user_metadata?.fullName ||
      profileContext.user?.user_metadata?.full_name ||
      "Guest";

    return (
      <GuestProfileLink
        variant={variant}
        className={className}
        displayName={displayName}
      />
    );
  }

  // If not authenticated, show Link to login
  return <AuthLinkClient variant={variant} className={className} />;
};
