import { FinancialDashboard } from "@/components/dashboard/FinancialDashboard";

// Force dynamic rendering since this page uses cookies for authentication

const Financial = () => {
  return <FinancialDashboard />;
};

export default Financial;
