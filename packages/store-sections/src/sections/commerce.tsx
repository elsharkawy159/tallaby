import { z } from "zod";
import { sectionText } from "../core/copy";
import type { SectionDefinition } from "../core/types";
import { EmptyState, ProductCardView, SectionHeading, SectionImage, SectionShell, SmartLink, cn, text } from "./_primitives";

const uuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

// ---------------------------------------------------------------------------
// product-grid
// ---------------------------------------------------------------------------

const productGridSchema = z.object({
  title: text(120),
  source: z.enum(["newest", "featured", "category", "selected"]).catch("newest"),
  categoryId: uuid.nullable().catch(null),
  productIds: z.array(uuid).max(48).catch([]),
  limit: z.number().int().min(1).max(48).catch(8),
  columns: z.enum(["2", "3", "4"]).catch("4"),
  showViewAll: z.boolean().catch(true),
});
type ProductGridProps = z.infer<typeof productGridSchema>;

export const productGrid: SectionDefinition<ProductGridProps> = {
  id: "product-grid",
  version: 1,
  category: "commerce",
  displayName: { ar: "شبكة منتجات", en: "Product grid" },
  description: {
    ar: "منتجات من متجرك: الأحدث أو المميزة أو من قسم أو تختارها بنفسك.",
    en: "Products from your store: newest, featured, one category, or your own picks.",
  },
  propsSchema: productGridSchema,
  defaultProps: {
    title: "أحدث المنتجات",
    source: "newest",
    categoryId: null,
    productIds: [],
    limit: 8,
    columns: "4",
    showViewAll: true,
  },
  propDefinitions: [
    { key: "title", label: { ar: "العنوان", en: "Title" }, type: "text", maxLength: 120, translatable: true },
    {
      key: "source",
      label: { ar: "المنتجات المعروضة", en: "Which products" },
      type: "select",
      options: [
        { value: "newest", label: { ar: "الأحدث", en: "Newest" } },
        { value: "featured", label: { ar: "المميزة", en: "Featured" } },
        { value: "category", label: { ar: "من قسم", en: "From a category" } },
        { value: "selected", label: { ar: "أختارها بنفسي", en: "I'll pick them" } },
      ],
    },
    { key: "categoryId", label: { ar: "القسم", en: "Category" }, type: "category" },
    { key: "productIds", label: { ar: "المنتجات", en: "Products" }, type: "products" },
    { key: "limit", label: { ar: "العدد", en: "How many" }, type: "number", min: 1, max: 48 },
    {
      key: "columns",
      label: { ar: "عدد الأعمدة", en: "Columns" },
      type: "select",
      group: "layout",
      options: [
        { value: "2", label: { ar: "2", en: "2" } },
        { value: "3", label: { ar: "3", en: "3" } },
        { value: "4", label: { ar: "4", en: "4" } },
      ],
    },
    { key: "showViewAll", label: { ar: "زر عرض الكل", en: "View all button" }, type: "switch" },
  ],
  catalogQuery: (props) => ({
    kind: "products",
    source: props.source,
    categoryId: props.source === "category" ? props.categoryId : null,
    productIds: props.source === "selected" ? props.productIds : undefined,
    limit: props.source === "selected" ? Math.min(props.productIds.length || props.limit, 48) : props.limit,
  }),
  Component: ({ instance, props, ctx }) => {
    const products = ctx.catalog.products[instance.id] ?? [];
    return (
      <SectionShell id="products">
        <SectionHeading
          title={props.title}
          action={
            props.showViewAll && products.length > 0 ? (
              <SmartLink ctx={ctx} href="/#products" className="text-sm font-semibold text-(--sf-brand)">
                {sectionText("viewAll", ctx.locale)}
              </SmartLink>
            ) : null
          }
        />
        {products.length === 0 ? (
          <EmptyState>{sectionText("noProducts", ctx.locale)}</EmptyState>
        ) : (
          <ul className={cn("grid grid-cols-2 gap-3 md:gap-4", props.columns === "3" && "md:grid-cols-3", props.columns === "4" && "md:grid-cols-3 lg:grid-cols-4")}>
            {products.map((product) => (
              <li key={product.id}>
                <ProductCardView product={product} ctx={ctx} />
              </li>
            ))}
          </ul>
        )}
      </SectionShell>
    );
  },
};

// ---------------------------------------------------------------------------
// featured-product
// ---------------------------------------------------------------------------

const featuredSchema = z.object({
  title: text(120),
  text: text(600),
  productId: uuid.nullable().catch(null),
  ctaLabel: text(40),
});
type FeaturedProps = z.infer<typeof featuredSchema>;

export const featuredProduct: SectionDefinition<FeaturedProps> = {
  id: "featured-product",
  version: 1,
  category: "commerce",
  displayName: { ar: "منتج مميز", en: "Featured product" },
  description: { ar: "منتج واحد بصورة كبيرة ووصف.", en: "One product with a large image and a description." },
  propsSchema: featuredSchema,
  defaultProps: { title: "", text: "", productId: null, ctaLabel: "اطلب الآن" },
  propDefinitions: [
    { key: "productId", label: { ar: "المنتج", en: "Product" }, type: "product" },
    { key: "title", label: { ar: "عنوان (اختياري)", en: "Title (optional)" }, type: "text", maxLength: 120, translatable: true },
    { key: "text", label: { ar: "وصف", en: "Description" }, type: "textarea", maxLength: 600, translatable: true },
    { key: "ctaLabel", label: { ar: "نص الزر", en: "Button text" }, type: "text", maxLength: 40, translatable: true },
  ],
  catalogQuery: (props) => (props.productId ? { kind: "products", source: "selected", productIds: [props.productId], limit: 1 } : null),
  Component: ({ instance, props, ctx }) => {
    const product = ctx.catalog.products[instance.id]?.[0];
    if (!product) return ctx.mode === "edit" ? <SectionShell><EmptyState>{sectionText("pickProduct", ctx.locale)}</EmptyState></SectionShell> : null;
    return (
      <SectionShell>
        <div className="grid items-center gap-8 md:grid-cols-2">
          <SmartLink ctx={ctx} href={product.href} className="block overflow-hidden rounded-(--sf-radius,12px) bg-(--sf-shelf)">
            <SectionImage ctx={ctx} src={product.image} alt={product.title} className="aspect-square w-full" />
          </SmartLink>
          <div className="space-y-4">
            <h2 className="text-balance text-2xl font-bold md:text-3xl">{props.title || product.title}</h2>
            {props.text && <p className="whitespace-pre-line text-pretty leading-relaxed text-(--sf-muted)">{props.text}</p>}
            {product.price != null && (
              <p className="text-xl font-bold tabular-nums" dir="ltr">
                {ctx.formatPrice(product.price)}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              {ctx.renderAddToCart?.(product)}
              {props.ctaLabel && (
                <SmartLink
                  ctx={ctx}
                  href={product.href}
                  className="inline-flex h-11 items-center rounded-(--sf-radius,12px) border border-(--sf-line) px-6 text-sm font-semibold"
                >
                  {props.ctaLabel}
                </SmartLink>
              )}
            </div>
          </div>
        </div>
      </SectionShell>
    );
  },
};

// ---------------------------------------------------------------------------
// category-grid
// ---------------------------------------------------------------------------

const categoryGridSchema = z.object({
  title: text(120),
  style: z.enum(["circles", "cards"]).catch("circles"),
  limit: z.number().int().min(1).max(24).catch(8),
});
type CategoryGridProps = z.infer<typeof categoryGridSchema>;

export const categoryGrid: SectionDefinition<CategoryGridProps> = {
  id: "category-grid",
  version: 1,
  category: "commerce",
  displayName: { ar: "الأقسام", en: "Categories" },
  description: { ar: "أقسام متجرك مع صورها.", en: "Your store's categories with images." },
  propsSchema: categoryGridSchema,
  defaultProps: { title: "تسوق حسب القسم", style: "circles", limit: 8 },
  propDefinitions: [
    { key: "title", label: { ar: "العنوان", en: "Title" }, type: "text", maxLength: 120, translatable: true },
    {
      key: "style",
      label: { ar: "الشكل", en: "Style" },
      type: "select",
      group: "layout",
      options: [
        { value: "circles", label: { ar: "دوائر", en: "Circles" } },
        { value: "cards", label: { ar: "بطاقات", en: "Cards" } },
      ],
    },
    { key: "limit", label: { ar: "العدد", en: "How many" }, type: "number", min: 1, max: 24 },
  ],
  catalogQuery: (props) => ({ kind: "categories", limit: props.limit }),
  Component: ({ props, ctx }) => {
    const categories = ctx.catalog.categories.slice(0, props.limit);
    if (categories.length === 0) {
      return ctx.mode === "edit" ? <SectionShell><EmptyState>{sectionText("noCategories", ctx.locale)}</EmptyState></SectionShell> : null;
    }
    return (
      <SectionShell>
        <SectionHeading title={props.title} />
        {props.style === "circles" ? (
          <ul className="flex gap-4 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible">
            {categories.map((category) => (
              <li key={category.id} className="w-24 shrink-0 md:w-28">
                <SmartLink ctx={ctx} href={category.href} className="flex flex-col items-center gap-2 text-center">
                  <SectionImage ctx={ctx} src={category.image} alt="" className="size-20 rounded-full border border-(--sf-line) md:size-24" />
                  <span className="line-clamp-2 text-sm font-medium">{category.name}</span>
                </SmartLink>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {categories.map((category) => (
              <li key={category.id}>
                <SmartLink ctx={ctx} href={category.href} className="group relative block overflow-hidden rounded-(--sf-radius,12px)">
                  <SectionImage ctx={ctx} src={category.image} alt="" className="aspect-[4/3] w-full transition-transform group-hover:scale-[1.03]" />
                  <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-3 font-semibold text-white">
                    {category.name}
                  </span>
                </SmartLink>
              </li>
            ))}
          </ul>
        )}
      </SectionShell>
    );
  },
};
