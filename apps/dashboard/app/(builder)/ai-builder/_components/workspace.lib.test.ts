import { describe, expect, it } from "vitest";
import type { BuilderQuestion } from "@/app/(main)/ai-builder/builder.dto";
import {
  CHAT_WIDTH,
  attachFileBody,
  buildCardAnswers,
  buildChecklist,
  changesSite,
  clampChatWidth,
  deviceScale,
  dragWidth,
  draftReady,
  finishedBetween,
  isAnswered,
  normalizeHex,
  parseCardSummary,
  parseStoredWidth,
  pickOption,
  revealSteps,
  templatePreviewSrc,
} from "./workspace.lib";

const q = (over: Partial<BuilderQuestion> & Pick<BuilderQuestion, "id" | "kind">): BuilderQuestion => ({
  key: over.id,
  options: [],
  allowOther: false,
  optional: false,
  ...over,
});

describe("chat width", () => {
  it("clamps to 360–640 and leaves the preview room", () => {
    expect(clampChatWidth(200, 1600)).toBe(CHAT_WIDTH.min);
    expect(clampChatWidth(900, 1600)).toBe(CHAT_WIDTH.max);
    expect(clampChatWidth(500, 1600)).toBe(500);
    // 1000 px wide: 1000 - 420 = 580 at most.
    expect(clampChatWidth(620, 1000)).toBe(580);
    // Too narrow for both: the chat keeps its minimum.
    expect(clampChatWidth(500, 600)).toBe(CHAT_WIDTH.min);
    expect(clampChatWidth(Number.NaN, 1600)).toBe(CHAT_WIDTH.initial);
  });

  it("reads a saved width", () => {
    expect(parseStoredWidth("480")).toBe(480);
    expect(parseStoredWidth("abc")).toBeNull();
    expect(parseStoredWidth(null)).toBeNull();
    expect(parseStoredWidth("-3")).toBeNull();
  });

  it("drags right to widen, in both directions", () => {
    expect(dragWidth(440, 100, 160, 1600)).toBe(500);
    expect(dragWidth(440, 100, 0, 1600)).toBe(360);
  });
});

describe("revealSteps", () => {
  it("cuts at word ends and ends with the whole text", () => {
    const text = "متجرك جاهز ومنشور دلوقتي تقدر تفتحه";
    const steps = revealSteps(text, 3);
    expect(steps.at(-1)).toBe(text);
    expect(steps.length).toBeLessThanOrEqual(4);
    for (const step of steps) expect(text.startsWith(step)).toBe(true);
    expect(steps[0]!.endsWith(" ")).toBe(false);
  });

  it("shows a one-word or empty text at once", () => {
    expect(revealSteps("أهلًا")).toEqual(["أهلًا"]);
    expect(revealSteps("")).toEqual([""]);
  });
});

describe("question cards", () => {
  const storeName = q({ id: "storeName", kind: "single", allowOther: true, options: [{ value: "Oud", label: "Oud", recommended: true }] });
  const style = q({ id: "style", kind: "multi", optional: true, maxChoices: 2, options: ["luxe", "bold", "warm"].map((value) => ({ value })) });
  const color = q({ id: "color", kind: "color", allowOther: true, options: [{ value: "#112233", color: "#112233" }, { value: "template" }] });
  const shipping = q({
    id: "shipping",
    kind: "single",
    allowOther: true,
    optional: true,
    options: [{ value: "tallaby_rates" }, { value: "egypt_flat", needsText: true }],
  });

  it("builds a card's answers, skipping blank optional ones", () => {
    const result = buildCardAnswers([storeName, style, color], { storeName: { choice: "Oud" }, color: { text: "#ABC" } });
    expect(result.missing).toEqual([]);
    expect(result.answers).toEqual({ storeName: { choice: "Oud" }, style: { skip: true }, color: { text: "#aabbcc" } });
  });

  it("lists required questions still blank", () => {
    expect(buildCardAnswers([storeName, color], { storeName: { text: "  " } }).missing).toEqual(["storeName", "color"]);
  });

  it("needs the price for one price for all Egypt", () => {
    expect(isAnswered(shipping, { choice: "egypt_flat" })).toBe(false);
    expect(buildCardAnswers([shipping], { shipping: { choice: "egypt_flat", text: "60" } }).answers).toEqual({ shipping: { choice: "egypt_flat", text: "60" } });
    // Half answered: not sent as a skip.
    expect(buildCardAnswers([shipping], { shipping: { choice: "egypt_flat" } }).missing).toEqual(["shipping"]);
  });

  it("keeps the words typed after the server's own other option", () => {
    const industry = q({ id: "industry", kind: "single", allowOther: true, options: [{ value: "fashion" }, { value: "other" }] });
    expect(buildCardAnswers([industry], { industry: { choice: "other", text: "عطور" } }).answers).toEqual({ industry: { choice: "other", text: "عطور" } });
    expect(buildCardAnswers([industry], { industry: { choice: "other" } }).answers).toEqual({ industry: { choice: "other" } });
  });

  it("takes typed text for Other", () => {
    expect(buildCardAnswers([storeName], { storeName: { text: " عود الملوك " } }).answers).toEqual({ storeName: { text: "عود الملوك" } });
  });

  it("refuses a skip on a required question and a bad hex", () => {
    expect(isAnswered(storeName, { skip: true })).toBe(false);
    expect(isAnswered(color, { text: "green" })).toBe(false);
    expect(isAnswered(q({ id: "describe", kind: "text", allowOther: true }), { text: "ab" })).toBe(false);
  });

  it("toggles multi picks up to the max and replaces single picks", () => {
    let value = pickOption(style, undefined, "luxe");
    value = pickOption(style, value, "bold");
    value = pickOption(style, value, "warm");
    expect(value.choices).toEqual(["bold", "warm"]);
    expect(pickOption(style, value, "bold").choices).toEqual(["warm"]);
    expect(pickOption(storeName, { text: "x" }, "Oud")).toEqual({ choice: "Oud", text: undefined, skip: undefined });
    expect(pickOption(shipping, { text: "60" }, "egypt_flat").text).toBe("60");
  });

  it("normalises hex colours", () => {
    expect(normalizeHex("#1E5BB8")).toBe("#1e5bb8");
    expect(normalizeHex("fff")).toBe("#ffffff");
    expect(normalizeHex("#12345")).toBeNull();
  });

  it("reads a card summary", () => {
    expect(parseCardSummary("card:industry:fashion style:luxe+warm color:#112233")).toEqual([
      { id: "industry", value: "fashion" },
      { id: "style", value: "luxe+warm" },
      { id: "color", value: "#112233" },
    ]);
    expect(parseCardSummary("hello")).toEqual([]);
  });
});

describe("attachFileBody", () => {
  it("caps columns, cells and rows and drops empty rows", () => {
    const body = attachFileBody({
      headers: Array.from({ length: 45 }, (_, i) => `h${i}`.padEnd(100, "x")),
      rows: [
        { row: 2, cells: ["شنطة", "150", "y".repeat(2500)] },
        { row: 3, cells: ["", " "] },
        ...Array.from({ length: 600 }, (_, i) => ({ row: i + 4, cells: ["a"] })),
      ],
    });
    expect(body.action).toBe("attachFile");
    expect(body.headers).toHaveLength(40);
    expect(body.headers[0]).toHaveLength(80);
    expect(body.rows).toHaveLength(500);
    expect(body.rows[0]!.cells[2]).toHaveLength(2000);
    expect(body.rows.some((row) => row.row === 3)).toBe(false);
  });
});

describe("build checklist", () => {
  const keys = ["store", "settings", "template", "brand", "categories", "site_copy", "hero_photos", "products_file:0", "products_file:1", "catalog", "shipping", "policy", "checks", "publish"];

  it("ticks phases before the current item and counts products", () => {
    const rows = buildChecklist(keys, "products_file:1", 14);
    expect(rows.map((row) => [row.phase, row.status])).toEqual([
      ["store", "done"],
      ["design", "done"],
      ["copy", "done"],
      ["products", "running"],
      ["selling", "pending"],
      ["checks", "pending"],
      ["publish", "pending"],
    ]);
    expect(rows[3]).toMatchObject({ done: 10, total: 14 });
  });

  it("is all done when nothing is left, with the last batch counted whole", () => {
    const rows = buildChecklist(keys, null, 14);
    expect(rows.every((row) => row.status === "done")).toBe(true);
    expect(rows.find((row) => row.phase === "products")).toMatchObject({ done: 14, total: 14 });
  });

  it("leaves out the products row with no products", () => {
    const rows = buildChecklist(["store", "template", "catalog", "publish"], "template", 0);
    expect(rows.map((row) => row.phase)).toEqual(["store", "design", "publish"]);
  });

  it("knows which steps change the site and the draft", () => {
    expect(changesSite("brand")).toBe(true);
    expect(changesSite("products_file:3")).toBe(true);
    expect(changesSite("shipping")).toBe(false);
    expect(changesSite(null)).toBe(false);
    expect(finishedBetween(keys, "template", "categories")).toEqual(["template", "brand"]);
    expect(finishedBetween(keys, "checks", null)).toEqual(["checks", "publish"]);
    expect(draftReady(keys, "template")).toBe(false);
    expect(draftReady(keys, "brand")).toBe(true);
    expect(draftReady(keys, null)).toBe(true);
  });
});

describe("preview", () => {
  it("scales a device into the pane", () => {
    expect(deviceScale("desktop", 500)).toBe(1);
    expect(deviceScale("tablet", 384)).toBe(0.5);
    expect(deviceScale("phone", 800)).toBe(1);
  });

  it("builds template preview frames", () => {
    expect(templatePreviewSrc("https://tallaby.com", "ar", "sage", true)).toBe("https://tallaby.com/template-preview/sage?thumb=1");
    expect(templatePreviewSrc("https://tallaby.com", "en", "sage")).toBe("https://tallaby.com/en/template-preview/sage");
  });
});
