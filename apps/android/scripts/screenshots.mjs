/**
 * Google Play phone screenshots of the seller dashboard (ROADMAP.md F-82, GP-09).
 *
 * Signs in with the DEMO seller account (never a real seller) and saves
 * 1080×1920 PNGs (360×640 CSS px at 3x) of the main screens, in Arabic and
 * English, to ./screenshots/<locale>/.
 *
 * Run from any folder that has Playwright installed:
 *
 *   mkdir -p /tmp/shots && cd /tmp/shots && npm i playwright && npx playwright install chromium
 *   DEMO_EMAIL=demo@… DEMO_PASSWORD=… node /path/to/repo/apps/android/scripts/screenshots.mjs
 *
 * Optional: BASE_URL (default https://dashboard.tallaby.com), LOCALES (default "ar,en"),
 * OUT_DIR (default ./screenshots). The password is read from the environment only
 * and never printed.
 */
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

// Resolve Playwright from the current folder, so the repo needs no new dependency.
const require = createRequire(path.join(process.cwd(), "noop.js"));
const { chromium } = require("playwright");

const BASE_URL = (process.env.BASE_URL ?? "https://dashboard.tallaby.com").replace(/\/$/, "");
const LOCALES = (process.env.LOCALES ?? "ar,en").split(",").map((l) => l.trim()).filter(Boolean);
const OUT_DIR = path.resolve(process.env.OUT_DIR ?? "screenshots");
const EMAIL = process.env.DEMO_EMAIL;
const PASSWORD = process.env.DEMO_PASSWORD;

/** Screens for the listing, in the order Play shows them. `store:` paths need the demo store id. */
const SCREENS = [
  { name: "01-home", path: "/" },
  { name: "02-orders", path: "/orders" },
  { name: "03-products", path: "/products" },
  { name: "04-reports", path: "/reports" },
  { name: "05-wallet", path: "/wallet" },
  { name: "06-stores", path: "/stores" },
  { name: "07-settings", path: "/settings" },
];

if (!EMAIL || !PASSWORD) {
  console.error("Set DEMO_EMAIL and DEMO_PASSWORD (the demo seller account, not a real seller).");
  process.exit(1);
}

const browser = await chromium.launch();
try {
  for (const locale of LOCALES) {
    const context = await browser.newContext({
      viewport: { width: 360, height: 640 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      locale: locale === "ar" ? "ar-EG" : "en-US",
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
    });
    // The dashboard's language comes from this cookie (apps/dashboard/i18n/config.ts).
    await context.addCookies([{ name: "locale", value: locale, url: BASE_URL }]);
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
    // The sign-in form is the one with the password field.
    const form = page.locator("form:has(input[type=password])");
    await form.locator("input[type=email]").fill(EMAIL);
    await form.locator("input[type=password]").fill(PASSWORD);
    await Promise.all([
      page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 30_000 }),
      form.locator("button[type=submit]").click(),
    ]);

    const dir = path.join(OUT_DIR, locale);
    await mkdir(dir, { recursive: true });
    for (const screen of SCREENS) {
      await page.goto(`${BASE_URL}${screen.path}`, { waitUntil: "networkidle" });
      // Let skeletons and fonts settle; hide toasts and the cookie/heard-about-us pop-ups if they show.
      await page.waitForTimeout(1500);
      await page.keyboard.press("Escape").catch(() => undefined);
      const file = path.join(dir, `${screen.name}.png`);
      await page.screenshot({ path: file });
      console.log("saved", path.relative(process.cwd(), file));
    }
    await context.close();
  }
} finally {
  await browser.close();
}
