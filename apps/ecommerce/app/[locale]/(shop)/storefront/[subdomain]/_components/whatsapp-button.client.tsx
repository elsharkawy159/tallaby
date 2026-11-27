"use client";

import { useTranslations } from "next-intl";
import { SocialIcon } from "@workspace/store-sections/social-icon";
import {
  WHATSAPP_BUTTON_SIZE_PX,
  whatsAppButtonShowsOn,
  type StoreWhatsAppButtonSettings,
} from "@workspace/lib/stores/whatsapp-button";
import { usePathname } from "@/i18n/navigation";

/** Same breakpoint as the storefront's bottom navigation and cart bar (767px and below is a phone). */
const BASE_CSS = `
.sf-wa{position:fixed;z-index:46;bottom:calc(var(--sf-wa-m) + env(safe-area-inset-bottom));display:inline-flex;align-items:center;justify-content:center;gap:8px;box-sizing:border-box;height:var(--sf-wa-size);min-width:var(--sf-wa-size);padding:0;border-radius:999px;background:#25D366;color:#fff;font-weight:700;font-size:15px;line-height:1;white-space:nowrap;text-decoration:none;box-shadow:0 8px 24px rgb(0 0 0/.18);-webkit-tap-highlight-color:transparent;transition:transform .2s ease,box-shadow .2s ease}
.sf-wa[data-side=right]{right:16px}
.sf-wa[data-side=left]{left:16px}
.sf-wa svg{width:calc(var(--sf-wa-size) * .5);height:calc(var(--sf-wa-size) * .5);flex-shrink:0}
.sf-wa-label{display:none}
.sf-wa:focus-visible{outline:3px solid #128C7E;outline-offset:3px}
@media (hover:hover){.sf-wa:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgb(0 0 0/.22)}}
@media (prefers-reduced-motion:reduce){.sf-wa{transition:none}.sf-wa:hover{transform:none}}
@media (max-width:767px){.sf-wa[data-devices=desktop]{display:none}}
@media (min-width:768px){
.sf-wa{bottom:calc(var(--sf-wa-d) + env(safe-area-inset-bottom))}
.sf-wa[data-side=right]{right:24px}
.sf-wa[data-side=left]{left:24px}
.sf-wa[data-devices=mobile]{display:none}
.sf-wa[data-label]{padding-inline:calc(var(--sf-wa-size) * .25) calc(var(--sf-wa-size) * .4)}
.sf-wa[data-label] .sf-wa-label{display:inline}
}`;

/**
 * The sales pop-up toast sits above the button when they share a corner: on
 * phones it spans the width, on desktop it sits at the reading start (right in
 * Arabic, left in English). Numbers only (parsed and clamped server-side).
 */
function liftCss(settings: StoreWhatsAppButtonSettings, size: number): string {
  const rules: string[] = [];
  if (settings.devices !== "desktop") {
    rules.push(
      `@media (max-width:767px){body:has(.sf-wa) [data-sales-popup]{bottom:calc(${settings.offsetMobile + size + 12}px + env(safe-area-inset-bottom))}}`,
    );
  }
  if (settings.devices !== "mobile") {
    const dir = settings.position === "right" ? "rtl" : "ltr";
    rules.push(
      `@media (min-width:768px){body:has(.sf-wa) [data-sales-popup]:dir(${dir}){bottom:calc(${settings.offsetDesktop + size + 12}px + env(safe-area-inset-bottom))}}`,
    );
  }
  return rules.join("\n");
}

/**
 * Apps › WhatsApp button (owner, 2026-11-27): a floating link to the store's
 * WhatsApp chat. The shell renders it only while the app is installed and a
 * number exists; this checks the page kind (never on account, orders or
 * sign-in pages; cart and checkout only with `showOnCart`). Device visibility,
 * side, size and offsets are plain CSS, so there is no flash after hydration.
 */
export function WhatsAppButton({ href, settings }: { href: string; settings: StoreWhatsAppButtonSettings }) {
  const t = useTranslations("storeWhatsAppButton");
  const pathname = usePathname();
  if (!whatsAppButtonShowsOn(settings, pathname)) return null;

  const size = WHATSAPP_BUTTON_SIZE_PX[settings.size];
  const label = settings.label.trim();
  const style = { "--sf-wa-size": `${size}px`, "--sf-wa-m": `${settings.offsetMobile}px`, "--sf-wa-d": `${settings.offsetDesktop}px` } as React.CSSProperties;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `${BASE_CSS}\n${liftCss(settings, size)}` }} />
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label || t("ariaLabel")}
        className="sf-wa"
        data-sf-motion="off"
        data-side={settings.position}
        data-devices={settings.devices}
        {...(label ? { "data-label": "" } : {})}
        style={style}
      >
        <SocialIcon platform="whatsapp" />
        {label && <span className="sf-wa-label">{label}</span>}
      </a>
    </>
  );
}
