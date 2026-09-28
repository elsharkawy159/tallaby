import { useTranslations } from "next-intl";

// Force dynamic rendering since this page uses cookies for authentication

const Reports = () => {
  const t = useTranslations("reports");
  return <div>{t("title")}</div>;
};

export default Reports;
