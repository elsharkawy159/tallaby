import { getTranslations } from "next-intl/server";

import { LanguageSwitcher } from "@/components/language-switcher";

import { UserMenu } from "./user-menu";

interface HeaderProps {
  name: string;
  email: string;
}

export async function Header({ name, email }: HeaderProps) {
  const t = await getTranslations("common");

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-background px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <span className="font-semibold">{t("appName")}</span>
      </div>
      <div className="ms-auto flex items-center gap-2">
        <LanguageSwitcher variant="header" />
        <UserMenu name={name} email={email} />
      </div>
    </header>
  );
}
