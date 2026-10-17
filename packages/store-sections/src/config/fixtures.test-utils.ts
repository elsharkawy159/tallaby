/** Test fixtures only. Not exported from the package. */

export function classicTemplateFixture() {
  return {
    schemaVersion: 1,
    designSystem: {
      colors: { primary: "#0a5c4f", background: "#ffffff", foreground: "#0a0908" },
      typography: { headingFont: "Cairo", bodyFont: "Cairo", baseFontSize: 16 },
      spacing: { containerMaxWidth: 1200, sectionPaddingY: 64, borderRadius: 12 },
    },
    header: { id: "hdr", sectionId: "classic-header", version: 1, props: { showSearch: true } },
    footer: { id: "ftr", sectionId: "classic-footer", version: 1, props: {} },
    settings: { defaultLocale: "ar", locales: ["ar", "en"] },
    pages: [
      {
        slug: "home",
        isHome: true,
        name: "الرئيسية",
        seo: { title: "متجري", description: "أفضل المنتجات" },
        content: {
          sections: [
            {
              id: "s1",
              sectionId: "classic-hero",
              version: 1,
              props: { title: "مرحبا", subtitle: "<p>تسوق <strong>الآن</strong></p>" },
              translations: { en: { title: "Welcome" } },
            },
            { id: "s2", sectionId: "classic-categories", version: 1, props: {} },
            { id: "s3", sectionId: "classic-catalog", version: 1, props: { pageSize: 24 } },
          ],
        },
      },
    ],
  };
}

export function withHomeSections(sections: unknown[]) {
  const config = classicTemplateFixture();
  (config.pages[0]!.content as { sections: unknown[] }).sections = sections;
  return config;
}
