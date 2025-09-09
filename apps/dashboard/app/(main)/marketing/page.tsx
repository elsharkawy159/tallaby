import { MarketingDashboard } from "@/components/dashboard/MarketingDashboard";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = "force-dynamic";

const Marketing = () => {
  return <MarketingDashboard />;
};

export default Marketing;
