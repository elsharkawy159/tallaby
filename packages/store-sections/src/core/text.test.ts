import { describe, expect, it } from "vitest";
import { decodeTextEntities } from "./text";

describe("decodeTextEntities", () => {
  it("turns &nbsp; and common entities into text", () => {
    expect(decodeTextEntities("ANC&nbsp;45 dB &amp; ENC &lt;5ms&gt; &quot;Pro&quot; it&#39;s")).toBe('ANC 45 dB & ENC <5ms> "Pro" it\'s');
  });
  it("decodes numeric entities and leaves unknown ones", () => {
    expect(decodeTextEntities("&#1587;&#x627; &#160;x &bogus;")).toBe("سا  x &bogus;");
  });
  it("leaves plain text alone", () => {
    expect(decodeTextEntities("سماعات لاسلكية — 30 ساعة")).toBe("سماعات لاسلكية — 30 ساعة");
  });
});
