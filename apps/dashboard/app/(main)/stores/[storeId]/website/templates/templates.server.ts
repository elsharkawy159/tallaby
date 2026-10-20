"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { buildTemplateForm, getFormTemplate } from "@workspace/lib/store-forms";
import { applyStoreTemplate, getStoreTemplateConfig, undoStoreTemplate } from "@workspace/lib/store-sites/server";
import { contentOverrideKeys, storeSectionRegistry } from "@workspace/store-sections/render";
import { getCodeTemplate } from "@workspace/store-sections/templates";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { TEMPLATE_ERRORS, type TemplateActionResult, type TemplatePreviewView } from "./templates.dto";

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

/** Read-only: the template's pages and look for the preview dialog (not rate-limited, no write access needed). */
export async function templatePreview(storeId: string, templateKey: string): Promise<TemplateActionResult<TemplatePreviewView>> {
  try {
    const { seller, store } = await requireStore(String(storeId));
    const config = await getStoreTemplateConfig(seller.sellerId, store.id, String(templateKey));
    if (!config) return { success: false, error: "templateNotFound" };
    return {
      success: true,
      data: {
        designSystem: config.designSystem,
        header: config.header,
        footer: config.footer,
        pages: config.pages.map((page) => ({ slug: page.slug, isHome: page.isHome, name: page.name, sections: page.content.sections, content: page.content })),
        // Code templates bring a demo store, so the preview looks like the template's kind of shop.
        demo: getCodeTemplate(String(templateKey))?.demo ?? null,
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
