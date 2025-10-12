import { ProfileForm } from "./profile.chunks";
import { generateNoIndexMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = generateNoIndexMetadata();

export default function ProfilePage() {
  return <ProfileForm />;
}
