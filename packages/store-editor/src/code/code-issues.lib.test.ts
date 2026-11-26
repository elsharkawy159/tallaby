import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import { CODE_ISSUE_CODES, CODE_ISSUE_REASONS } from "@workspace/store-sections/code-issues";
import { codeNodeFromFile } from "@workspace/store-sections/code-server";
import ar from "../messages/ar.json";
import en from "../messages/en.json";
import { codeIssueLine, codeIssueText, type CodeIssueTranslator } from "./code-issues.lib";

const LOCALES = { ar, en } as const;
const translator = (locale: "ar" | "en") =>
  createTranslator({ locale, messages: LOCALES[locale], namespace: "storeEditor.code", timeZone: "Africa/Cairo" }) as unknown as CodeIssueTranslator;

/** A value for every placeholder the core fills. */
const PARAMS = { tag: "form", filter: "evil", ms: 50, kb: 64, at: "import", property: "color", selector: ".a", name: "spin", pseudo: "::part" };

describe("code issue messages", () => {
  for (const locale of ["ar", "en"] as const) {
    const code = LOCALES[locale].storeEditor.code as unknown as { issues: Record<string, string>; issueReasons: Record<string, string>; issueUnknown: string };

    it(`${locale}.json has a string for every issue code and reason the core gives`, () => {
      for (const c of CODE_ISSUE_CODES) expect(code.issues[c], `${locale} issues.${c}`).toEqual(expect.any(String));
      for (const r of CODE_ISSUE_REASONS) expect(code.issueReasons[r], `${locale} issueReasons.${r}`).toEqual(expect.any(String));
      // No stray keys: every string belongs to a code or reason.
      expect(Object.keys(code.issues).sort()).toEqual([...CODE_ISSUE_CODES].sort());
      expect(Object.keys(code.issueReasons).sort()).toEqual([...CODE_ISSUE_REASONS].sort());
      expect(code.issueUnknown).toEqual(expect.any(String));
    });

    it(`${locale}: every message formats, keeping its technical tokens as written`, () => {
      const t = translator(locale);
      for (const c of CODE_ISSUE_CODES) {
        const text = t(`issues.${c}`, PARAMS);
        expect(text, c).not.toMatch(/storeEditor|issues\.|'\{|'<|\{[a-z]+\}/);
      }
      for (const r of CODE_ISSUE_REASONS) expect(t(`issueReasons.${r}`, PARAMS), r).not.toMatch(/storeEditor|'\{|\{[a-z]+\}/);
      expect(t("issues.tag_not_allowed", PARAMS)).toContain("{% form %}");
      expect(t("issues.blocked_script")).toContain("<script>");
      expect(t("issues.blocked_event_handler")).toContain("onclick");
      expect(t("issues.schema_empty")).toContain('{ "name": "Hero", "settings": [] }');
      expect(t("issueReasons.tablerow")).toContain("{% for %}");
      expect(t("issues.css_at_rule_no_block", PARAMS)).toContain("@import");
    });

    it(`${locale}: never names another platform`, () => {
      const all = JSON.stringify(code);
      expect(all).not.toMatch(/shopify|salla|zid|woocommerce|wix|squarespace|bigcommerce/i);
    });
  }
});

describe("codeIssueText", () => {
  const t = translator("ar");

  it("shows a <script> in the file in Arabic", () => {
    const issue = codeNodeFromFile("<p>hi</p>\n<script>alert(1)</script>").issues.find((i) => i.code === "blocked_script");
    expect(issue).toBeDefined();
    const text = codeIssueText(t, issue!);
    expect(text.text).toBe(ar.storeEditor.code.issues.blocked_script.replace("'<script>'", "<script>"));
    expect(text.text).toMatch(/[؀-ۿ]/);
    expect(text.fallback).toBeUndefined();
  });

  it("adds the reason of a dropped tag", () => {
    const issue = codeNodeFromFile("{% form %}x{% endform %}").issues.find((i) => i.code === "tag_not_allowed");
    expect(codeIssueText(t, issue!).text).toBe("الوسم {% form %} غير مسموح. استخدم عنصر النموذج الجاهز.");
  });

  it("keeps liquidjs's detail after a localized syntax-error line", () => {
    const issue = codeNodeFromFile("{% if %}x{% endif %}").issues.find((i) => i.code === "liquid_syntax");
    const text = codeIssueText(t, issue!);
    expect(text.text).toBe("خطأ في كتابة Liquid:");
    expect(text.detail).toEqual(expect.any(String));
    expect(codeIssueLine(t, issue!)).toBe(`خطأ في كتابة Liquid: ${text.detail}`);
  });

  it("shows an unknown code as a generic line plus the English message", () => {
    expect(codeIssueText(t, { code: "brand_new", message: "Something new" })).toEqual({ text: ar.storeEditor.code.issueUnknown, fallback: "Something new" });
    expect(codeIssueText(t, { code: "../x", message: "m" }).fallback).toBe("m");
  });
});
