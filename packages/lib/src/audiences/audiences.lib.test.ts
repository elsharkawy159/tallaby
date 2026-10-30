import { describe, expect, it } from "vitest";
import type { StoreCustomer } from "../customers/customers.lib";
import {
  audienceFile,
  audienceFileCount,
  audienceFileName,
  buildAudienceRows,
  csvCell,
  customersInSegment,
  normalizeAudienceEmail,
  parseAudienceFormat,
  parseAudienceSegment,
  segmentExcludesBlocked,
  splitName,
  toE164Phone,
  type AudienceContact,
} from "./audiences.lib";

describe("toE164Phone", () => {
  it("turns every spelling of an Egyptian mobile into +20…", () => {
    for (const raw of ["01012345678", "+20 101 234 5678", "201012345678", "00201012345678", "010-1234-5678", "٠١٠١٢٣٤٥٦٧٨", "1012345678"]) {
      expect(toE164Phone(raw), raw).toBe("+201012345678");
    }
  });

  it("keeps a number typed with an international prefix", () => {
    expect(toE164Phone("+966 50 123 4567")).toBe("+966501234567");
    expect(toE164Phone("00971501234567")).toBe("+971501234567");
  });

  it("rejects what an ad platform could not match", () => {
    for (const raw of [null, undefined, "", "abc", "0223456789", "12345", "+12", "+0123456789", "+1234567890123456"]) {
      expect(toE164Phone(raw), String(raw)).toBeNull();
    }
  });
});

describe("normalizeAudienceEmail", () => {
  it("trims and lower-cases", () => {
    expect(normalizeAudienceEmail("  Mona.Ali@Example.COM ")).toBe("mona.ali@example.com");
  });

  it("drops malformed and guest placeholder addresses", () => {
    for (const raw of [null, "", "mona", "mona@", "a b@c.com", "guest_123@temp.local"]) {
      expect(normalizeAudienceEmail(raw), String(raw)).toBeNull();
    }
  });
});

describe("splitName", () => {
  it("splits first and last name and drops the guest placeholder", () => {
    expect(splitName("Mona Ahmed Ali")).toEqual({ firstName: "Mona", lastName: "Ahmed Ali" });
    expect(splitName(" منى  أحمد ")).toEqual({ firstName: "منى", lastName: "أحمد" });
    expect(splitName("Guest User")).toEqual({ firstName: "", lastName: "" });
    expect(splitName(null)).toEqual({ firstName: "", lastName: "" });
  });

  it("strips leading formula characters", () => {
    expect(splitName("=HYPERLINK(x) Ali")).toEqual({ firstName: "HYPERLINK(x)", lastName: "Ali" });
  });
});

const contact = (over: Partial<AudienceContact>): AudienceContact => ({ phone: null, email: null, name: null, city: null, ...over });

describe("buildAudienceRows", () => {
  it("normalises, keeps rows with a phone or an email, and de-duplicates", () => {
    const rows = buildAudienceRows([
      contact({ phone: "01012345678", email: "A@x.com", name: "Mona Ali", city: "Nasr City" }),
      contact({ phone: "+20 101 234 5678", email: "b@x.com" }),
      contact({ email: "a@X.com" }),
      contact({ phone: "123", email: "nope" }),
      contact({ phone: "01112345678" }),
    ]);
    expect(rows).toEqual([
      { phone: "+201012345678", email: "a@x.com", firstName: "Mona", lastName: "Ali", city: "Nasr City" },
      { phone: null, email: "b@x.com", firstName: "", lastName: "", city: "" },
      { phone: "+201112345678", email: null, firstName: "", lastName: "", city: "" },
    ]);
  });

  it("leaves out blocked phones", () => {
    const rows = buildAudienceRows([contact({ phone: "+201012345678", email: "a@x.com" }), contact({ phone: "01112345678" })], {
      blockedPhones: new Set(["01012345678"]),
    });
    expect(rows.map((r) => r.phone)).toEqual(["+201112345678"]);
  });
});

const customer = (over: Partial<StoreCustomer>): StoreCustomer => ({
  key: "p:01012345678",
  storeId: "s",
  phone: "01012345678",
  userId: "u",
  name: "",
  email: null,
  governorate: null,
  city: null,
  orderCount: 1,
  deliveredCount: 0,
  refusedCount: 0,
  cancelledCount: 0,
  totalSpent: "0.00",
  firstOrderAt: "2026-10-01T00:00:00Z",
  lastOrderAt: "2026-10-01T00:00:00Z",
  successRate: null,
  ...over,
});

describe("customersInSegment", () => {
  const delivered = customer({ key: "a", deliveredCount: 1 });
  const refused = customer({ key: "b", refusedCount: 1 });
  const cancelled = customer({ key: "c", cancelledCount: 1 });
  const open = customer({ key: "d" });
  const all = [delivered, refused, cancelled, open];

  it("buyers = at least one delivered order", () => {
    expect(customersInSegment(all, "buyers").map((c) => c.key)).toEqual(["a"]);
  });

  it("refused = refused, returned or cancelled", () => {
    expect(customersInSegment(all, "refused").map((c) => c.key)).toEqual(["b", "c"]);
  });

  it("all = everyone", () => {
    expect(customersInSegment(all, "all")).toHaveLength(4);
  });

  it("drops blocked phones from every segment but refused", () => {
    expect(segmentExcludesBlocked("buyers")).toBe(true);
    expect(segmentExcludesBlocked("leads")).toBe(true);
    expect(segmentExcludesBlocked("refused")).toBe(false);
  });
});

describe("csvCell", () => {
  it("quotes cells with commas, quotes or line breaks", () => {
    expect(csvCell("plain")).toBe("plain");
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("a\nb")).toBe('"a\nb"');
    expect(csvCell("+201012345678")).toBe("+201012345678");
  });
});

describe("audienceFile", () => {
  const rows = buildAudienceRows([
    contact({ phone: "01012345678", email: "a@x.com", name: "Mona Ali", city: "Giza, Dokki" }),
    contact({ email: "b@x.com" }),
    contact({ phone: "01112345678" }),
  ]);

  it("writes Meta's customer-list columns", () => {
    expect(audienceFile(rows, "meta")).toBe(
      [
        "email,phone,fn,ln,ct,country",
        'a@x.com,+201012345678,Mona,Ali,"Giza, Dokki",EG',
        "b@x.com,,,,,",
        ",+201112345678,,,,EG",
        "",
      ].join("\r\n"),
    );
    expect(audienceFileCount(rows, "meta")).toBe(3);
  });

  it("writes one TikTok identifier per line, no header", () => {
    expect(audienceFile(rows, "tiktok_phone")).toBe("+201012345678\r\n+201112345678\r\n");
    expect(audienceFile(rows, "tiktok_email")).toBe("a@x.com\r\nb@x.com\r\n");
    expect(audienceFileCount(rows, "tiktok_phone")).toBe(2);
    expect(audienceFile([], "tiktok_email")).toBe("");
  });

  it("names the file after the segment and format", () => {
    expect(audienceFileName("buyers", "tiktok_phone", "2026-10-30")).toBe("audience-buyers-tiktok-phone-2026-10-30.csv");
  });
});

describe("parsers", () => {
  it("accept only known values", () => {
    expect(parseAudienceSegment("leads")).toBe("leads");
    expect(parseAudienceSegment("everyone")).toBeNull();
    expect(parseAudienceFormat("meta")).toBe("meta");
    expect(parseAudienceFormat("google")).toBeNull();
  });
});
