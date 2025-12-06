import { generateNoIndexMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { ProfileForm } from "./_components/profile.chunks";

export const metadata: Metadata = generateNoIndexMetadata();

// Force dynamic rendering - no caching for user profile
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function ProfilePage() {
  return <ProfileForm />;
}
