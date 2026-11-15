import { Suspense } from "react";
import { SellerSettingsData } from "./seller-settings.data";
import { SellerSettingsSkeleton } from "./seller-settings.skeleton";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const Settings = () => (
  <Suspense fallback={<SellerSettingsSkeleton />}>
    <SellerSettingsData />
  </Suspense>
);

export default Settings;
