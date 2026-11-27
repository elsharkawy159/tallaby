import { describe, expect, it } from "vitest";
import {
  acceptLanguageLocale,
  downloadHeaders,
  escapeHtml,
  formatFileSize,
  pickDownloadLocale,
  renderErrorPage,
  renderLandingPage,
  renderReadyPage,
  renderUnavailablePage,
  shouldRedirectToFile,
} from "./download-page.lib";
import { DOWNLOAD_PAGE_MESSAGES } from "./download-page.messages";

const TOKEN = "c".repeat(64);

describe("download page language", () => {
  it("prefers ?lang=, then the buyer, then the browser, else Arabic", () => {
    expect(pickDownloadLocale({ lang: "en", buyerLanguage: "ar", acceptLanguage: "ar" })).toBe("en");
    expect(pickDownloadLocale({ lang: "fr", buyerLanguage: "en" })).toBe("en");
    expect(pickDownloadLocale({ buyerLanguage: null, acceptLanguage: "en-US,en;q=0.9" })).toBe("en");
    expect(pickDownloadLocale({ acceptLanguage: "fr-FR,fr;q=0.9" })).toBe("ar");
    expect(pickDownloadLocale({})).toBe("ar");
    expect(pickDownloadLocale({ lang: "AR" })).toBe("ar");
  });

  it("reads Accept-Language by quality", () => {
    expect(acceptLanguageLocale("fr;q=1, en;q=0.5, ar;q=0.8")).toBe("ar");
    expect(acceptLanguageLocale("ar-EG,en;q=0.9")).toBe("ar");
    expect(acceptLanguageLocale("en;q=0, ar;q=0")).toBeNull();
    expect(acceptLanguageLocale(null)).toBeNull();
  });
});

describe("download page HTML", () => {
  it("escapes everything", () => {
    expect(escapeHtml(`<a href="x" onclick='y'>&</a>`)).toBe("&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;");
    const html = renderLandingPage({
      locale: "en",
      token: TOKEN,
      productName: "<script>alert(1)</script>",
      storeName: `"><img src=x onerror=alert(1)>`,
      files: [{ name: "<b>guide</b>.pdf", size: 2_516_582 }],
    });
    expect(html).not.toContain("<script>alert");
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<b>guide");
    expect(html).toContain("2.4 MB");
  });

  it("is noindex and no-referrer in the page too, RTL in Arabic", () => {
    const ar = renderLandingPage({ locale: "ar", token: TOKEN, productName: "دليل", storeName: null, files: [] });
    expect(ar).toContain('<html lang="ar" dir="rtl">');
    expect(ar).toContain('<meta name="robots" content="noindex,nofollow,noarchive">');
    expect(ar).toContain('<meta name="referrer" content="no-referrer">');
    expect(ar).toContain("طلبي");
    expect(renderUnavailablePage("en")).toContain('dir="ltr"');
  });

  it("has one button that POSTs back to the same link, keeping the language", () => {
    const html = renderLandingPage({ locale: "en", token: TOKEN, productName: "Pack", storeName: "Sara", files: [{ name: "a.zip", size: 10 }] });
    expect(html).toContain(`<form method="post" action="/d/${TOKEN}?lang=en"`);
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain("From Sara");
    expect(html).not.toContain("http");
  });

  it("lists the signed links after the download, and only safe external links", () => {
    const html = renderReadyPage({
      locale: "en",
      productName: "Pack",
      files: [
        { name: "a.pdf", url: "https://s.example/a?token=1&download=a.pdf", size: 1000 },
        { name: "b.pdf", url: "https://s.example/b", size: null },
      ],
      licenseKey: "KEY-1",
      externalUrl: "javascript:alert(1)",
      accessInstructions: "Line <1>",
      linkMinutes: 15,
    });
    expect(html).toContain('href="https://s.example/a?token=1&amp;download=a.pdf"');
    expect(html).toContain("KEY-1");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("Line &lt;1&gt;");
    expect(html).toContain("15 minutes");
  });

  it("shows one page for every link that can't be used, and a retry page for storage errors", () => {
    expect(renderUnavailablePage("ar")).toContain(DOWNLOAD_PAGE_MESSAGES.ar.unavailableHeading);
    expect(renderErrorPage("en")).toContain(escapeHtml(DOWNLOAD_PAGE_MESSAGES.en.errorHeading));
  });

  it("redirects straight to the file only when there is one file and nothing else", () => {
    const one = { files: [1], licenseKey: null, externalUrl: null, accessInstructions: null };
    expect(shouldRedirectToFile(one)).toBe(true);
    expect(shouldRedirectToFile({ ...one, files: [1, 2] })).toBe(false);
    expect(shouldRedirectToFile({ ...one, licenseKey: "K" })).toBe(false);
    expect(shouldRedirectToFile({ ...one, accessInstructions: "x" })).toBe(false);
  });

  it("formats sizes and sends the no-index headers", () => {
    expect(formatFileSize(512, "en")).toBe("512 B");
    expect(formatFileSize(1536, "ar")).toBe("1.5 KB");
    expect(formatFileSize(null, "en")).toBe("");
    expect(downloadHeaders()).toMatchObject({
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Cache-Control": "no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
      "Content-Type": "text/html; charset=utf-8",
    });
    expect(downloadHeaders(null)).not.toHaveProperty("Content-Type");
  });

  it("has the same keys in both languages", () => {
    expect(Object.keys(DOWNLOAD_PAGE_MESSAGES.ar).sort()).toEqual(Object.keys(DOWNLOAD_PAGE_MESSAGES.en).sort());
  });
});
