"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useIsMarketplaceHost } from "@/lib/marketplace/marketplace-host.client";
import {
  onOpenCookieSettings,
  openCookieSettings,
  useTrackingConsent,
  writeTrackingConsent,
} from "@/lib/tracking-consent.client";
import { shouldShowConsentBanner } from "@/lib/tracking-consent.lib";

/*
 * Lives in the root layout so it also covers tallaby.com's (shop) pages, whose
 * CSS has no marketing tokens: colours are the marketing palette's values
 * written out. Clears the floating WhatsApp button and the home page's sticky
 * bar (both from marketing.css) on phones; on wider screens it sits on the left,
 * WhatsApp being on the right in both languages.
 */
const POSITION =
  "fixed inset-x-3 bottom-[88px] z-[54] " +
  "max-md:[body:has([data-sticky-cta][data-shown=true])_&]:bottom-[156px] " +
  "max-md:[body:has([data-sticky-cta][data-shown=false])_&]:bottom-3 " +
  "md:right-auto md:bottom-5 md:left-5 md:w-[440px] " +
  "[body[data-scroll-locked]_&]:hidden print:hidden";

const BUTTON =
  "h-[42px] min-w-0 flex-1 rounded-full border-[1.5px] border-[#dfe8ea] bg-white px-4 text-sm font-bold text-[#0d3743] " +
  "transition-colors duration-150 hover:border-[#0d3743] aria-pressed:border-[#0d3743] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d3743]";

/**
 * Tallaby's own cookie choice on tallaby.com (F-70a): GA4 and the Meta Pixel
 * wait for Accept. Store hosts render nothing, they have their own banner.
 */
export function TrackingConsentBanner() {
  const t = useTranslations("trackingConsent");
  const isMarketplace = useIsMarketplaceHost();
  const consent = useTrackingConsent();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const firstButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(
    () =>
      onOpenCookieSettings(() => {
        returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setSettingsOpen(true);
      }),
    [],
  );

  // Reopened by keyboard: focus moves into the banner. Never on a first visit.
  useEffect(() => {
    if (settingsOpen) firstButton.current?.focus();
  }, [settingsOpen]);

  function closeSettings() {
    setSettingsOpen(false);
    returnFocus.current?.focus();
    returnFocus.current = null;
  }

  function choose(value: "granted" | "denied") {
    writeTrackingConsent(value);
    if (settingsOpen) closeSettings();
  }

  if (!isMarketplace || !shouldShowConsentBanner(consent, settingsOpen)) return null;

  return (
    <div
      role="region"
      aria-label={t("label")}
      data-print="hide"
      onKeyDown={(event) => {
        if (event.key === "Escape" && settingsOpen && consent !== "unset") closeSettings();
      }}
      className={`${POSITION} rounded-[18px] border border-[#e3ebed] bg-white p-4 text-[13px] leading-[1.7] text-[#43575c] shadow-[0_10px_28px_rgba(13,55,67,0.12)]`}
    >
      <p className="text-pretty">
        {t("text")}{" "}
        <Link href="/privacy#cookies" className="font-semibold whitespace-nowrap text-[#0d3743] underline underline-offset-2">
          {t("learnMore")}
        </Link>
      </p>
      <div className="mt-3 flex gap-2">
        <button
          ref={firstButton}
          type="button"
          className={BUTTON}
          aria-pressed={settingsOpen ? consent === "granted" : undefined}
          onClick={() => choose("granted")}
        >
          {t("accept")}
        </button>
        <button
          type="button"
          className={BUTTON}
          aria-pressed={settingsOpen ? consent === "denied" : undefined}
          onClick={() => choose("denied")}
        >
          {t("decline")}
        </button>
      </div>
    </div>
  );
}

/** "Cookie settings" in a footer: reopens the banner so a visitor can change their mind. */
export function CookieSettingsButton({ className }: { className?: string }) {
  const t = useTranslations("trackingConsent");
  return (
    <button type="button" className={`w-fit cursor-pointer text-start ${className ?? ""}`} onClick={openCookieSettings}>
      {t("settings")}
    </button>
  );
}
