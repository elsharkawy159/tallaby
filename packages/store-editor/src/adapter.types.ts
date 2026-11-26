import type {
  AiTranslateSummary,
  EditorCatalogSnapshot,
  EditorForm,
  EditorFormSummary,
  EditorResult,
  ExploreResult,
  FillTranslationsSummary,
  FormsActionResult,
  MediaAssetView,
  MediaFolderView,
  MediaLibraryView,
  MediaResult,
  StockPhotoPage,
  StoreRevisionRow,
} from "./editor.dto";
import type { SiteLocale } from "@workspace/store-sections";
import type { SectionOp } from "@workspace/store-sections/agent";
import type { ProductDetail } from "@workspace/store-sections/render";
import type { TemplateActionResult, TemplatePreviewView } from "./templates.dto";
import type { EditorLinkOverrides } from "./lib/editor-links.lib";
import type { ReactNode } from "react";

export type { EditorLinkOverrides, EditorLinks } from "./lib/editor-links.lib";

export type EditorCapabilities = {
  /** Pages panel + page CRUD (false for a section). */
  pages: boolean;
  /** Add > Templates (false for template/section editing). */
  templates: boolean;
  /** Forms panel. */
  forms: boolean;
  /** Stock-photo Explore tab. */
  explore: boolean;
  /** Full library; false = upload-only picker. */
  mediaLibrary: boolean;
  revisions: boolean;
  unpublish: boolean;
  /** "Preview on my store" link. */
  preview: boolean;
  /** Section/template canvas: pick the industry used for photo slots. */
  industrySwitcher: boolean;
  /**
   * The host saves the design system and the shared header/footer: the Brand
   * tab and header/footer entry points show only then (false for a section).
   */
  designSystem: boolean;
  publishLabel: "site" | "templateVersion" | "section";
};

/** Versions of the saved drafts, for noticing edits made elsewhere (only some adapters provide it). */
export type DraftVersions = {
  pages: Record<string, number>;
  designVersion: number;
  chromeVersion: number;
  editedByAdminAt: string | null;
};

type Localized = { ar?: string; en?: string };

/** What the canvas sends to preview one code node (F-101e). */
export type CodePreviewInput = {
  nodeId: string;
  /** The joined section file (Liquid + {% stylesheet %} + {% schema %}), as edited in the Code tab. */
  file: string;
  /** The seller's current values; normalised against the file's schema by the host. */
  settings: unknown;
  blocks: unknown;
  locale: SiteLocale;
  /** The page being edited, so the host knows the page type (builder page or product page). */
  pageId?: string;
  /** The product page canvas's product, when the node sits on the product page. */
  productId?: string;
};

/**
 * One problem in the file, positioned in the joined file (1-based). `code` and
 * `params` pick the seller's-language text (`storeEditor.code.issues`);
 * `message` is the host's English fallback.
 */
export type CodeIssueView = { code: string; message: string; params?: Record<string, string | number>; line?: number; column?: number };

export type CodePreviewView = {
  /** The node's props to store (`apiVersion`, `source`, `css`, `schema`, `settings`, `blocks`, `name`), normalised by the host. */
  props: Record<string, unknown>;
  issues: CodeIssueView[];
  /** Cleaned HTML for the canvas (already through the server's HTML cleaner); '' when it failed to render. */
  html: string;
  /** The node's CSS, already scoped to `[data-node-id="<nodeId>"]` and checked. */
  css: string;
};

export type { AgentDevice, AgentTarget, AppliedOp, RejectedOp, SectionOp, SectionOpName, SectionOpRejectCode } from "@workspace/store-sections/agent";

/** One message of the editor agent's chat (F-83c). */
export type EditorAgentHistoryTurn = { role: "user" | "assistant"; text: string };

/**
 * What the editor sends for one agent turn. `section` is the targeted section
 * from the seller's unsaved draft (the host validates it, never trusts it);
 * `outline` is the page's sections in order (id, name, kind: "tree" | "code").
 */
export type EditorAgentTurnInput = {
  message: string;
  uiLocale: SiteLocale;
  contentLocale: SiteLocale;
  pageId?: string;
  target: { kind: "page" | "header" | "footer"; sectionId?: string };
  section?: unknown;
  outline: { id: string; name: string; kind: string }[];
  history: EditorAgentHistoryTurn[];
};

export type EditorAgentTurnView = {
  /** The agent's answer, in the seller's language (≤ 600 characters). */
  reply: string;
  /**
   * The ops to apply, in order, normalised by the host (cleaned values, new
   * ids filled in): apply them with `applySectionOps` from
   * `@workspace/store-sections/agent` to the draft, as one undo step.
   */
  ops: SectionOp[];
  /** One line per applied op, in the UI language. */
  applied: string[];
  /** The model's ops the host refused (index in the model's list). */
  rejected: { index: number; code: string }[];
  /** Canvas previews of the code elements the ops wrote, by code node id (html already cleaned, css scoped). */
  previews: Record<string, { html: string; css: string; props: Record<string, unknown> }>;
  /** AI credits this turn used (0 when no op applied). */
  creditsUsed: number;
};

/**
 * What the editor needs from its host. Every method closes over the target
 * (store, template, section), so none takes a storeId. Parameter and return
 * types mirror the dashboard actions each method wraps, minus the leading
 * storeId.
 */
export type EditorAdapter = {
  capabilities: EditorCapabilities;
  /** Links to the host's own pages; absent = the seller dashboard's (editor-links.lib), null hides one. */
  links?: EditorLinkOverrides;
  /** Replaces Add › Sections (the admin section editor lists every library section to switch to). */
  sectionsTab?: ReactNode;
  saveDraft(pageId: string, content: unknown, clientVersion: number): Promise<EditorResult<{ draftVersion: number }>>;
  saveDesignSystem(designSystem: unknown, clientVersion: number): Promise<EditorResult<{ version: number }>>;
  saveChrome(part: "header" | "footer", instance: unknown, clientVersion: number): Promise<EditorResult<{ version: number }>>;
  draftVersions?(): Promise<EditorResult<DraftVersions>>;
  refreshData(): Promise<EditorResult<EditorCatalogSnapshot>>;
  /**
   * The product page canvas's product: `productId`, or the newest product the
   * store shows; null when there is none (the canvas draws DEMO_PRODUCT).
   * Hosts without one (template and section editing) always draw DEMO_PRODUCT.
   */
  previewProduct?(productId: string | undefined, locale: SiteLocale): Promise<EditorResult<ProductDetail | null>>;
  publish(): Promise<EditorResult<{ revisionId: string; revisionNumber: number }>>;
  /**
   * More › Fill missing translations: the host fills the drafts' template text
   * in the language it is missing (from the code templates) and the editor
   * reloads. Hosts without store drafts leave it out.
   */
  fillTranslations?(): Promise<EditorResult<FillTranslationsSummary>>;
  /**
   * The AI step after it, offered when `fillTranslations` reports `untranslated`
   * texts and `ai`: the host translates them with AI, charging the seller's AI
   * credits, and writes them into the empty language of the drafts only.
   */
  translateWithAi?(): Promise<EditorResult<AiTranslateSummary>>;

  /**
   * Code sections (ROADMAP F-101e): the host checks, normalises and renders one
   * `code` node on the server for the canvas. Liquid never runs in the browser,
   * and the canvas only ever shows the cleaned HTML this returns. Absent (or the
   * platform switch off) = no "Code section" in Add and no Code tab.
   */
  code?: {
    preview(input: CodePreviewInput): Promise<EditorResult<CodePreviewView>>;
  };

  /**
   * The editor's AI agent (F-83c, F-101g/j): one chat turn about a section or
   * the page. The host returns validated ops that the editor applies to its
   * drafts; it writes nothing itself. Absent = no agent.
   */
  agent?: {
    turn(input: EditorAgentTurnInput): Promise<EditorResult<EditorAgentTurnView>>;
  };

  // Optional groups; present iff the matching capability is true.
  pages?: {
    create(input: { name: Localized; slug: string }): Promise<EditorResult<{ id: string; slug: string }>>;
    update(pageId: string, input: { name?: Localized; slug?: string; seo?: unknown; showInNav?: boolean }): Promise<EditorResult<null>>;
    remove(pageId: string): Promise<EditorResult<null>>;
    reorder(pageIds: string[]): Promise<EditorResult<null>>;
  };
  revisions?: {
    list(): Promise<EditorResult<StoreRevisionRow[]>>;
    restore(revisionId: string): Promise<EditorResult<{ pages: number }>>;
    discard(): Promise<EditorResult<{ pages: number }>>;
  };
  unpublish?(): Promise<EditorResult<null>>;
  siteStatus?(): Promise<
    EditorResult<{ siteStatus: "draft" | "published" | "unpublished"; isLive: boolean; lastPublishedAt: string | null; hasUnpublishedChanges: boolean }>
  >;
  previewLink?(): Promise<EditorResult<{ url: string; expiresAt: number }>>;
  templates?: {
    /** `editionId`: a niche id from the card's `editions` (the template built with that niche's edition); the host checks it. */
    apply(key: string, editionId?: string | null): Promise<TemplateActionResult<{ pagesUpdated: number; pagesCreated: number }>>;
    preview(key: string, editionId?: string | null): Promise<TemplateActionResult<TemplatePreviewView>>;
    undo(): Promise<TemplateActionResult<{ templateKey: string }>>;
  };
  forms?: {
    list(): Promise<EditorResult<{ forms: EditorForm[]; summaries: EditorFormSummary[] }>>;
    createFromTemplate(templateId: unknown): Promise<FormsActionResult<{ id: string }>>;
  };
  explore?: {
    search(query: string, page?: number): Promise<ExploreResult<StockPhotoPage>>;
    import(photoId: string): Promise<ExploreResult<MediaAssetView>>;
  };
  /**
   * Upload-only hosts implement createUploadPaths + uploadFile + recordUpload
   * and return `{ success: false, error: "notFound" }` for the rest.
   */
  media: {
    list(query?: { folderId?: string | null; scope?: "all" | "store" | "shared" }): Promise<MediaResult<MediaLibraryView>>;
    createUploadPaths(input: { shared: boolean; types: string[] }): Promise<MediaResult<string[]>>;
    /** Puts the file's bytes at a path from createUploadPaths (browser upload); throws on failure. */
    uploadFile(path: string, file: File): Promise<void>;
    recordUpload(input: {
      storagePath: string;
      filename: string;
      width?: number | null;
      height?: number | null;
      folderId?: string | null;
    }): Promise<MediaResult<MediaAssetView>>;
    update(assetId: string, input: { altText?: { ar?: string; en?: string }; folderId?: string | null }): Promise<MediaResult<MediaAssetView>>;
    remove(assetId: string): Promise<MediaResult<null>>;
    createFolder(input: { name: string; parentId?: string | null; shared: boolean }): Promise<MediaResult<MediaFolderView>>;
    renameFolder(folderId: string, name: string): Promise<MediaResult<MediaFolderView>>;
    deleteFolder(folderId: string): Promise<MediaResult<null>>;
  };
};
