/**
 * Tallaby Classic (PLAN.md P4-03, §8.1): the existing default storefront as
 * sections. Classic must look exactly like today's storefront, whose pieces
 * depend on ecommerce internals (server translations, product cards, search
 * and paging state), so these sections do not re-implement them: they hand
 * rendering to the host through `ctx.renderClassic`. The storefront maps each
 * part to its existing component (no visual change by construction); the
 * editor supplies previews.
 */
import { z } from "zod";
import type { SectionDefinition } from "../core/types";
import { text } from "./_primitives";

export const CLASSIC_PARTS = ["classic-header", "classic-hero", "classic-categories", "classic-catalog", "classic-footer"] as const;
export type ClassicPart = (typeof CLASSIC_PARTS)[number];

function classic<P extends Record<string, unknown>>(
  id: ClassicPart,
  meta: Pick<SectionDefinition<P>, "category" | "displayName" | "description" | "propsSchema" | "defaultProps" | "propDefinitions"> & {
    chrome?: "header" | "footer";
  },
): SectionDefinition<P> {
  return {
    id,
    version: 1,
    ...meta,
    Component: ({ props, ctx }) => <>{ctx.renderClassic?.(id, props) ?? null}</>,
  };
}

const empty = z.object({});

export const classicHeader = classic("classic-header", {
  category: "header",
  chrome: "header",
  displayName: { ar: "رأس طلبي الكلاسيكي", en: "Classic header" },
  description: { ar: "الشعار والاسم والبحث والسلة واللغة.", en: "Logo, name, search, cart and language." },
  propsSchema: empty,
  defaultProps: {},
  propDefinitions: [],
});

export const classicHero = classic("classic-hero", {
  category: "hero",
  displayName: { ar: "واجهة المتجر", en: "Store front" },
  description: { ar: "اسم متجرك وشعاره وغلافه وتقييمه.", en: "Your store's name, logo, cover and rating." },
  propsSchema: empty,
  defaultProps: {},
  propDefinitions: [],
});

const categoriesSchema = z.object({ title: text(120) });
export const classicCategories = classic<z.infer<typeof categoriesSchema>>("classic-categories", {
  category: "commerce",
  displayName: { ar: "دوائر الأقسام", en: "Category circles" },
  description: { ar: "أقسام متجرك في صف من الدوائر.", en: "Your store's categories as a row of circles." },
  propsSchema: categoriesSchema,
  defaultProps: { title: "" },
  propDefinitions: [
    { key: "title", label: { ar: "عنوان (اختياري)", en: "Title (optional)" }, type: "text", maxLength: 120, translatable: true },
  ],
});

export const classicCatalog = classic("classic-catalog", {
  category: "commerce",
  displayName: { ar: "كل المنتجات", en: "All products" },
  description: { ar: "كل منتجاتك مع البحث والترتيب والتصفح.", en: "All your products with search, sorting and paging." },
  propsSchema: empty,
  defaultProps: {},
  propDefinitions: [],
});

export const classicFooter = classic("classic-footer", {
  category: "footer",
  chrome: "footer",
  displayName: { ar: "تذييل طلبي الكلاسيكي", en: "Classic footer" },
  description: { ar: "التواصل والسياسات وروابط المتجر.", en: "Contact, policies and store links." },
  propsSchema: empty,
  defaultProps: {},
  propDefinitions: [],
});

export const CLASSIC_SECTIONS = [classicHeader, classicHero, classicCategories, classicCatalog, classicFooter];
