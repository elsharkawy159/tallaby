import { currencyLabelText, parseStoreCurrency } from "@workspace/lib";
import { getStorePreviewProduct } from "@workspace/lib/store-sites/preview-product";
import { storeUrl } from "@workspace/lib/storefront";
import { findActiveCustomDomainForSubdomain } from "@workspace/lib/storefront/server";
import type { EditorAgentTurnView } from "@workspace/store-editor";
import type { SiteLocale } from "@workspace/store-sections";
import type { runEditorAgentTurn } from "@workspace/store-sections/agent-server";
import { codePreviewQueries, prepareCodePreview, renderPreparedCodePreview } from "@workspace/store-sections/code-preview";
import { loadCodePreviewCatalog, type loadCodePreviewStore } from "./code-preview.data";

/**
 * The canvas previews of the code elements an AI turn wrote (the editor's
 * agent, F-83c, and Edit with AI), through the same path as the Code tab's
 * preview. Server only; the store must already be checked against the session
 * seller, and every read is scoped to it again. Never cached.
 */

type StoreRow = NonNullable<Awaited<ReturnType<typeof loadCodePreviewStore>>>;
type CodeNodes = Awaited<ReturnType<typeof runEditorAgentTurn>>["codeNodes"];

/** Stored image path or URL to a URL, as the editor canvas resolves it (same as the code preview). */
function imageUrl(path: string): string | null {
  if (!path) return null;
  if (/^(https?:)?\/\//.test(path)) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/sellers/${path}`;
}

export async function renderAgentCodePreviews(
  sellerId: string,
  storeId: string,
  row: StoreRow,
  locale: SiteLocale,
  defaultLocale: SiteLocale,
  nodes: CodeNodes,
): Promise<EditorAgentTurnView["previews"]> {
  const pageType = row.pageKind === "product" ? "product" : "page";
  const [product, customDomain] = await Promise.all([
    pageType === "product" ? getStorePreviewProduct(sellerId, storeId, undefined, { locale }).catch(() => null) : null,
    findActiveCustomDomainForSubdomain(row.subdomain).catch(() => null),
  ]);
  const { currency, label } = parseStoreCurrency(row.settings);
  const out: EditorAgentTurnView["previews"] = {};
  await Promise.all(
    nodes.map(async (node) => {
      const prepared = prepareCodePreview({ nodeId: node.nodeId, file: node.file, name: node.props.name, settings: node.props.settings, blocks: node.props.blocks });
      const catalog = await loadCodePreviewCatalog(sellerId, storeId, codePreviewQueries(prepared), locale);
      const rendered = renderPreparedCodePreview(prepared, node.file, {
        locale,
        pageType,
        storeId,
        store: { name: row.name, url: storeUrl(row.subdomain, customDomain), logoUrl: row.logoUrl },
        currency,
        currencyLabel: currencyLabelText(label, locale),
        // Liquid's URLs follow the storefront's language rule for this store (as the Code tab's preview).
        defaultLocale,
        designSystem: { colors: row.colors, typography: row.typography, spacing: row.spacing },
        catalog,
        product,
        imageUrl,
      });
      out[node.nodeId] = { html: rendered.html, css: rendered.css, props: rendered.props as unknown as Record<string, unknown> };
    }),
  );
  return out;
}
