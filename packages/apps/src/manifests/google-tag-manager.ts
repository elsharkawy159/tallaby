import { defineApp } from "../manifest";

/** D18: GTM runs whatever tags the seller configures, so its settings warn before connecting. */
export default defineApp({
  id: "google_tag_manager",
  slug: "google-tag-manager",
  kind: "integration",
  category: "tracking",
  mechanism: "script",
  name: { ar: "Google Tag Manager", en: "Google Tag Manager" },
  vendor: { ar: "Google", en: "Google" },
  summary: {
    ar: "أدِر وسومك الخاصة من حاوية GTM واحدة.",
    en: "Manage your own tags from one GTM container.",
  },
  description: {
    ar: "الصق معرّف الحاوية (GTM-…) وأدِر وسوم التتبع التي تريدها من Google Tag Manager. الوسوم التي تضيفها هناك تعمل على متجرك، فأضف فقط ما تثق به.",
    en: "Paste your container ID (GTM-…) and manage the tracking tags you want from Google Tag Manager. Tags you add there run on your store, so only add ones you trust.",
  },
  highlights: [{ ar: "وسومك كلها من مكان واحد", en: "All your tags in one place" }],
  keywords: ["Google Tag Manager", "GTM", "tags"],
  icon: { background: "#246FDB", foreground: "#FFFFFF" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "connect",
  settingsRoute: "identifier",
  surfaces: ["storefront.script"],
  internal: { provider: "google_tag_manager" },
});
