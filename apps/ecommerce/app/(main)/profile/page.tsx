import { generateNoIndexMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import {
  ProfileForm,
  UserPointsCard,
  GuestOrdersCard,
  GuestAccountBanner,
} from "./_components/profile.chunks";
import { getUserReferredBy, getUserPoints, getProfileContext } from "./_components/profile.server";

export const metadata: Metadata = generateNoIndexMetadata();

// Force dynamic rendering - no caching for user profile
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function ProfilePage() {
  const profileContext = await getProfileContext();
  const { user, isGuest, orderCount } = profileContext;

  const referredBy = isGuest ? null : await getUserReferredBy();
  const totalPoints = isGuest ? null : await getUserPoints();

  return (
    <div className="space-y-6">
      {isGuest && <GuestAccountBanner orderCount={orderCount} />}
      {!isGuest && <UserPointsCard totalPoints={totalPoints} />}
      {isGuest && <GuestOrdersCard orderCount={orderCount} />}
      <ProfileForm
        user={user}
        referredBy={referredBy}
        isGuest={isGuest}
      />
    </div>
  );
}
