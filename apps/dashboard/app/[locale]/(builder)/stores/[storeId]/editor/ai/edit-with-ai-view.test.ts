import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import ar from "@/messages/ar.json";
import en from "@/messages/en.json";
import type { EditWithAiError } from "./server/edit-with-ai.dto";
import type { ChatMessage, ProposalView } from "./edit-with-ai-chat.lib";

// No server, browser client or app router in a unit test.
vi.mock("@/supabase/client", () => ({ createClient: () => ({}), supabase: {} }));
vi.mock("./server/edit-with-ai.server", () => ({
  editWithAiTurn: vi.fn(),
  createEditWithAiUploads: vi.fn(),
  undoEditWithAi: vi.fn(),
  confirmEditWithAiAction: vi.fn(),
  cancelEditWithAiAction: vi.fn(),
}));
vi.mock("../server/editor.server", () => ({ previewLink: vi.fn(), publish: vi.fn(), siteStatus: vi.fn() }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: ReactNode }) => createElement("a", { href, ...rest }, children),
  useRouter: () => ({ push: vi.fn() }),
}));

const { ChatMessages, ConfirmCard, ErrorText, ImportCard } = await import("./edit-with-ai-messages.client");
const { EditWithAiWorkspace } = await import("./edit-with-ai-workspace.client");

const render = (node: ReactNode, locale: "ar" | "en" = "en") =>
  renderToStaticMarkup(createElement(NextIntlClientProvider, { locale, timeZone: "Africa/Cairo", messages: locale === "ar" ? ar : en } as never, node));

const noop = () => {};
const handlers = { storeId: "s1", onUndo: noop, onConfirm: noop, onCancel: noop };

const ERRORS: EditWithAiError[] = [
  "notFound",
  "readOnly",
  "aiUnavailable",
  "rateLimited",
  "invalidInput",
  "attachmentInvalid",
  "aiDailyLimit",
  "aiNoCredits",
  "aiFailed",
  "draftChanged",
  "undoExpired",
  "actionExpired",
  "actionRunning",
  "actionFailed",
  "uploadUnavailable",
  "generic",
];

describe("error texts", () => {
  it.each(["ar", "en"] as const)("every server error code has its own text in %s", (locale) => {
    const texts = ERRORS.map((error) => render(createElement(ErrorText, { error }), locale));
    for (const html of texts) {
      expect(html).not.toMatch(/editWithAi\.errors/);
      expect(html.length).toBeGreaterThan(10);
    }
    expect(new Set(texts).size).toBe(ERRORS.length);
  });

  it("no credits links to the plan page; the draft-changed text says to reload the preview", () => {
    expect(render(createElement(ErrorText, { error: "aiNoCredits" }))).toContain('href="/settings/plan"');
    expect(render(createElement(ErrorText, { error: "draftChanged" }))).toContain("changed in another tab. Reload the preview");
  });

  it("an unknown code is the generic text", () => {
    expect(render(createElement(ErrorText, { error: "somethingNew" as EditWithAiError }))).toBe("Something went wrong. Try again.");
  });
});

const card = (patch: Partial<ProposalView> = {}): ProposalView => ({
  actionId: "act_aaaaaaaaaaaaaaaaaaaaaa",
  tool: "save_shipping_zone",
  skill: "shipping",
  card: {
    title: "agent.card.shipping.editZone.title",
    params: { name: "Cairo" },
    lines: [
      { key: "agent.card.shipping.price", params: { price: "50.00" } },
      { key: "agent.card.shipping.days", params: { min: 1, max: 3 } },
    ],
    risk: "high",
  },
  credits: 1,
  expiresAt: "2026-11-26T12:00:00Z",
  status: "pending",
  ...patch,
});

describe("confirm cards", () => {
  it("shows the title and lines from agent.card.*, the risk note, Confirm and Cancel", () => {
    const html = render(createElement(ConfirmCard, { proposal: card(), storeId: "s1", onConfirm: noop, onCancel: noop }));
    expect(html).toContain("Change the delivery zone &quot;Cairo&quot;");
    expect(html).toContain("Delivery price: EGP 50.00");
    expect(html).toContain("Delivery time: 1 to 3 days");
    expect(html).toContain("Check carefully");
    expect(html).toContain(">Confirm<");
    expect(html).toContain(">Cancel<");
    expect(html).toContain("1 AI credit when you confirm");
  });

  it("names a social platform and renders Arabic", () => {
    const html = render(
      createElement(ConfirmCard, {
        proposal: card({ card: { title: "agent.card.settings.social.title", params: { platform: "instagram" }, lines: [], risk: "low" } }),
        storeId: "s1",
        onConfirm: noop,
        onCancel: noop,
      }),
      "ar",
    );
    expect(html).toContain("ضبط رابط إنستجرام");
    expect(html).not.toContain("راجع جيدًا");
  });

  it("after Confirm: the product made as a draft, with a link to it", () => {
    const html = render(createElement(ConfirmCard, { proposal: card({ status: "done", product: { id: "p1", live: false }, creditsUsed: 1 }), storeId: "s1", onConfirm: noop, onCancel: noop }));
    expect(html).toContain("Product created as a draft.");
    expect(html).toContain('href="/stores/s1/products/p1"');
    expect(html).not.toContain(">Confirm<");
  });

  it("a cancelled card has no buttons", () => {
    const html = render(createElement(ConfirmCard, { proposal: card({ status: "cancelled" }), storeId: "s1", onConfirm: noop, onCancel: noop }));
    expect(html).toContain("Cancelled. Nothing was changed.");
    expect(html).not.toContain(">Confirm<");
  });
});

describe("the import card", () => {
  it("links to the from-file import with the attached file, in the same tab", () => {
    const href = "/stores/s1/products/add/from-file?aiFile=seller%2Fstore%2Fa.csv";
    const html = render(createElement(ImportCard, { card: { kind: "import_products", fileRef: "seller/store/a.csv", fileName: "a.csv", href } }));
    expect(html).toContain(`href="${href.replace(/&/g, "&amp;")}"`);
    expect(html).not.toContain('target="_blank"');
    expect(html).toContain("This chat stays here");
  });
});

describe("the chat", () => {
  const messages: ChatMessage[] = [
    { id: "1", role: "user", text: "Change the hero", attachments: [] },
    { id: "2", role: "assistant", text: "Done!", siteChanges: { lines: ["Changed the hero photo"], undoToken: "t".repeat(24), undo: "available" }, proposals: [], cards: [], rejected: 2, creditsUsed: 1 },
    { id: "3", role: "notice", notice: "stopped" },
  ];

  it("shows the reply, the checklist with Undo, skipped changes muted and the credit", () => {
    const html = render(createElement(ChatMessages, { messages, pending: false, ...handlers }));
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("Changed the hero photo");
    expect(html).toContain(">Undo<");
    expect(html).toContain("2 changes couldn&#x27;t be made.");
    expect(html).toContain("1 AI credit");
    expect(html).toContain("Stopped.");
  });

  it("explains an undo that can't run any more", () => {
    const expired = render(createElement(ChatMessages, { messages: [{ ...(messages[1] as Extract<ChatMessage, { role: "assistant" }>), siteChanges: { lines: ["x"], undoToken: "t".repeat(24), undo: "changed" } }], pending: false, ...handlers }));
    expect(expired).toContain("The website was changed after this");
    expect(expired).not.toContain(">Undo<");
  });

  it("shows the typing indicator while waiting", () => {
    expect(render(createElement(ChatMessages, { messages: [], pending: true, ...handlers }))).toContain("Working on it");
  });
});

describe("the page", () => {
  const props = { storeId: "s1", storeName: "My shop", readOnly: false, previewEnabled: true, initialPreviewUrl: "https://shop.example/api/store-preview?token=x", initialUnpublished: true };
  const publishButton = (html: string) => /<button[^>]*>(?:(?!<\/button>)[\s\S])*Publish<\/button>/.exec(html)?.[0] ?? "";

  it("enables Publish with unpublished changes", () => {
    const button = publishButton(render(createElement(EditWithAiWorkspace, props)));
    expect(button).toBeTruthy();
    expect(button).not.toContain(`disabled=""`);
  });

  it("disables Publish with nothing to publish, and for a read-only store", () => {
    expect(publishButton(render(createElement(EditWithAiWorkspace, { ...props, initialUnpublished: false })))).toContain(`disabled=""`);
    expect(publishButton(render(createElement(EditWithAiWorkspace, { ...props, readOnly: true })))).toContain(`disabled=""`);
  });

  it("links back to the choice and to the manual editor, and starts with the suggestions", () => {
    const html = render(createElement(EditWithAiWorkspace, props));
    expect(html).toContain('href="/stores/s1/editor"');
    expect(html).toContain('href="/stores/s1/editor?mode=manual"');
    for (const chip of ["Change the hero image", "Add an FAQ section", "Add a new product from a photo", "Change the announcement bar text", "Import products from a file"]) expect(html).toContain(chip);
  });
});
