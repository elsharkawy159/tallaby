/**
 * XSS corpus for sanitizeCodeHtml (ROADMAP F-101, design note §4.2).
 *
 * A new vector found later is added here first.
 *
 * Each vector is fed to sanitizeCodeHtml and the output must hold nothing a
 * browser could run. The checks below are written independently of the
 * sanitizer's own final pass, so a bug in one is caught by the other.
 */
import { describe, expect, it } from "vitest";
import { sanitizeCodeHtml } from "./sanitize-code";

const NUL = String.fromCharCode(0);
const SOH = String.fromCharCode(1);
const TAB = String.fromCharCode(9);
const NL = String.fromCharCode(10);
const CR = String.fromCharCode(13);
const FF = String.fromCharCode(12);

/** [name, input]. Liquid-assembled vectors are given in their final form. */
const VECTORS: [string, string][] = [
  // --- OWASP filter evasion basics -----------------------------------------
  ["plain script", "<script>alert(1)</script>"],
  ["script src", "<SCRIPT SRC=https://xss.example/xss.js></SCRIPT>"],
  ["mixed case script", "<ScRiPt>alert(1)</sCrIpT>"],
  ["script with slash attr", '<SCRIPT/XSS SRC="https://xss.example/xss.js"></SCRIPT>'],
  ["double open bracket", '<<SCRIPT>alert("XSS");//\\<</SCRIPT>'],
  ["unclosed script src", "<SCRIPT SRC=https://xss.example/xss.js?< B >"],
  ["closing title then script", '</TITLE><SCRIPT>alert("XSS");</SCRIPT>'],
  ["img javascript src quoted", "<IMG SRC=\"javascript:alert('XSS');\">"],
  ["img javascript src unquoted", "<IMG SRC=javascript:alert('XSS')>"],
  ["img javascript mixed case", "<IMG SRC=JaVaScRiPt:alert('XSS')>"],
  ["img backtick src", "<IMG SRC=`javascript:alert(\"RSnake says, 'XSS'\")`>"],
  ["img fromCharCode", "<IMG SRC=javascript:alert(String.fromCharCode(88,83,83))>"],
  ["malformed img quotes", '<IMG """><SCRIPT>alert("XSS")</SCRIPT>">'],
  ["img hash onmouseover", "<IMG SRC=# onmouseover=\"alert('xxs')\">"],
  ["img empty src onmouseover", "<IMG SRC= onmouseover=\"alert('xxs')\">"],
  ["img no src onmouseover", "<IMG onmouseover=\"alert('xxs')\">"],
  ["img onerror fromCharCode", '<IMG SRC=/ onerror="alert(String.fromCharCode(88,83,83))"></img>'],
  ["img decimal entities", "<IMG SRC=&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;&#97;&#108;&#101;&#114;&#116;&#40;&#39;&#88;&#83;&#83;&#39;&#41;>"],
  ["img padded decimal no semicolons", "<IMG SRC=&#0000106&#0000097&#0000118&#0000097&#0000115&#0000099&#0000114&#0000105&#0000112&#0000116&#0000058&#0000097&#0000108&#0000101&#0000114&#0000116&#0000040&#0000039&#0000088&#0000083&#0000083&#0000039&#0000041>"],
  ["img hex no semicolons", "<IMG SRC=&#x6A&#x61&#x76&#x61&#x73&#x63&#x72&#x69&#x70&#x74&#x3A&#x61&#x6C&#x65&#x72&#x74&#x28&#x27&#x58&#x53&#x53&#x27&#x29>"],
  ["onerror with encoded body", '<img src=x onerror="&#0000106&#0000097&#0000118&#0000097&#0000115&#0000099&#0000114&#0000105&#0000112&#0000116&#0000058&#0000097&#0000108&#0000101&#0000114&#0000116&#0000040&#0000039&#0000088&#0000083&#0000083&#0000039&#0000041">'],
  ["tab in scheme", `<a href="jav${TAB}ascript:alert('XSS');">x</a>`],
  ["encoded tab in scheme", "<a href=\"jav&#x09;ascript:alert('XSS');\">x</a>"],
  ["encoded newline in scheme", "<a href=\"jav&#x0A;ascript:alert('XSS');\">x</a>"],
  ["encoded CR in scheme", "<a href=\"jav&#x0D;ascript:alert('XSS');\">x</a>"],
  ["raw newline in scheme", `<a href="java${NL}script:alert(1)">x</a>`],
  ["raw CR and FF in scheme", `<a href="java${CR}scr${FF}ipt:alert(1)">x</a>`],
  ["named Tab entity in scheme", '<a href="jav&Tab;ascript:alert(1)">x</a>'],
  ["null byte in scheme", `<a href="java${NUL}script:alert(1)">x</a>`],
  ["null byte in tag name", `<scr${NUL}ipt>alert(1)</scr${NUL}ipt>`],
  ["control char before scheme", `<a href="${SOH}javascript:alert(1)">x</a>`],
  ["spaces and meta chars before scheme", "<a href=\" &#14;  javascript:alert('XSS');\">x</a>"],
  ["leading spaces in href", '<a href="  javascript:alert(1)">x</a>'],
  ["single-quoted href", "<a href='javascript:alert(1)'>x</a>"],
  ["colon entity", '<a href="javascript&colon;alert(1)">x</a>'],
  ["decimal colon entity", '<a href="javascript&#58;alert(1)">x</a>'],
  ["partly encoded scheme", '<a href="javas&#99;ript:alert(1)">x</a>'],
  ["encoded first letter", '<a href="&#x6A;avascript:alert(1)">x</a>'],
  ["decimal entities no semicolons in href", '<a href="&#106&#97&#118&#97&#115&#99&#114&#105&#112&#116&#58alert(1)">x</a>'],
  ["javascript inside https", '<a href="https:javascript:alert(1)">x</a>'],
  ["vbscript", '<a href="vbscript:msgbox(1)">x</a>'],
  ["data text/html link", '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>'],
  ["unquoted onmouseover", "<a onmouseover=alert(document.cookie)>x</a>"],
  ["many handlers any case", '<img src="https://x.example/a.png" onerror="alert(1)" ONLOAD="alert(2)" OnClick="alert(3)">'],
  ["slash-separated attributes", '<img/src="x"/onerror="alert(1)">'],
  ["img src eval alt", "<img src=x:alert(alt) onerror=eval(src) alt=0>"],
  ["body onload junk name", "<BODY onload!#$%&()*~+-_.,:;?@[/|\\]^`=alert(\"XSS\")>"],
  ["details ontoggle", "<details open ontoggle=alert(1)><summary>x</summary></details>"],
  ["br size js entity", "<BR SIZE=\"&{alert('XSS')}\">"],
  ["svg onload short", "<svg/onload=alert('XSS')>"],
  ["input image", "<INPUT TYPE=\"IMAGE\" SRC=\"javascript:alert('XSS');\">"],
  ["body background", "<BODY BACKGROUND=\"javascript:alert('XSS')\">"],
  ["img dynsrc", "<IMG DYNSRC=\"javascript:alert('XSS')\">"],
  ["table background", "<TABLE BACKGROUND=\"javascript:alert('XSS')\"><tr><TD BACKGROUND=\"javascript:alert('XSS')\">x</td></tr></table>"],
  ["isindex", "<isindex type=image src=1 onerror=alert(1)>"],
  ["marquee onstart", "<marquee onstart=alert(1)>x</marquee>"],
  ["video source onerror", "<video><source onerror=alert(1)></video>"],
  ["audio onerror", "<audio src=x onerror=alert(1)>"],
  ["frameset onload", "<frameset onload=alert(1)>"],

  // --- Blocked elements ------------------------------------------------------
  ["iframe javascript", "<IFRAME SRC=\"javascript:alert('XSS');\"></IFRAME>"],
  ["iframe srcdoc", '<iframe srcdoc="<script>alert(1)</script>"></iframe>'],
  ["unclosed iframe", "<iframe src=https://xss.example/scriptlet.html <"],
  ["object scriptlet", '<OBJECT TYPE="text/x-scriptlet" DATA="https://xss.example/scriptlet.html"></OBJECT>'],
  ["embed svg data", '<EMBED SRC="data:image/svg+xml;base64,PHN2ZyB4bWxuczpzdmc9Imh0dH A6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+" type="image/svg+xml">'],
  ["applet", '<applet code="x.class"></applet>'],
  ["portal", '<portal src="https://evil.example"></portal>'],
  ["base javascript", "<BASE HREF=\"javascript:alert('XSS');//\">"],
  ["base hijack", '<base href="https://evil.example/">'],
  ["meta refresh javascript", "<META HTTP-EQUIV=\"refresh\" CONTENT=\"0;url=javascript:alert('XSS');\">"],
  ["meta refresh data", '<META HTTP-EQUIV="refresh" CONTENT="0;url=data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4K">'],
  ["link stylesheet javascript", "<LINK REL=\"stylesheet\" HREF=\"javascript:alert('XSS');\">"],
  ["link import", '<link rel=import href="https://evil.example/x.html">'],
  ["form phishing", '<form action="https://evil.example"><input name=password type=password><button>Log in</button></form>'],
  ["button formaction", '<button formaction="javascript:alert(1)">x</button>'],
  ["style tag list-style", "<STYLE>li {list-style-image: url(\"javascript:alert('XSS')\");}</STYLE><UL><LI>XSS</br>"],
  ["style import", "<style>@import 'https://evil.example/x.css';</style>"],

  // --- Inline style -----------------------------------------------------------
  ["style url javascript", "<div style=\"background:url(javascript:alert(1))\">x</div>"],
  ["style background-image javascript", "<DIV STYLE=\"background-image: url(javascript:alert('XSS'))\">x</DIV>"],
  ["style css escapes", "<DIV STYLE=\"background-image:\\0075\\0072\\006C\\0028'\\006a\\0061\\0076\\0061\\0073\\0063\\0072\\0069\\0070\\0074\\003a\\0061\\006c\\0065\\0072\\0074\\0028\\0027\\0058\\0027\\0029'\\0029\">x</DIV>"],
  ["style expression", "<div style=\"x:expression(alert(1))\">x</div>"],
  ["style expression with comment", "<IMG STYLE=\"xss:expr/*XSS*/ession(alert('XSS'))\">"],
  ["style width expression", "<DIV STYLE=\"width: expression(alert('XSS'));\">x</DIV>"],
  ["style behavior", '<div style="behavior: url(x.htc)">x</div>'],
  ["style moz-binding", '<div style="-moz-binding: url(https://evil.example/x.xml#xss)">x</div>'],
  ["style quote breakout", "<div style=\"color:red;\\\" onmouseover=alert(1)\">x</div>"],

  // --- srcset and picture -----------------------------------------------------
  ["srcset javascript candidate", '<img srcset="https://ok.example/a.png 1x, javascript:alert(1) 2x" alt="a">'],
  ["source srcset javascript", '<picture><source srcset="javascript:alert(1)"><img src="https://ok.example/a.png" alt=""></picture>'],
  ["srcset data candidate", '<img srcset="data:text/html,<script>alert(1)</script> 1x">'],

  // --- Mutation XSS -------------------------------------------------------------
  ["noscript title breakout", '<noscript><p title="</noscript><img src=x onerror=alert(1)>">'],
  ["svg style img", "<svg><style><img src=x onerror=alert(1)></style></svg>"],
  ["svg p style", '<svg></p><style><a id="</style><img src=1 onerror=alert(1)>">'],
  ["math mglyph style", "<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>"],
  ["math mglyph comment", '<math><mtext><table><mglyph><style><!--</style><img title="--&gt;&lt;/mglyph&gt;&lt;img&Tab;src=1&Tab;onerror=alert(1)&gt;">'],
  ["nested form math", "<form><math><mtext></form><form><mglyph><style></math><img src onerror=alert(1)>"],
  ["textarea img", "<textarea><img src=x onerror=alert(1)></textarea>"],
  ["svg textarea img", "<svg><textarea><img src=x onerror=alert(1)></textarea></svg>"],
  ["textarea solidus close", "<textarea></textarea/><img src=x onerror=alert(1)>"],
  ["xmp img", "<xmp><img src=x onerror=alert(1)></xmp>"],
  ["noembed breakout", '<noembed><img title="</noembed><img src onerror=alert(1)>"></noembed>'],
  ["noframes breakout", '<noframes><img title="</noframes><img src onerror=alert(1)>"></noframes>'],
  ["plaintext", "<plaintext><img src=x onerror=alert(1)>"],
  ["template", "<template><img src=x onerror=alert(1)></template>"],
  ["select option", "<select><option><img src=x onerror=alert(1)></option></select>"],
  ["title img", "<title><img src=x onerror=alert(1)></title>"],
  ["svg title img", "<svg><title><img src=x onerror=alert(1)></title></svg>"],
  ["svg cdata", "<svg><![CDATA[><img src=x onerror=alert(1)>]]></svg>"],
  ["cdata script", "<![CDATA[<script>alert(1)</script>]]>"],
  ["short comment", "<!--><img src=x onerror=alert(1)>-->"],
  ["bang comment close", "<!-- --!><img src=x onerror=alert(1)> -->"],
  ["conditional comment", "<!--[if gte IE 4]><SCRIPT>alert('XSS');</SCRIPT><![endif]-->"],
  ["processing instruction", '<?xml version="1.0"?><img src=x onerror=alert(1)>'],
  ["attribute holds closing tags", '<p title="</style></title><img src=x onerror=alert(1)>">x</p>'],

  // --- SVG tricks ----------------------------------------------------------------
  ["svg onload", '<svg onload=alert(1)><path d="M0 0"/></svg>'],
  ["svg a xlink href", '<svg><a xlink:href="javascript:alert(1)"><rect width="10" height="10"/></a></svg>'],
  ["svg a href", '<svg><a href="javascript:alert(1)"><text>x</text></a></svg>'],
  ["svg use data", '<svg><use href="data:image/svg+xml;base64,PHN2ZyBpZD0neCcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48aW1hZ2UgaHJlZj0nMScgb25lcnJvcj0nYWxlcnQoMSknLz48L3N2Zz4=#x"/></svg>'],
  ["svg use external", '<svg><use xlink:href="https://evil.example/x.svg#a"/></svg>'],
  ["svg animate href", "<svg><a><animate attributeName=href values=javascript:alert(1) /><text x=20 y=20>Click</text></a></svg>"],
  ["svg animate values list", '<svg><a href="#"><animate attributeName="href" values="#safe;javascript:alert(1)" /><text>x</text></a></svg>'],
  ["svg set handler", '<svg><set attributeName="onmouseover" to="alert(1)"/></svg>'],
  ["svg foreignObject iframe", '<svg><foreignObject><iframe src="javascript:alert(1)"></iframe></foreignObject></svg>'],
  ["svg foreignObject body", "<svg><foreignObject><body onload=alert(1)><img src=x onerror=alert(1)></body></foreignObject></svg>"],
  ["svg script", "<svg><script>alert(1)</script></svg>"],
  ["svg script mixed case", "<svg><Script>alert(1)</Script></svg>"],
  ["svg script xlink", '<svg><script xlink:href="data:,alert(1)"/></svg>'],
  ["svg image", '<svg><image href="javascript:alert(1)"/></svg>'],
  ["svg external paint", '<svg><rect fill="url(https://evil.example/x.svg#p)" width="1" height="1" /></svg>'],
  ["svg style paint javascript", '<svg><g style="fill:url(javascript:alert(1))"></g></svg>'],
  ["svg handler on path", '<svg><path d="M0 0" onclick="alert(1)" onmouseover="alert(2)"/></svg>'],

  // --- Liquid-assembled (final form after conditions) ------------------------------
  ["assembled script tag", "<scr" + "ipt>alert(1)</scr" + "ipt>"],
  ["assembled onerror", "<img src=x on" + "error=alert(1)>"],
  ["assembled javascript href", '<a hr' + 'ef="java' + 'script:alert(1)">x</a>'],
  ["assembled style url", '<div ' + 'style="background:url(java' + 'script:alert(1))">x</div>'],
  ["assembled iframe", "<if" + "rame src=javascript:alert(1)>"],
  ["assembled attribute breakout", '<a title="x' + '"><script>alert(1)</script>">y</a>'],

  // --- Broken markup a browser would fix up ------------------------------------------
  ["unterminated img", '<img src="x" onerror="alert(1)"'],
  ["img trailing slashes", "<img src=x onerror=alert(1)//"],
  ["tag in attribute position", '<a href="javascript:alert(1)"<b>x</b>'],
  ["div glued to script", "<div<script>alert(1)</script>"],
  ["img then tag", "<img src=x onerror=alert(1) <b>"],
  ["stray close then script", "<p>a</p></script><script>alert(1)</script>"],
  ["attribute breakout text", '"><script>alert(1)</script>'],
  ["half-open img backtick", "<IMG SRC=\"`<javascript:alert>`('XSS')\""],
  ["data attribute javascript", '<div data-x="javascript:alert(1)" data-y=" JaVaScRiPt:alert(1)">x</div>'],
  ["unclosed comment", "<p>ok</p><!-- <script>alert(1)</script>"],
];

// --- Independent output checks ---------------------------------------------------------

const ALLOWED = new Set(
  (
    "div section article header footer aside nav main span p a h1 h2 h3 h4 h5 h6 ul ol li dl dt dd strong em b i u s small mark br hr " +
    "blockquote figure figcaption picture source img table thead tbody tfoot tr th td caption details summary time sup sub abbr cite code pre q " +
    "svg g path circle ellipse rect line polyline polygon defs lineargradient radialgradient stop title"
  ).split(" "),
);

const FORBIDDEN_SUBSTRINGS = [
  "<script", "<iframe", "<object", "<embed", "<base", "<meta", "<form", "<svg><script", "<style", "</style",
  "<link", "<frame", "<applet", "<portal", "<input", "<button", "<textarea", "<select", "<noscript", "<template",
  "<math", "<use", "<foreignobject", "<animate", "<set", "<image", "<!--", "<![cdata[",
  "javascript:", "vbscript:", "data:text/html", "srcdoc", "formaction", "xlink:href",
];

const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^<>]*)>/g;
const ATTR = /\s([^\s"'=<>/]+)(?:="([^"]*)")?/g;

function decode(s: string): string {
  return s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

/** What a browser would see once it drops whitespace and control characters. */
function compact(s: string): string {
  return s.replace(/[\x00-\x20\x7f-\xa0]/g, "").toLowerCase();
}

function assertNoExecutable(out: string) {
  const lower = out.toLowerCase();
  for (const needle of FORBIDDEN_SUBSTRINGS) {
    expect(lower, `contains ${needle}`).not.toContain(needle);
  }
  // Tag markup only (text is escaped, so it holds no tag).
  const textOnly = out.replace(TAG, (_m, _close: string, name: string, attrs: string) => {
    expect(ALLOWED.has(name.toLowerCase()), `tag <${name}>`).toBe(true);
    expect(/\son[a-z]+\s*=/i.test(attrs), `handler in <${name}${attrs}>`).toBe(false);
    for (const [, attrName = "", rawValue = ""] of attrs.matchAll(ATTR)) {
      const value = compact(decode(rawValue));
      expect(attrName.toLowerCase().startsWith("on"), `attribute ${attrName}`).toBe(false);
      expect(["srcdoc", "formaction", "action", "background", "dynsrc", "lowsrc", "xlink:href", "content", "http-equiv"]).not.toContain(attrName.toLowerCase());
      if (attrName === "href" && !(rawValue.startsWith("#") || rawValue.startsWith("/"))) {
        expect(/^(?:https?|mailto|tel):/.test(value), `href ${rawValue}`).toBe(true);
      }
      expect(/javascript:|vbscript:|data:/.test(value), `value ${rawValue}`).toBe(false);
      expect(value.includes("<"), `markup in ${attrName}`).toBe(false);
      expect(/expression\(|url\((?!#c-|https:|\/[^/])/i.test(value), `style ${rawValue}`).toBe(false);
    }
    return "";
  });
  expect(textOnly.includes("<"), "unescaped < in text").toBe(false);
  expect(textOnly.includes(">"), "unescaped > in text").toBe(false);
  // A browser decodes the text, but decoded text is never parsed as markup;
  // still, no scheme should survive even as text.
  expect(compact(decode(textOnly))).not.toMatch(/javascript:|vbscript:/);
}

describe("XSS corpus", () => {
  it("has at least 60 vectors with unique names", () => {
    expect(VECTORS.length).toBeGreaterThanOrEqual(60);
    expect(new Set(VECTORS.map(([name]) => name)).size).toBe(VECTORS.length);
  });

  it.each(VECTORS)("%s", (_name, input) => {
    const out = sanitizeCodeHtml(input, { nodeId: "xss" });
    assertNoExecutable(out);
    // Cleaning is stable: cleaning the output again changes nothing.
    expect(sanitizeCodeHtml(out, { nodeId: "xss" }).replace(/c-xss-c-xss-/g, "c-xss-")).toBe(out);
  });
});
