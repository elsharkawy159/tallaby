import { Suspense } from "react";
import { SellerSettingsData } from "./seller-settings.data";
import { SellerSettingsSkeleton } from "./seller-settings.skeleton";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = "force-dynamic";

const Settings = () => {
  return (
    <Suspense fallback={<SellerSettingsSkeleton />}>
      <SellerSettingsData />
    </Suspense>
  );
};

export default Settings;
