import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import editorAr from "@workspace/store-editor/messages/ar.json";
import editorEn from "@workspace/store-editor/messages/en.json";
import type { EditorAssistantApi } from "@workspace/store-editor/editor.client";
import dashboardAr from "@/messages/ar.json";
import dashboardEn from "@/messages/en.json";
import type { EditWithAiError } from "./server/edit-with-ai.dto";
import { createEditWithAiChat, type ChatActions, type ChatMessage, type ProposalView } from "./edit-with-ai-chat.lib";

// As the app serves them: the editor package's strings merged into the dashboard's (i18n/request.tsx).
const ar = { ...dashboardAr, ...editorAr };
const en = { ...dashboardEn, ...editorEn };

// No server, browser client or app router in a unit test.
vi.mock("@/supabase/client", () => ({ createClient: () => ({}), supabase: {} }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: ReactNode }) => createElement("a", { href, ...rest }, children),
  useRouter: () => ({ push: vi.fn() }),
}));

const { ChatMessages, ConfirmCard, ErrorText, ImportCard } = await import("./edit-with-ai-messages.client");
const { CreditsChip, EditWithAiPanel } = await import("./edit-with-ai-panel.client");

const render = (node: ReactNode, locale: "ar" | "en" = "en") =>
  renderToStaticMarkup(createElement(NextIntlClientProvider, { locale, timeZone: "Africa/Cairo", messages: locale === "ar" ? ar : en } as never, node));

const noop = () => {};
const handlers = { storeId: "s1", canUndo: () => true, onUndo: noop, onConfirm: noop, onCancel: noop };

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

  it("no credits links to the plan page; the unsaved-changes text says to reload the page", () => {
    expect(render(createElement(ErrorText, { error: "aiNoCredits" }))).toContain('href="/settings/plan"');
    expect(render(createElement(ErrorText, { error: "draftChanged" }))).toContain("your message wasn&#x27;t sent. Reload the page");
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
    { id: "2", role: "assistant", text: "Done!", siteChanges: { lines: ["Changed the hero photo"] }, proposals: [], cards: [], rejected: 2, creditsUsed: 1 },
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

  it("offers Undo only while the turn is still the editor's newest undo step", () => {
    const html = render(createElement(ChatMessages, { messages, pending: false, ...handlers, canUndo: () => false }));
    expect(html).toContain("Changed the hero photo");
    expect(html).not.toContain(">Undo<");
  });

  it("says when the website changed meanwhile and nothing was applied", () => {
    const stale = render(createElement(ChatMessages, { messages: [{ ...(messages[1] as Extract<ChatMessage, { role: "assistant" }>), siteChanges: { lines: [], stale: true } }], pending: false, ...handlers }));
    expect(stale).toContain("Your website changed while the AI was working");
    expect(stale).not.toContain("Changed on your website");
    expect(stale).not.toContain(">Undo<");
  });

  it("shows the typing indicator while waiting", () => {
    expect(render(createElement(ChatMessages, { messages: [], pending: true, ...handlers }))).toContain("Working on it");
  });
});

describe("the credits chip", () => {
  it("shows the number left with an accessible label, linking to the plan page", () => {
    const html = render(createElement(CreditsChip, { credits: 42 }));
    expect(html).toContain('href="/settings/plan"');
    expect(html).toContain('aria-label="42 AI credits left"');
    expect(html).toContain(">42<");
    expect(html).not.toContain("bg-accent-soft");
  });

  it("warns at 3 or fewer and offers credits at none", () => {
    expect(render(createElement(CreditsChip, { credits: 3 }))).toContain("bg-accent-soft");
    expect(render(createElement(CreditsChip, { credits: 1 }))).toContain('aria-label="1 AI credit left"');
    const none = render(createElement(CreditsChip, { credits: 0 }));
    expect(none).toContain('aria-label="No AI credits left"');
    expect(none).toContain("Get AI credits");
  });

  it("reads in Arabic", () => {
    expect(render(createElement(CreditsChip, { credits: 2 }), "ar")).toContain("بقي رصيدان من الذكاء الاصطناعي");
  });
});

describe("the chat panel", () => {
  const editor = (patch: Partial<EditorAssistantApi> = {}): EditorAssistantApi => ({
    readOnly: false,
    compact: false,
    pageId: "22222222-2222-4222-8222-222222222222",
    contentLocale: "en",
    mention: null,
    target: { kind: "page" },
    clearMention: noop,
    flush: async () => true,
    applyTurn: () => ({ applied: [], undoMarker: null, stale: false }),
    canUndo: () => false,
    undo: noop,
    refreshData: noop,
    showCanvas: noop,
    ...patch,
  });
  const panel = (api: EditorAssistantApi, credits: number | null = 12) => {
    const chat = createEditWithAiChat({ uiLocale: "en", actions: {} as ChatActions, uploadFile: vi.fn(), beforeTurn: async () => true, applySiteTurn: vi.fn() });
    return render(createElement(EditWithAiPanel, { api, apiRef: { current: null }, chat, storeId: "s1", credits }));
  };

  it("starts with the suggestions and the credits left, and has no top bar of its own", () => {
    const html = panel(editor());
    for (const chip of ["Change the hero image", "Add an FAQ section", "Add a new product from a photo", "Change the announcement bar text", "Import products from a file"]) expect(html).toContain(chip);
    expect(html).toContain('aria-label="12 AI credits left"');
    expect(html).not.toContain("<header");
    expect(html).not.toContain("<iframe");
    // The canvas is beside the chat from lg up: no Preview button.
    expect(html).not.toContain(">Preview<");
  });

  it("hides the credits before the USD switch", () => {
    expect(panel(editor(), null)).not.toContain("AI credits left");
  });

  it("shows the section selected on the canvas as a chip that can be removed", () => {
    const html = panel(editor({ mention: { key: "page:s-hero", ref: { target: "page", sectionId: "s-hero" }, label: "Hero", context: "Home", kind: "tree" }, target: { kind: "page", sectionId: "s-hero" } }));
    expect(html).toContain(">Hero<");
    expect(html).toContain("Remove the section from the message");
    expect(html).toContain("What should change in “Hero”?");
  });

  it("below lg the chat fills the screen and a Preview button opens the canvas", () => {
    expect(panel(editor({ compact: true }))).toContain("Preview</button>");
  });

  it("a read-only store can't send", () => {
    const html = panel(editor({ readOnly: true }));
    expect(html).toContain("the chat is read-only");
    expect(html).toMatch(/<textarea[^>]*disabled=""/);
  });
});
