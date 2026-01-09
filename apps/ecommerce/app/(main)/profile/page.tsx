import { generateNoIndexMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { ProfileForm, UserPointsCard } from "./_components/profile.chunks";
import { createClient } from "@/supabase/server";
import { getUserReferredBy, getUserPoints } from "./_components/profile.server";

export const metadata: Metadata = generateNoIndexMetadata();

// Force dynamic rendering - no caching for user profile
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user ?? null;
  const referredBy = await getUserReferredBy();
  const totalPoints = await getUserPoints();

  return (
    <div className="space-y-6">
      <UserPointsCard totalPoints={totalPoints} />
      <ProfileForm user={user} referredBy={referredBy} />
    </div>
  );
}
