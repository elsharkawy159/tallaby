import { describe, expect, it } from "vitest";
import {
  DIGITAL_FILE_ACCEPT,
  DIGITAL_FILE_EXTENSIONS,
  DIGITAL_FILE_MAX_BYTES,
  buildDigitalFilePath,
  digitalFileExtension,
  digitalFileProblem,
  formatDigitalFileSize,
  isOwnDigitalFilePath,
  sanitizeDigitalFileName,
} from "./digital-files.lib";

const SELLER = "11111111-1111-4111-8111-111111111111";
const STORE = "22222222-2222-4222-8222-222222222222";
const OTHER = "33333333-3333-4333-8333-333333333333";
const FILE_ID = "44444444-4444-4444-8444-444444444444";

describe("digitalFileExtension", () => {
  it("accepts every listed extension in any case", () => {
    for (const ext of DIGITAL_FILE_EXTENSIONS) {
      expect(digitalFileExtension(`file.${ext}`)).toBe(ext);
      expect(digitalFileExtension(`FILE.${ext.toUpperCase()}`)).toBe(ext);
    }
  });

  it("refuses scripts, executables and names without an extension", () => {
    for (const name of ["setup.exe", "run.sh", "page.html", "app.js", "noext", "", "pdf", "x.pdf.exe"]) {
      expect(digitalFileExtension(name)).toBeNull();
    }
  });

  it("builds the picker's accept list from the same extensions", () => {
    expect(DIGITAL_FILE_ACCEPT.split(",")).toHaveLength(DIGITAL_FILE_EXTENSIONS.length);
    expect(DIGITAL_FILE_ACCEPT).toContain(".dxf");
  });
});

describe("digitalFileProblem", () => {
  it("allows a supported file up to 100 MB", () => {
    expect(digitalFileProblem({ name: "pattern.dxf", size: 1 })).toBeNull();
    expect(digitalFileProblem({ name: "course.mp4", size: DIGITAL_FILE_MAX_BYTES })).toBeNull();
  });

  it("reports the type, empty files and files over 100 MB", () => {
    expect(digitalFileProblem({ name: "virus.exe", size: 10 })).toBe("type");
    expect(digitalFileProblem({ name: "book.pdf", size: 0 })).toBe("empty");
    expect(digitalFileProblem({ name: "book.pdf", size: Number.NaN })).toBe("empty");
    expect(digitalFileProblem({ name: "movie.mkv", size: DIGITAL_FILE_MAX_BYTES + 1 })).toBe("size");
  });
});

describe("sanitizeDigitalFileName", () => {
  it("keeps safe names and lower-cases the extension", () => {
    expect(sanitizeDigitalFileName("Pattern-v2_final.DXF")).toBe("Pattern-v2_final.dxf");
  });

  it("replaces spaces, Arabic letters and path characters", () => {
    expect(sanitizeDigitalFileName("my book (1).pdf")).toBe("my_book_1.pdf");
    expect(sanitizeDigitalFileName("كتاب.pdf")).toBe("file.pdf");
    expect(sanitizeDigitalFileName("../../etc/passwd.txt")).toBe("etc_passwd.txt");
  });

  it("caps the length", () => {
    const name = sanitizeDigitalFileName(`${"a".repeat(300)}.zip`);
    expect(name).toBe(`${"a".repeat(80)}.zip`);
  });
});

describe("buildDigitalFilePath / isOwnDigitalFilePath", () => {
  it("builds a path under the seller's store folder that passes the check", () => {
    const path = buildDigitalFilePath(SELLER.toUpperCase(), STORE, FILE_ID, "My Pattern.dxf");
    expect(path).toBe(`${SELLER}/${STORE}/${FILE_ID}-My_Pattern.dxf`);
    expect(isOwnDigitalFilePath(SELLER, STORE, path!)).toBe(true);
    expect(isOwnDigitalFilePath(SELLER.toUpperCase(), STORE.toUpperCase(), path!)).toBe(true);
  });

  it("returns null for ids that aren't UUIDs", () => {
    expect(buildDigitalFilePath("seller", STORE, FILE_ID, "a.pdf")).toBeNull();
    expect(buildDigitalFilePath(SELLER, STORE, "../x", "a.pdf")).toBeNull();
  });

  it("refuses another seller's or another store's path", () => {
    const path = buildDigitalFilePath(SELLER, STORE, FILE_ID, "a.pdf")!;
    expect(isOwnDigitalFilePath(OTHER, STORE, path)).toBe(false);
    expect(isOwnDigitalFilePath(SELLER, OTHER, path)).toBe(false);
  });

  it("refuses traversal, extra folders, bad extensions and odd shapes", () => {
    for (const path of [
      `${SELLER}/${STORE}/../${OTHER}/${FILE_ID}-a.pdf`,
      `${SELLER}/${STORE}/sub/${FILE_ID}-a.pdf`,
      `${SELLER}/${STORE}/${FILE_ID}-a.exe`,
      `${SELLER}/${STORE}/a.pdf`,
      `/${SELLER}/${STORE}/${FILE_ID}-a.pdf`,
      `${SELLER}/${FILE_ID}-a.pdf`,
      `${SELLER}/${STORE}/${FILE_ID}-a b.pdf`,
      "",
    ]) {
      expect(isOwnDigitalFilePath(SELLER, STORE, path)).toBe(false);
    }
  });
});

describe("formatDigitalFileSize", () => {
  it("shows KB under a megabyte and MB above", () => {
    expect(formatDigitalFileSize(0)).toBe("0 KB");
    expect(formatDigitalFileSize(200)).toBe("1 KB");
    expect(formatDigitalFileSize(5 * 1024)).toBe("5 KB");
    expect(formatDigitalFileSize(2.5 * 1024 * 1024)).toBe("2.5 MB");
    expect(formatDigitalFileSize(42 * 1024 * 1024)).toBe("42 MB");
  });
});
