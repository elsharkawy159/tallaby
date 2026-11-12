import { defineApp } from "../manifest";

/** P7-05: a Conversions API token, encrypted at rest; purchases go to Meta from the server. */
export default defineApp({
  id: "meta_capi",
  slug: "meta-capi",
  kind: "integration",
  category: "tracking",
  mechanism: "server",
  name: { ar: "Meta Conversions API", en: "Meta Conversions API" },
  vendor: { ar: "Meta", en: "Meta" },
  summary: {
    ar: "أرسل المشتريات إلى Meta من الخادم لتتبع أدق.",
    en: "Send purchases to Meta from the server for more reliable tracking.",
  },
  description: {
    ar: "مع البكسل، يرسل متجرك المشتريات إلى Meta من خوادم طلبي أيضًا، فتصل حتى لو منع المتصفح البكسل. تحتاج رمز Conversions API من Events Manager.",
    en: "Alongside the Pixel, your store also sends purchases to Meta from Tallaby's servers, so they arrive even when a browser blocks the Pixel. You need a Conversions API token from Events Manager.",
  },
  highlights: [
    { ar: "مشتريات تصل حتى مع مانع الإعلانات", en: "Purchases arrive even with ad blockers" },
    { ar: "الرمز محفوظ مشفّرًا", en: "Your token is stored encrypted" },
  ],
  keywords: ["Meta", "Conversions API", "CAPI", "server events"],
  icon: { background: "#0B1F3A", foreground: "#5AA0FF", dark: true },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "connect",
  settingsRoute: "meta_capi",
  surfaces: ["server.events"],
  requires: ["meta_pixel"],
  internal: { provider: "meta_capi" },
});
