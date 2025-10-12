import { CouponsManagement } from "@/components/dashboard/CouponsManagement";

// Force dynamic rendering since this page uses cookies for authentication

const Coupons = () => {
  return <CouponsManagement />;
};

export default Coupons;
