import { getUser } from "@/actions/auth";
import { getVendorProfile } from "@/actions/vendor";
import { VendorProfileForm } from "./vendor-profile.form";

export async function VendorProfileData() {
  const { user } = await getUser();

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">
          Please log in to view your profile
        </h2>
      </div>
    );
  }

  const profile = await getVendorProfile(user.id);

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">
          Profile not found
        </h2>
        <p className="text-gray-600 mt-2">
          Please contact support to set up your vendor profile.
        </p>
      </div>
    );
  }

  return <VendorProfileForm profile={profile} />;
}
