"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { SETUP_DISMISS_COOKIE } from "./home.shared";
import { requestSetupPromptCheck } from "./setup-prompts.lib";

/** Lets the seller hide the setup card; remembered for a year in a cookie the server reads. */
export function SetupDismissible({ children }: { children: React.ReactNode }) {
  const t = useTranslations("home.setup");
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  const dismiss = () => {
    document.cookie = `${SETUP_DISMISS_COOKIE}=1; path=/; max-age=31536000; samesite=lax`;
    setHidden(true);
    requestSetupPromptCheck();
  };

  return (
    <div className="relative">
      {children}
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("dismiss")}
        className="absolute end-3.5 top-3.5 z-[2] grid size-9 cursor-pointer place-items-center rounded-[11px] text-[#a9c3c9] transition-colors duration-150 hover:bg-white/8 hover:text-white max-[600px]:size-10"
      >
        <X className="size-[18px]" aria-hidden />
      </button>
    </div>
  );
}
