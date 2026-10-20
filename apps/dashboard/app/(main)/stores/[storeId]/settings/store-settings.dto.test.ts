import { describe, expect, it } from "vitest";
import { toGeneralPatch, type StoreGeneralFormValues } from "./store-settings.dto";

const values: StoreGeneralFormValues = {
  name: " Faster ",
  description: "",
  storeCategory: "",
  storeCategoryAr: "",
  logoUrl: "stores/logo.png",
  bannerUrl: "stores/banner.png",
  phone: "",
  whatsapp: "",
  email: "",
  defaultLocale: "ar",
  supportedLocales: ["ar", "en"],
  currency: "EGP",
  currencyLabel: "EGP",
};

describe("toGeneralPatch", () => {
  it("always sends the logo; the banner only when Settings owns it", () => {
    const builder = toGeneralPatch(values, { brand: false });
    expect(builder.logoUrl).toBe("stores/logo.png");
    expect(builder).not.toHaveProperty("bannerUrl");

    const classic = toGeneralPatch(values, { brand: true });
    expect(classic.logoUrl).toBe("stores/logo.png");
    expect(classic).toHaveProperty("bannerUrl", "stores/banner.png");
  });

  it("clears a removed logo", () => {
    expect(toGeneralPatch({ ...values, logoUrl: "" }, { brand: false }).logoUrl).toBeNull();
  });
});
