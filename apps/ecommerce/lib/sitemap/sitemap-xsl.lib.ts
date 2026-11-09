// XSLT 1.0 (the version browsers implement) that renders /sitemap.xml and
// /sitemaps/[n].xml (tallaby.com and store hosts) as a readable page when a
// person opens them. Crawlers ignore it and read the XML as-is.
// Self-contained: no external fonts, CSS or JS. URLs are grouped by section
// with contains() on <loc>; anything unmatched is listed under "Pages".
// The page title names the site: "طلبي" on tallaby.com, the store's name on a
// store host (2026-11-09).

/** Text safe inside an XML (XSL) text node: no markup, no entity, no XSLT value template. */
export function xmlText(value: string): string {
  // Control characters are not allowed in XML 1.0.
  return Array.from(value)
    .filter((c) => { const n = c.codePointAt(0) ?? 0; return n >= 0x20 || n === 0x09 || n === 0x0a || n === 0x0d; })
    .join("")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .slice(0, 400);
}

export const SITEMAP_XSL_HEADERS = {
  // Browsers only apply a stylesheet served with an XML MIME type.
  "Content-Type": "text/xsl; charset=utf-8",
} as const;

/** An XPath test: does <loc> contain any of these? */
const has = (...parts: string[]) => parts.map((p) => `contains(s:loc, '${p}')`).join(" or ");

const amp = (s: string) => s.replace(/&/g, "&amp;");

const GROUPS = [
  { id: "templates", title: "Templates", ar: "القوالب", test: has("/templates/") },
  { id: "blog", title: "Blog", ar: "المدونة", test: has("/blog/") },
  {
    id: "solutions",
    title: "Solutions, industries, features & tools",
    ar: "الحلول والمجالات والمميزات والأدوات",
    test: has("/solutions/", "/industries/", "/features/", "/tools/", "/integrations/", "/compare/"),
  },
  // Store hosts: category landings are /products?category=, products /products/{slug}.
  { id: "categories", title: "Categories", ar: "الأقسام", test: has("?category=", "/categories/") },
  { id: "products", title: "Products", ar: "المنتجات", test: has("/products/") },
];
const OTHER = `not(${GROUPS.map((g) => `(${g.test})`).join(" or ")})`;
const SECTIONS = [{ id: "pages", title: "Pages", ar: "الصفحات", test: OTHER }, ...GROUPS];

const NAV = SECTIONS.map(
  (g) =>
    `<xsl:if test="$urls[${g.test}]"><a href="#${g.id}">${amp(g.title)} <span class="c"><xsl:value-of select="count($urls[${g.test}])"/></span></a></xsl:if>`,
).join("\n                  ");

const GROUP_CALLS = SECTIONS.map(
  (g) => `
              <xsl:call-template name="group">
                <xsl:with-param name="id" select="'${g.id}'"/>
                <xsl:with-param name="title" select="'${amp(g.title)}'"/>
                <xsl:with-param name="ar" select="'${g.ar}'"/>
                <xsl:with-param name="urls" select="$urls[${g.test}]"/>
              </xsl:call-template>`,
).join("");

export function sitemapStylesheet(siteName?: string | null): string {
  const name = siteName?.trim() ? xmlText(siteName.trim()) : null;
  // tallaby.com keeps its Arabic brand name; a store host shows the store's own name.
  const title = name ? `Sitemap — ${name}` : "Sitemap — طلبي";
  const heading = name ? `Sitemap — <bdi>${name}</bdi>` : `Sitemap — <span lang="ar" dir="rtl">طلبي</span>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:variable name="urls" select="/s:urlset/s:url"/>
  <xsl:variable name="first" select="(/s:urlset/s:url/s:loc | /s:sitemapindex/s:sitemap/s:loc)[1]"/>
  <xsl:variable name="host" select="substring-before(concat(substring-after($first, '://'), '/'), '/')"/>

  <xsl:template match="/">
    <html lang="en" dir="ltr">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="robots" content="noindex"/>
        <title>${title}</title>
        <style>
          :root { --brand: #0d3743; --brand-2: #145163; --tint: #e6f0f2; --line: #e3e8ea; --muted: #5f6b70; color-scheme: light; }
          * { box-sizing: border-box; }
          body { margin: 0; font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Tahoma, Arial, sans-serif; color: #1c2427; background: #f5f8f9; }
          header { background: var(--brand); color: #fff; }
          .in { max-width: 1040px; margin: 0 auto; padding: 0 16px; }
          header .in { padding-top: 28px; padding-bottom: 24px; }
          h1 { margin: 0; font-size: 26px; line-height: 1.25; }
          .sub { margin: 6px 0 0; color: #c9dde2; font-size: 14px; }
          .sub b { color: #fff; }
          nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
          nav a { color: #fff; background: var(--brand-2); border-radius: 999px; padding: 4px 12px; font-size: 13px; text-decoration: none; }
          nav a:hover { background: #1b6a80; }
          nav .c { opacity: .75; }
          main { padding-top: 24px; padding-bottom: 48px; }
          section { margin-bottom: 28px; scroll-margin-top: 12px; }
          h2 { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 10px; margin: 0 0 10px; font-size: 18px; color: var(--brand); }
          h2 .ar { font-weight: 500; color: var(--brand-2); font-size: 16px; }
          h2 .n { font-size: 13px; font-weight: 600; color: var(--brand-2); background: var(--tint); border-radius: 999px; padding: 1px 9px; }
          .card { background: #fff; border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px 14px; text-align: left; vertical-align: top; border-bottom: 1px solid var(--line); }
          tr:last-child td { border-bottom: 0; }
          th { background: var(--tint); color: var(--brand); font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
          th.d, td.d { width: 150px; white-space: nowrap; color: var(--muted); font-size: 13px; }
          a { color: var(--brand-2); }
          a.u { font-weight: 500; text-decoration: none; overflow-wrap: anywhere; }
          a.u:hover { text-decoration: underline; }
          .alt { display: flex; flex-wrap: wrap; gap: 6px 12px; margin-top: 6px; }
          .alt a { display: inline-flex; gap: 6px; align-items: baseline; max-width: 100%; font-size: 12px; color: var(--muted); text-decoration: none; overflow-wrap: anywhere; }
          .alt a:hover { color: var(--brand-2); text-decoration: underline; }
          .tag { flex: none; padding: 0 7px; border-radius: 999px; background: var(--tint); color: var(--brand); font-weight: 600; font-size: 11px; }
          bdi { unicode-bidi: isolate; }
          footer { color: var(--muted); font-size: 13px; }
          @media (max-width: 640px) {
            h1 { font-size: 22px; }
            thead { display: none; }
            tr, td { display: block; }
            tr { padding: 10px 14px; border-bottom: 1px solid var(--line); }
            tr:last-child { border-bottom: 0; }
            td, tr:last-child td { padding: 0; border: 0; }
            td.d { width: auto; margin-top: 4px; }
          }
        </style>
      </head>
      <body>
        <header>
          <div class="in">
            <h1>${heading}</h1>
            <xsl:choose>
              <xsl:when test="s:sitemapindex">
                <p class="sub"><b><xsl:value-of select="count(s:sitemapindex/s:sitemap)"/></b> sitemaps · <bdi dir="ltr"><xsl:value-of select="$host"/></bdi></p>
              </xsl:when>
              <xsl:otherwise>
                <p class="sub"><b><xsl:value-of select="count($urls)"/></b> URLs · <bdi dir="ltr"><xsl:value-of select="$host"/></bdi></p>
                <nav>
                  ${NAV}
                </nav>
              </xsl:otherwise>
            </xsl:choose>
          </div>
        </header>
        <main class="in">
          <xsl:choose>
            <xsl:when test="s:sitemapindex"><xsl:apply-templates select="s:sitemapindex"/></xsl:when>
            <xsl:otherwise>${GROUP_CALLS}
            </xsl:otherwise>
          </xsl:choose>
          <footer>This file is for search engines. Each link opens the page.</footer>
        </main>
      </body>
    </html>
  </xsl:template>

  <xsl:template name="date">
    <xsl:param name="value"/>
    <xsl:value-of select="substring($value, 1, 10)"/>
    <xsl:if test="string-length($value) &gt; 10"><xsl:value-of select="concat(' ', substring($value, 12, 5))"/></xsl:if>
  </xsl:template>

  <xsl:template name="group">
    <xsl:param name="id"/>
    <xsl:param name="title"/>
    <xsl:param name="ar"/>
    <xsl:param name="urls"/>
    <xsl:if test="$urls">
      <section id="{$id}">
        <h2><xsl:value-of select="$title"/> <span class="ar" lang="ar" dir="rtl"><xsl:value-of select="$ar"/></span> <span class="n"><xsl:value-of select="count($urls)"/></span></h2>
        <div class="card">
          <table>
            <thead><tr><th>URL</th><th class="d">Last modified</th></tr></thead>
            <tbody>
              <xsl:for-each select="$urls">
                <tr>
                  <td>
                    <a class="u" href="{s:loc}"><bdi dir="ltr"><xsl:value-of select="s:loc"/></bdi></a>
                    <xsl:if test="xhtml:link[@hreflang != 'x-default' and @href != current()/s:loc]">
                      <div class="alt">
                        <xsl:for-each select="xhtml:link[@hreflang != 'x-default' and @href != current()/s:loc]">
                          <a href="{@href}" hreflang="{@hreflang}"><span class="tag"><xsl:value-of select="@hreflang"/></span><bdi dir="ltr"><xsl:value-of select="@href"/></bdi></a>
                        </xsl:for-each>
                      </div>
                    </xsl:if>
                  </td>
                  <td class="d"><xsl:call-template name="date"><xsl:with-param name="value" select="s:lastmod"/></xsl:call-template></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>
      </section>
    </xsl:if>
  </xsl:template>

  <xsl:template match="s:sitemapindex">
    <section>
      <div class="card">
        <table>
          <thead><tr><th>Sitemap</th><th class="d">Last modified</th></tr></thead>
          <tbody>
            <xsl:for-each select="s:sitemap">
              <tr>
                <td><a class="u" href="{s:loc}"><bdi dir="ltr"><xsl:value-of select="s:loc"/></bdi></a></td>
                <td class="d"><xsl:call-template name="date"><xsl:with-param name="value" select="s:lastmod"/></xsl:call-template></td>
              </tr>
            </xsl:for-each>
          </tbody>
        </table>
      </div>
    </section>
  </xsl:template>
</xsl:stylesheet>
`;

}
