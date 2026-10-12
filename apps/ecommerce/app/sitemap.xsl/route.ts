// XSLT 1.0 (the version browsers implement) that renders /sitemap.xml and
// /sitemaps/[n].xml as a readable table when a person opens them. Crawlers
// ignore it and read the XML as-is. Self-contained: no external CSS or JS.
export const dynamic = "force-static";

const XSL = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="en" dir="ltr">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="robots" content="noindex"/>
        <title>Sitemap | Tallaby.com</title>
        <style>
          body { margin: 0; font: 14px/1.5 system-ui, -apple-system, "Segoe UI", Tahoma, sans-serif; color: #1f2937; background: #f9fafb; }
          main { max-width: 1100px; margin: 0 auto; padding: 32px 16px; }
          h1 { margin: 0 0 4px; font-size: 26px; color: #0f4c5c; }
          p { margin: 0 0 16px; color: #6b7280; }
          a { color: #0f6d84; text-decoration: none; word-break: break-all; }
          a:hover { text-decoration: underline; }
          .count { font-weight: 600; color: #0f4c5c; }
          .wrap { overflow-x: auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px 12px; border-bottom: 1px solid #f0f1f3; text-align: left; vertical-align: top; }
          th { background: #f3f4f6; font-weight: 600; white-space: nowrap; }
          td.n { width: 40px; color: #9ca3af; text-align: right; }
          td.m { white-space: nowrap; color: #4b5563; }
          tr:hover td { background: #fafafa; }
          .alt { margin-top: 4px; font-size: 12px; }
          .tag { display: inline-block; min-width: 22px; margin-right: 6px; padding: 0 6px; border-radius: 999px; background: #e0eef2; color: #0f4c5c; font-size: 11px; text-align: center; }
        </style>
      </head>
      <body>
        <main>
          <h1>Sitemap</h1>
          <xsl:choose>
            <xsl:when test="s:sitemapindex">
              <p>This sitemap index lists <span class="count"><xsl:value-of select="count(s:sitemapindex/s:sitemap)"/></span> sitemaps.</p>
            </xsl:when>
            <xsl:otherwise>
              <p>This sitemap lists <span class="count"><xsl:value-of select="count(s:urlset/s:url)"/></span> URLs. It is meant for search engines; browse the site at <a href="/sitemap">/sitemap</a>.</p>
            </xsl:otherwise>
          </xsl:choose>
          <xsl:apply-templates select="s:sitemapindex | s:urlset"/>
        </main>
      </body>
    </html>
  </xsl:template>

  <xsl:template match="s:sitemapindex">
    <div class="wrap">
      <table>
        <thead><tr><th></th><th>Sitemap</th><th>Last modified</th></tr></thead>
        <tbody>
          <xsl:for-each select="s:sitemap">
            <tr>
              <td class="n"><xsl:value-of select="position()"/></td>
              <td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td>
              <td class="m"><xsl:value-of select="concat(substring(s:lastmod, 1, 10), ' ', substring(s:lastmod, 12, 5))"/></td>
            </tr>
          </xsl:for-each>
        </tbody>
      </table>
    </div>
  </xsl:template>

  <xsl:template match="s:urlset">
    <div class="wrap">
      <table>
        <thead>
          <tr><th></th><th>URL</th><th>Last modified</th><th>Change freq.</th><th>Priority</th></tr>
        </thead>
        <tbody>
          <xsl:for-each select="s:url">
            <tr>
              <td class="n"><xsl:value-of select="position()"/></td>
              <td>
                <a href="{s:loc}"><xsl:value-of select="s:loc"/></a>
                <xsl:for-each select="xhtml:link[@hreflang != 'x-default' and @href != current()/s:loc]">
                  <div class="alt"><span class="tag"><xsl:value-of select="@hreflang"/></span><a href="{@href}"><xsl:value-of select="@href"/></a></div>
                </xsl:for-each>
              </td>
              <td class="m"><xsl:value-of select="concat(substring(s:lastmod, 1, 10), ' ', substring(s:lastmod, 12, 5))"/></td>
              <td class="m"><xsl:value-of select="s:changefreq"/></td>
              <td class="m"><xsl:value-of select="s:priority"/></td>
            </tr>
          </xsl:for-each>
        </tbody>
      </table>
    </div>
  </xsl:template>
</xsl:stylesheet>
`;

export function GET() {
  return new Response(XSL, {
    headers: {
      // Browsers only apply a stylesheet served with an XML MIME type.
      "Content-Type": "text/xsl; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
