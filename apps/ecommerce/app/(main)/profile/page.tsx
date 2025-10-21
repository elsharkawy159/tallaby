import { generateNoIndexMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { ProfileForm } from "./_components/profile.chunks";

export const metadata: Metadata = generateNoIndexMetadata();

export default function ProfilePage() {
  return <ProfileForm />;
}
