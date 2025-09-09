import { ShippingDashboard } from "@/components/dashboard/ShippingDashboard";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = "force-dynamic";

const Shipping = () => {
  return <ShippingDashboard />;
};

export default Shipping;
