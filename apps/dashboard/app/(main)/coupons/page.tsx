import { CouponsManagement } from "@/components/dashboard/CouponsManagement";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = "force-dynamic";

const Coupons = () => {
  return <CouponsManagement />;
};

export default Coupons;
