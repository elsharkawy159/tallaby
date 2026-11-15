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
  it("sends the logo and banner only when Settings owns them (Website › Design does for builder sellers)", () => {
    const builder = toGeneralPatch(values, { brand: false });
    expect(builder).not.toHaveProperty("logoUrl");
    expect(builder).not.toHaveProperty("bannerUrl");

    const classic = toGeneralPatch(values, { brand: true });
    expect(classic.logoUrl).toBe("stores/logo.png");
    expect(classic).toHaveProperty("bannerUrl", "stores/banner.png");
  });

  it("clears a removed logo", () => {
    expect(toGeneralPatch({ ...values, logoUrl: "" }, { brand: true }).logoUrl).toBeNull();
  });
});
