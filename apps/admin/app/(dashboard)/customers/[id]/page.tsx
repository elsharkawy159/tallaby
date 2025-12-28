import { CustomerProfileData } from "./customer-profile.data";
import type { CustomerProfilePageProps } from "./customer-profile.types";

export default function CustomerProfilePage({
  params,
}: CustomerProfilePageProps) {
  return <CustomerProfileData customerId={params.id} />;
}
