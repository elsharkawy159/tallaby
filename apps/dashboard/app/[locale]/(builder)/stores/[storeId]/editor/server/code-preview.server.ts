"use server";

import { currencyLabelText, parseStoreCurrency } from "@workspace/lib";
import { getStorePreviewProduct } from "@workspace/lib/store-sites/preview-product";
import { storeUrl } from "@workspace/lib/storefront";
import { findActiveCustomDomainForSubdomain } from "@workspace/lib/storefront/server";
import type { CodePreviewView, EditorAdapter } from "@workspace/store-editor";
import { EDITOR_ERRORS, type EditorErrorKey, type EditorResult } from "@workspace/store-editor/editor.dto";
import { codePreviewQueries, prepareCodePreview, renderPreparedCodePreview } from "@workspace/store-sections/code-preview";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { isSwitchOn } from "@/lib/stores/platform-switches.server";
import { codePreviewInputSchema } from "./code-preview.dto";
import { loadCodePreviewCatalog, loadCodePreviewStore } from "./code-preview.data";

type CodePreviewInput = Parameters<NonNullable<EditorAdapter["code"]>["preview"]>[0];

/** The canvas debounces at 400 ms; 60 a minute per seller is ample for typing. Per server instance (`rate-limit.lib`). */
const codePreviewLimiter = createRateLimiter({ limit: 60, windowMs: 60_000 });

const fail = (error: EditorErrorKey): EditorResult<CodePreviewView> => ({ success: false, error: EDITOR_ERRORS[error] ?? error });

/** Stored image path or URL to a URL, as the editor canvas resolves it. */
function imageUrl(path: string): string | null {
  if (!path) return null;
  if (/^(https?:)?\/\//.test(path)) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/sellers/${path}`;
}

/**
 * Code sections (ROADMAP F-101e, code-sections design §5.2): checks, normalises
 * and renders one draft `code` node for the editor canvas, with the store's
 * own data. In order: the store belongs to the session seller and can be
 * edited (as `saveDraft`), the `code_sections` switch is on, the per-seller
 * limit, the input caps. Never cached; never logs the template or the values.
 */
export async function previewCodeNode(storeId: string, input: CodePreviewInput): Promise<EditorResult<CodePreviewView>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!(await isSwitchOn("code_sections"))) return fail("notFound");
    if (!codePreviewLimiter.check(`code:${seller.sellerId}`)) return fail("rateLimited");
    const parsed = codePreviewInputSchema.safeParse(input);
    if (!parsed.success) return fail("invalidInput");
    const { nodeId, file, settings, blocks, locale, pageId, productId } = parsed.data;

    const row = await loadCodePreviewStore(seller.sellerId, store.id, pageId);
    if (!row) return fail("notFound");
    // A page of another store (or none) is a builder page; only this store's product page is `product`.
    const pageType = row.pageKind === "product" ? "product" : "page";

    const prepared = prepareCodePreview({ nodeId, file, settings, blocks });
    const [catalog, product, customDomain] = await Promise.all([
      loadCodePreviewCatalog(seller.sellerId, store.id, codePreviewQueries(prepared), locale),
      // The product page canvas's product, through the same store-checked path as `previewProduct`.
      pageType === "product" ? getStorePreviewProduct(seller.sellerId, store.id, productId, { locale }).catch(() => null) : null,
      findActiveCustomDomainForSubdomain(row.subdomain).catch(() => null),
    ]);
    const { currency, label } = parseStoreCurrency(row.settings);
    const result = renderPreparedCodePreview(prepared, file, {
      locale,
      pageType,
      storeId: store.id,
      store: { name: row.name, url: storeUrl(row.subdomain, customDomain), logoUrl: row.logoUrl },
      currency,
      currencyLabel: currencyLabelText(label, locale),
      designSystem: { colors: row.colors, typography: row.typography, spacing: row.spacing },
      catalog,
      product,
      imageUrl,
    });
    return { success: true, data: { props: result.props, issues: result.issues, html: result.html, css: result.css } };
  } catch (error) {
    if (isAccessError(error)) return fail(error.code === "store_read_only" ? "readOnly" : "notFound");
    // Ids only: never the file or the values.
    console.error("[code-preview] failed", { storeId: String(storeId) });
    return fail("generic");
  }
}
