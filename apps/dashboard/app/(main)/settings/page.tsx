import { Suspense } from "react";
import { SellerSettingsData } from "./seller-settings.data";
import { SellerSettingsSkeleton } from "./seller-settings.skeleton";


const Settings = () => {
  return (
    <Suspense fallback={<SellerSettingsSkeleton />}>
      <SellerSettingsData />
    </Suspense>
  );
};

export default Settings;
