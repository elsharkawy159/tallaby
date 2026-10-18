/**
 * Data states of dynamic sections (P4B-05). In the editor a section without
 * records shows a centred empty state with the host's management action;
 * while data reloads it shows a skeleton; after a failed request it shows an
 * error with Retry, never "Add products". On the storefront none of this is
 * drawn: callers hide the section or show their own short customer message.
 */
import { BookOpen, CircleAlert, FileText, LayoutGrid, Menu, Package, Store, Star, Tag, TicketPercent, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { sectionText, type SectionCopyKey } from "../core/copy";
import type { DataNeed, RenderContext } from "../core/types";
import { SectionShell } from "./_primitives";

const NEED: Record<DataNeed, { icon: LucideIcon; title: SectionCopyKey; body: SectionCopyKey; action: SectionCopyKey }> = {
  products: { icon: Package, title: "emptyProductsTitle", body: "emptyProductsBody", action: "emptyProductsAction" },
  categories: { icon: LayoutGrid, title: "emptyCategoriesTitle", body: "emptyCategoriesBody", action: "emptyCategoriesAction" },
  brands: { icon: Tag, title: "emptyBrandsTitle", body: "emptyBrandsBody", action: "emptyBrandsAction" },
  reviews: { icon: Star, title: "emptyReviewsTitle", body: "emptyReviewsBody", action: "emptyReviewsAction" },
  promotions: { icon: TicketPercent, title: "emptyPromotionsTitle", body: "emptyPromotionsBody", action: "emptyPromotionsAction" },
  articles: { icon: BookOpen, title: "emptyArticlesTitle", body: "emptyArticlesBody", action: "emptyArticlesAction" },
  storeInfo: { icon: Store, title: "emptyStoreInfoTitle", body: "emptyStoreInfoBody", action: "emptyStoreInfoAction" },
  navigation: { icon: Menu, title: "emptyNavigationTitle", body: "emptyNavigationBody", action: "emptyNavigationAction" },
  forms: { icon: FileText, title: "emptyFormsTitle", body: "emptyFormsBody", action: "emptyFormsAction" },
};

/**
 * Class for host-drawn empty-state buttons, so editor actions look the same
 * in every section (solid brand button, store radius).
 */
export const DATA_ACTION_CLASS =
  "inline-flex h-10 items-center justify-center gap-2 rounded-(--sf-radius,12px) bg-(--sf-brand) px-5 text-sm font-semibold text-(--sf-brand-ink,#fff) outline-offset-2 transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-(--sf-brand)";

function Frame({ children, role }: { children: ReactNode; role?: "status" | "alert" }) {
  return (
    <div
      role={role}
      data-editor-only
      className="mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-(--sf-radius,12px) border border-dashed border-(--sf-line) bg-(--sf-paper) px-6 py-10 text-center"
    >
      {children}
    </div>
  );
}

function Badge({ icon: Icon, tone = "neutral" }: { icon: LucideIcon; tone?: "neutral" | "error" }) {
  return (
    <span
      aria-hidden
      className={
        tone === "error"
          ? "grid size-11 place-items-center rounded-xl bg-[color-mix(in_srgb,#dc2626_10%,transparent)] text-[#dc2626]"
          : "grid size-11 place-items-center rounded-xl bg-(--sf-shelf) text-(--sf-brand)"
      }
    >
      <Icon className="size-5" />
    </span>
  );
}

export type DataEmptyProps = {
  need: DataNeed;
  ctx: RenderContext;
  /** Records exist but this section's filters match none: explain instead of asking to create records. */
  filtered?: boolean;
};

/** The editor-only state of a dynamic section without data. Renders nothing on the storefront. */
export function DataEmpty({ need, ctx, filtered = false }: DataEmptyProps) {
  if (ctx.mode !== "edit") return null;
  const data = ctx.editorData;
  const locale = ctx.locale;
  if (data?.state === "error") {
    return (
      <Frame role="alert">
        <Badge icon={CircleAlert} tone="error" />
        <p className="text-base font-semibold text-(--sf-ink)">{sectionText("dataErrorTitle", locale)}</p>
        <p className="text-pretty text-sm text-(--sf-muted)">{sectionText("dataErrorBody", locale)}</p>
        {data.renderRetry(sectionText("dataErrorRetry", locale))}
      </Frame>
    );
  }
  if (data?.state === "refreshing") {
    return (
      <Frame role="status">
        <span aria-hidden className="size-11 animate-pulse rounded-xl bg-(--sf-shelf) motion-reduce:animate-none" />
        <span aria-hidden className="h-4 w-48 animate-pulse rounded bg-(--sf-shelf) motion-reduce:animate-none" />
        <span className="sr-only">{sectionText("dataLoading", locale)}</span>
      </Frame>
    );
  }
  const copy = NEED[need];
  const isFiltered = filtered && need === "products";
  return (
    <Frame>
      <Badge icon={copy.icon} />
      <p className="text-balance text-base font-semibold text-(--sf-ink)">
        {sectionText(isFiltered ? "emptyProductsFilteredTitle" : copy.title, locale)}
      </p>
      <p className="max-w-xs text-pretty text-sm text-(--sf-muted)">{sectionText(isFiltered ? "emptyProductsFilteredBody" : copy.body, locale)}</p>
      {data?.renderAction(need, sectionText(copy.action, locale))}
    </Frame>
  );
}

/**
 * A whole section for "no data": the empty state inside the section frame in
 * the editor, nothing on the storefront (the section is hidden).
 */
export function EmptySection(props: DataEmptyProps & { id?: string }) {
  if (props.ctx.mode !== "edit") return null;
  return (
    <SectionShell id={props.id}>
      <DataEmpty {...props} />
    </SectionShell>
  );
}
