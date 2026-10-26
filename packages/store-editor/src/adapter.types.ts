import type {
  EditorCatalogSnapshot,
  EditorForm,
  EditorFormSummary,
  EditorResult,
  ExploreResult,
  FormsActionResult,
  MediaAssetView,
  MediaFolderView,
  MediaLibraryView,
  MediaResult,
  StockPhotoPage,
  StoreRevisionRow,
} from "./editor.dto";
import type { SiteLocale } from "@workspace/store-sections";
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
   * Saves an uploaded media URL as the store's logo (the one every header and
   * footer shows). Hosts without a store profile (template and section editing)
   * leave it out, and the canvas then shows no logo uploader.
   */
  saveLogo?(logoUrl: string): Promise<EditorResult<null>>;

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
    apply(key: string): Promise<TemplateActionResult<{ pagesUpdated: number; pagesCreated: number }>>;
    preview(key: string): Promise<TemplateActionResult<TemplatePreviewView>>;
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
