"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { buildTemplateForm, getFormTemplate } from "@workspace/lib/store-forms";
import { applyStoreTemplate, getStoreTemplateConfig, getTemplateMeta, listStoreTemplates, undoStoreTemplate } from "@workspace/lib/store-sites/server";
import { getStore } from "@workspace/lib/stores/server";
import { contentOverrideKeys, storeSectionRegistry } from "@workspace/store-sections/render";
import { storeBuilderEnabled } from "@/components/dashboard/sidebar.config";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { loadCachedTemplateCards, loadCachedTemplateConfig } from "@/lib/store-templates.data";
import { findIndustry } from "@/lib/stores/industries.lib";
import {
  TEMPLATE_ERRORS,
  type TemplateActionResult,
  type TemplatePreviewView,
  type TemplatesPageQuery,
  type TemplatesPageView,
} from "./templates.dto";
import { pageTemplates, parseTemplatesCategory, parseTemplatesPage, TEMPLATES_PAGE_SIZE, toTemplateCardView } from "./templates.lib";

/**
 * Website › Templates actions (PLAN.md §8.1, P4-05). Applying also creates the
 * ready-made forms the template uses (newsletter, contact) in the store's
 * language, or reuses the store's forms of the same name. The store id is explicit
 * and re-checked with requireStore; the template is chosen by key and must be
 * active. Applying writes drafts only, so the storefront is not invalidated:
 * the live site changes on the next Publish.
 */

const ALLOWED = storeSectionRegistry.allowedSections();
const OVERRIDE_KEYS = contentOverrideKeys(storeSectionRegistry);
const limiter = createRateLimiter({ limit: 20, windowMs: 10 * 60_000 });

/** A ready-made form a template needs (Website › Forms templates), in the store's language. */
async function templateFormInput(kind: string, locale: "ar" | "en") {
  const template = getFormTemplate(kind);
  if (!template) return undefined;
  const t = await getTranslations({ locale, namespace: `storeForms.templates.${template.id}` });
  return buildTemplateForm(template, (key) => t(key as never));
}

type Access = Awaited<ReturnType<typeof requireStore>>;

async function withStore<T>(storeId: string, run: (access: Access) => Promise<TemplateActionResult<T>>): Promise<TemplateActionResult<T>> {
  try {
    const access = await requireStore(String(storeId), { forWrite: true });
    if (!limiter.check(`templates:${access.seller.sellerId}`)) return { success: false, error: "rateLimited" };
    const result = await run(access);
    if (result.success) {
      revalidatePath(`/stores/${access.store.id}/website`, "layout");
      revalidatePath(`/stores/${access.store.id}/editor`);
    }
    return result;
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
    console.error("[website-templates] action failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}

export async function applyTemplate(storeId: string, templateKey: string) {
  return withStore<{ pagesUpdated: number; pagesCreated: number }>(storeId, async ({ seller, store }) => {
    const result = await applyStoreTemplate(seller.sellerId, store.id, String(templateKey), seller.userId, {
      allowedSections: ALLOWED,
      overrideKeys: OVERRIDE_KEYS,
      formInput: templateFormInput,
    });
    if (!result.success) return { success: false, error: TEMPLATE_ERRORS[result.error] ?? "generic" };
    return { success: true, data: { pagesUpdated: result.data.pagesUpdated, pagesCreated: result.data.pagesCreated } };
  });
}

/**
 * Read-only: one page of the gallery for the client (owner request 2026-10-24,
 * React Query). The store is re-checked with requireStore; the store's
 * industry comes from the database, never from the client. Filtering and
 * paging happen here, before the cards' section names are resolved, so only
 * one page of cards is built and sent.
 */
export async function listTemplatesPage(storeId: string, query: Partial<TemplatesPageQuery> = {}): Promise<TemplateActionResult<TemplatesPageView>> {
  try {
    const { seller, store } = await requireStore(String(storeId));
    if (!storeBuilderEnabled(seller.sellerId)) return { success: false, error: "notFound" };
    const [row, gallery] = await Promise.all([getStore(seller.sellerId, store.id), listStoreTemplates(seller.sellerId, store.id, undefined, loadCachedTemplateCards)]);
    if (!row || !gallery) return { success: false, error: "notFound" };

    const industry = findIndustry({ en: row.storeCategory, ar: row.storeCategoryAr });
    const paged = pageTemplates(gallery.templates, {
      page: parseTemplatesPage(query?.page),
      category: parseTemplatesCategory(query?.category),
      industryId: industry?.id,
      seed: store.id,
    });
    const install = gallery.lastInstall;
    return {
      success: true,
      data: {
        items: paged.items.map(toTemplateCardView),
        page: paged.page,
        pageCount: paged.pageCount,
        pageSize: TEMPLATES_PAGE_SIZE,
        total: paged.total,
        categories: paged.categories,
        // A new store's placeholder Tallaby Classic drafts are not the seller's
        // choice (owner 2026-10-27): no "current" template until one is picked.
        currentKey: gallery.templateChosen ? gallery.currentKey : "",
        lastInstall: install
          ? {
              templateKey: install.templateKey,
              installedAt: install.installedAt,
              canUndo: install.canUndo,
              name: gallery.templates.find((tpl) => tpl.key === install.templateKey)?.name ?? null,
            }
          : null,
      },
    };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "notFound" };
    console.error("[website-templates] list failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}

/** Read-only: the template's pages and look for the preview dialog (not rate-limited, no write access needed). */
export async function templatePreview(storeId: string, templateKey: string): Promise<TemplateActionResult<TemplatePreviewView>> {
  try {
    const { seller, store } = await requireStore(String(storeId));
    const config = await getStoreTemplateConfig(seller.sellerId, store.id, String(templateKey), undefined, loadCachedTemplateConfig);
    if (!config) return { success: false, error: "templateNotFound" };
    return {
      success: true,
      data: {
        designSystem: config.designSystem,
        header: config.header,
        footer: config.footer,
        pages: config.pages.map((page) => ({ slug: page.slug, isHome: page.isHome, kind: page.kind, name: page.name, sections: page.content.sections, content: page.content })),
        // Code templates bring a demo store, so the preview looks like the template's kind of shop.
        demo: (await getTemplateMeta(String(templateKey)))?.demo ?? null,
      },
    };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "notFound" };
    console.error("[website-templates] preview failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}

export async function undoTemplate(storeId: string) {
  return withStore<{ templateKey: string }>(storeId, async ({ seller, store }) => {
    const result = await undoStoreTemplate(seller.sellerId, store.id);
    return result.success ? result : { success: false, error: TEMPLATE_ERRORS[result.error] ?? "generic" };
  });
}
