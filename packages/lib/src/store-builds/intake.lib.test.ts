import { describe, expect, it } from "vitest";
import {
  bytesMatchType,
  claimedIntakePath,
  decideIntakeClaim,
  guestIntakePath,
  INTAKE_LIMITS,
  intakeCreateSchema,
  intakeIsOpen,
  intakeRefSchema,
  intakeTypeFromName,
  isOverDailyIntakeLimit,
  parseIntakeObjectName,
  sniffBytes,
} from "./intake.lib";

const ID = "4b6f2a1e-8c3d-4e5f-9a0b-1c2d3e4f5a6b";
const SELLER = "0f1e2d3c-4b5a-4968-8776-655443322110";
const TOKEN = "A".repeat(43);

describe("intakeCreateSchema", () => {
  it("accepts a prompt with a colour and a file summary", () => {
    const parsed = intakeCreateSchema.parse({
      prompt: "  عطور شرقية للرجال  ",
      primaryColor: "#0F766E",
      locale: "ar",
      file: { type: "xlsx", size: 1000 },
      fileSummary: { rows: 42, valid: 40, missingPrice: 3, headers: ["الاسم", "السعر"] },
    });
    expect(parsed.prompt).toBe("عطور شرقية للرجال");
    expect(parsed.locale).toBe("ar");
  });

  it("needs a prompt, a file or a logo", () => {
    expect(intakeCreateSchema.safeParse({ prompt: "   " }).success).toBe(false);
    expect(intakeCreateSchema.safeParse({ logo: { type: "png", size: 10 } }).success).toBe(true);
  });

  it("caps the prompt at 1,000 characters", () => {
    expect(intakeCreateSchema.safeParse({ prompt: "a".repeat(1000) }).success).toBe(true);
    expect(intakeCreateSchema.safeParse({ prompt: "a".repeat(1001) }).success).toBe(false);
  });

  it("rejects a bad colour, SVG logos and oversized files", () => {
    expect(intakeCreateSchema.safeParse({ prompt: "x", primaryColor: "red" }).success).toBe(false);
    expect(intakeCreateSchema.safeParse({ prompt: "x", logo: { type: "svg", size: 10 } }).success).toBe(false);
    expect(intakeCreateSchema.safeParse({ prompt: "x", logo: { type: "png", size: INTAKE_LIMITS.logoBytes + 1 } }).success).toBe(false);
    expect(intakeCreateSchema.safeParse({ prompt: "x", file: { type: "csv", size: INTAKE_LIMITS.fileBytes + 1 } }).success).toBe(false);
  });

  it("rejects a summary over the row limit or without a file", () => {
    const summary = { rows: 501, valid: 1, missingPrice: 0, headers: [] };
    expect(intakeCreateSchema.safeParse({ prompt: "x", file: { type: "csv", size: 9 }, fileSummary: summary }).success).toBe(false);
    expect(intakeCreateSchema.safeParse({ prompt: "x", fileSummary: { ...summary, rows: 2 } }).success).toBe(false);
    expect(
      intakeCreateSchema.safeParse({ prompt: "x", file: { type: "csv", size: 9 }, fileSummary: { rows: 2, valid: 3, missingPrice: 0, headers: [] } }).success,
    ).toBe(false);
  });
});

describe("intakeRefSchema", () => {
  it("accepts a uuid and a 43-character token only", () => {
    expect(intakeRefSchema.safeParse({ intakeId: ID, token: TOKEN }).success).toBe(true);
    expect(intakeRefSchema.safeParse({ intakeId: "x", token: TOKEN }).success).toBe(false);
    expect(intakeRefSchema.safeParse({ intakeId: ID, token: "short" }).success).toBe(false);
  });
});

describe("paths and names", () => {
  it("builds guest and claimed paths", () => {
    const guest = guestIntakePath(ID, "logo", "jpeg");
    expect(guest).toBe(`guest/${ID}/logo.jpg`);
    expect(claimedIntakePath(SELLER, guest)).toBe(`${SELLER}/${ID}/logo.jpg`);
    expect(claimedIntakePath(SELLER, "other/x.png")).toBeNull();
  });

  it("reads only the object names we sign", () => {
    expect(parseIntakeObjectName("products.xlsx")).toEqual({ kind: "file", type: "xlsx" });
    expect(parseIntakeObjectName("logo.webp")).toEqual({ kind: "logo", type: "webp" });
    expect(parseIntakeObjectName("logo.csv")).toBeNull();
    expect(parseIntakeObjectName("products.png")).toBeNull();
    expect(parseIntakeObjectName("logo.svg")).toBeNull();
    expect(parseIntakeObjectName("logo.jpeg")).toBeNull();
  });

  it("maps file names to types and refuses SVG", () => {
    expect(intakeTypeFromName("Catalog.XLSX")).toBe("xlsx");
    expect(intakeTypeFromName("logo.jpg")).toBe("jpeg");
    expect(intakeTypeFromName("logo.svg")).toBeNull();
    expect(intakeTypeFromName("noext")).toBeNull();
  });
});

describe("magic bytes", () => {
  const bytes = (...values: number[]) => new Uint8Array(values);
  const png = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0);
  const jpeg = bytes(0xff, 0xd8, 0xff, 0xe0);
  const webp = new Uint8Array([...new TextEncoder().encode("RIFF"), 1, 2, 3, 4, ...new TextEncoder().encode("WEBPVP8 ")]);
  const zip = bytes(0x50, 0x4b, 0x03, 0x04, 0x14);
  const ole = bytes(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1);
  const csv = new TextEncoder().encode("name,price\nعطر,350\n");
  const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

  it("sniffs each kind", () => {
    expect(sniffBytes(png)).toBe("png");
    expect(sniffBytes(jpeg)).toBe("jpeg");
    expect(sniffBytes(webp)).toBe("webp");
    expect(sniffBytes(zip)).toBe("zip");
    expect(sniffBytes(ole)).toBe("ole");
    expect(sniffBytes(csv)).toBe("text");
    expect(sniffBytes(bytes(0x41, 0x00, 0x42))).toBe("unknown");
    expect(sniffBytes(new Uint8Array())).toBe("unknown");
  });

  it("matches bytes to the declared type", () => {
    expect(bytesMatchType("png", png)).toBe(true);
    expect(bytesMatchType("png", svg)).toBe(false);
    expect(bytesMatchType("jpeg", png)).toBe(false);
    expect(bytesMatchType("webp", webp)).toBe(true);
    expect(bytesMatchType("xlsx", zip)).toBe(true);
    expect(bytesMatchType("xls", ole)).toBe(true);
    expect(bytesMatchType("csv", csv)).toBe(true);
    expect(bytesMatchType("csv", zip)).toBe(false);
  });
});

describe("decideIntakeClaim", () => {
  const now = Date.parse("2026-11-08T12:00:00Z");
  const row = {
    tokenHash: "a".repeat(64),
    sellerId: null,
    claimedAt: null,
    expiresAt: "2026-11-10T12:00:00Z",
    createdAt: "2026-11-08T11:58:00Z",
  };

  it("claims an open intake with the right token", () => {
    expect(decideIntakeClaim(row, "a".repeat(64), SELLER, now)).toEqual({ ok: true, already: false });
  });

  it("refuses a missing row, a wrong token and an expired intake", () => {
    expect(decideIntakeClaim(null, "a".repeat(64), SELLER, now)).toEqual({ ok: false, error: "not_found" });
    expect(decideIntakeClaim(row, "b".repeat(64), SELLER, now)).toEqual({ ok: false, error: "wrong_token" });
    expect(decideIntakeClaim({ ...row, expiresAt: "2026-11-08T11:00:00Z" }, "a".repeat(64), SELLER, now)).toEqual({
      ok: false,
      error: "expired",
    });
  });

  it("refuses someone else's claimed intake and allows the owner's retry", () => {
    const claimed = { ...row, sellerId: SELLER, claimedAt: "2026-11-08T11:59:00Z" };
    expect(decideIntakeClaim(claimed, "a".repeat(64), ID, now)).toEqual({ ok: false, error: "claimed" });
    expect(decideIntakeClaim(claimed, "a".repeat(64), SELLER, now)).toEqual({ ok: true, already: true });
  });

  it("applies the signed-in path's 10-minute window", () => {
    expect(decideIntakeClaim(row, "a".repeat(64), SELLER, now, 10 * 60_000).ok).toBe(true);
    expect(decideIntakeClaim(row, "a".repeat(64), SELLER, now, 60_000)).toEqual({ ok: false, error: "too_old" });
  });

  it("tells an open intake apart", () => {
    expect(intakeIsOpen(row, "a".repeat(64), now)).toBe(true);
    expect(intakeIsOpen({ ...row, claimedAt: "2026-11-08T11:59:00Z" }, "a".repeat(64), now)).toBe(false);
    expect(intakeIsOpen(row, "c".repeat(64), now)).toBe(false);
  });
});

describe("daily limit", () => {
  it("allows 10 intakes per IP per day", () => {
    expect(isOverDailyIntakeLimit(9)).toBe(false);
    expect(isOverDailyIntakeLimit(10)).toBe(true);
  });
});
