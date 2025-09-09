import { HelpSupport } from "@/components/dashboard/HelpSupport";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = "force-dynamic";

const Help = () => {
  return <HelpSupport />;
};

export default Help;
