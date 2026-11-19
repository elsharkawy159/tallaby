import { describe, expect, it } from "vitest";
import { sitemapStylesheet, xmlText } from "./sitemap-xsl.lib";

describe("sitemapStylesheet", () => {
  it("keeps Tallaby's name on tallaby.com", () => {
    const xsl = sitemapStylesheet(null);
    expect(xsl).toContain("<title>Sitemap — طلبي</title>");
    expect(xsl).toContain('<h1>Sitemap — <span lang="ar" dir="rtl">طلبي</span></h1>');
  });

  it("names the store on a store host, escaped", () => {
    const xsl = sitemapStylesheet(`Sara's <b>Bags</b> & co`);
    expect(xsl).toContain("<title>Sitemap — Sara&apos;s &lt;b&gt;Bags&lt;/b&gt; &amp; co</title>");
    expect(xsl).toContain("<h1>Sitemap — <bdi>Sara&apos;s &lt;b&gt;Bags&lt;/b&gt; &amp; co</bdi></h1>");
    expect(xsl).not.toContain("طلبي</title>");
    expect(sitemapStylesheet("  ")).toContain("<title>Sitemap — طلبي</title>");
  });

  it("drops characters XML can't hold", () => {
    expect(xmlText("a\u0001b\tc")).toBe("ab\tc");
  });
});
