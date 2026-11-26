import { describe, expect, it } from "vitest";
import { canPublish, editWithAiGate, publishErrorKey } from "./edit-with-ai-page.lib";

describe("editWithAiGate", () => {
  it("sends the seller to the editor while AI is off", () => {
    expect(editWithAiGate({ builderEnabled: true, aiEnabled: false })).toBe("editor");
  });
  it("shows the chat while AI is on", () => {
    expect(editWithAiGate({ builderEnabled: true, aiEnabled: true })).toBe("show");
  });
  it("is a 404 without the website builder, AI or not", () => {
    expect(editWithAiGate({ builderEnabled: false, aiEnabled: true })).toBe("notFound");
    expect(editWithAiGate({ builderEnabled: false, aiEnabled: false })).toBe("notFound");
  });
});

describe("canPublish", () => {
  it("only with unpublished changes, not while publishing, never read-only", () => {
    expect(canPublish({ hasUnpublishedChanges: true, publishing: false, readOnly: false })).toBe(true);
    expect(canPublish({ hasUnpublishedChanges: false, publishing: false, readOnly: false })).toBe(false);
    expect(canPublish({ hasUnpublishedChanges: true, publishing: true, readOnly: false })).toBe(false);
    expect(canPublish({ hasUnpublishedChanges: true, publishing: false, readOnly: true })).toBe(false);
  });
});

describe("publishErrorKey", () => {
  it("keeps the errors the page explains and folds the rest into generic", () => {
    expect(publishErrorKey("noActiveProduct")).toBe("noActiveProduct");
    expect(publishErrorKey("topUpRequired")).toBe("topUpRequired");
    expect(publishErrorKey("versionConflict")).toBe("generic");
  });
});
