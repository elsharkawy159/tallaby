"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { SETUP_DISMISS_COOKIE } from "./home.shared";

/** Lets the seller hide the setup card; remembered for a year in a cookie the server reads. */
export function SetupDismissible({ children }: { children: React.ReactNode }) {
  const t = useTranslations("home.setup");
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  const dismiss = () => {
    document.cookie = `${SETUP_DISMISS_COOKIE}=1; path=/; max-age=31536000; samesite=lax`;
    setHidden(true);
  };

  return (
    <div className="relative">
      {children}
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("dismiss")}
        className="absolute end-3 top-3 flex size-9 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <X className="size-[18px]" aria-hidden />
      </button>
    </div>
  );
}
