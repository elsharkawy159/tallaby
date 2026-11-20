import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "@react-email/components";
import { createElement, type ComponentType, type ReactElement } from "react";
import { describe, expect, it } from "vitest";
import * as emails from "../index.js";
import { EMAIL_SOCIAL_LINKS } from "../theme/tokens.js";

/*
 * Every email carries Tallaby's social icons in its footer (EmailShell renders
 * SocialRow). Renders each preview in `emails/` (their fixtures) plus both
 * locales of the emails that have no Arabic preview.
 */

const previewsDir = join(dirname(fileURLToPath(import.meta.url)), "../../emails");
const previewFiles = readdirSync(previewsDir).filter((file) => file.endsWith(".tsx"));

const extra: Record<string, ReactElement> = {};
for (const locale of ["ar", "en"] as const) {
  extra[`FeeTrialReminderEmail t7 ${locale}`] = createElement(emails.FeeTrialReminderEmail, { locale });
  extra[`FeeTrialReminderEmail t1 ${locale}`] = createElement(emails.FeeTrialReminderEmail, {
    locale,
    stage: "t1",
    usdLive: true,
    orderFeeEgp: "≈ 1.6 جنيه",
  });
  extra[`WelcomeEmail ${locale}`] = createElement(emails.WelcomeEmail, { locale });
  extra[`DigitalDeliveryEmail ${locale}`] = createElement(emails.DigitalDeliveryEmail, {
    locale,
    orderNumber: "ORD1",
    items: [{ productName: "Pack", downloadUrl: "https://www.tallaby.com/d", licenseKey: "KEY-1" }],
  });
}

function expectSocialRow(html: string) {
  for (const link of EMAIL_SOCIAL_LINKS) {
    expect(html).toContain(`href="${link.href}"`);
    expect(html).toContain(`src="${link.iconUrl}"`);
    expect(html).toContain(`alt="${link.label}"`);
  }
}

describe("social icons in every email footer", () => {
  it("covers every exported email component", () => {
    const sources = previewFiles.map((file) => readFileSync(join(previewsDir, file), "utf8")).join("\n");
    const exported = Object.keys(emails).filter((name) => /Email$/.test(name) && typeof (emails as Record<string, unknown>)[name] === "function");
    const covered = exported.filter((name) => sources.includes(`${name}(`) || Object.keys(extra).some((key) => key.startsWith(`${name} `)));
    expect(covered.sort()).toEqual(exported.sort());
  });

  it.each(previewFiles)("preview %s", async (file) => {
    const mod = (await import(join(previewsDir, file))) as { default: ComponentType };
    expectSocialRow(await render(createElement(mod.default)));
  });

  it.each(Object.keys(extra))("%s", async (key) => {
    const html = await render(extra[key]!);
    expectSocialRow(html);
    expect(html).toContain(key.endsWith(" ar") ? "تابع طلبي" : "Follow Tallaby");
  });

  it("store-branded mail still names and links Tallaby", async () => {
    const mod = (await import(join(previewsDir, "customer-back-in-stock.tsx"))) as { default: ComponentType };
    const html = await render(createElement(mod.default));
    expectSocialRow(html);
    expect(html).toContain("تابع طلبي");
  });
});
