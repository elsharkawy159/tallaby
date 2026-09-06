import { CustomerProfileData } from "./customer-profile.data";
import type { CustomerProfilePageProps } from "./customer-profile.types";

export default async function CustomerProfilePage({
  params,
}: CustomerProfilePageProps) {
  const { id } = await params;

  return <CustomerProfileData customerId={id} />;
}
