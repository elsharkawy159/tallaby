"use client";

import { useTranslations } from "next-intl";
import { MousePointerClick, Plus, Trash2 } from "lucide-react";
import type { ComponentNode, SiteLocale } from "@workspace/store-sections";
import { getElementDefinition, updateNode } from "@workspace/store-sections/render";
import { Button } from "@workspace/ui/components/button";
import type { EditorCategory, EditorForm, EditorProduct } from "../editor.dto";
import { newId } from "../lib/editor.lib";
import { addSlide, removeSlide, settingsNodes, slideImages } from "../lib/section-settings.lib";
import { ElementInspector } from "./editor-inspector.client";

type Catalog = { products: EditorProduct[]; categories: EditorCategory[]; forms: EditorForm[] };

/**
 * The options of the elements inside a selected tree section (carousel
 * autoplay and photos, video playback, product list source…), each with the
 * element's own fields. Empty when the section has none.
 */
export function SectionSettings({
  tree,
  onEditTree,
  onSelectNode,
  locale,
  defaultLocale,
  uiLocale,
  catalog,
  storeId,
  readOnly,
}: {
  tree: readonly ComponentNode[];
  /** Applies a tree update; `key` coalesces typing in one field into one undo step. */
  onEditTree: (update: (nodes: ComponentNode[]) => ComponentNode[], key: string) => void;
  /** Selects the element on the page; left out when it is already selected. */
  onSelectNode?: (nodeId: string) => void;
  locale: SiteLocale;
  defaultLocale: SiteLocale;
  uiLocale: string;
  catalog: Catalog;
  storeId: string;
  readOnly: boolean;
}) {
  const t = useTranslations("storeEditor.sidebar.settings");
  const nodes = settingsNodes(tree);
  if (!nodes.length) return null;

  const replace = (next: ComponentNode) => onEditTree((list) => updateNode(list, next.id, () => next), next.id);
  const inspector = (node: ComponentNode) => (
    <ElementInspector
      key={node.id}
      node={node}
      onChange={replace}
      locale={locale}
      defaultLocale={defaultLocale}
      uiLocale={uiLocale}
      catalog={catalog}
      storeId={storeId}
      readOnly={readOnly}
    />
  );
  const structureLocked = readOnly || locale !== defaultLocale;

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground">{t("title")}</h3>
      {nodes.map((node) => {
        const definition = getElementDefinition(node.type);
        const name = definition ? (uiLocale === "en" ? definition.label.en : definition.label.ar) : node.type;
        return (
          <fieldset key={node.id} disabled={readOnly} className="space-y-3 rounded-lg border p-3">
            <legend className="sr-only">{name}</legend>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{name}</span>
              {onSelectNode && (
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onSelectNode(node.id)}>
                  <MousePointerClick className="size-3.5" aria-hidden />
                  {t("selectOnPage")}
                </Button>
              )}
            </div>
            {inspector(node)}
            {node.type === "carousel" && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">{t("slides", { count: node.children.length })}</p>
                {node.children.map((slide, index) => {
                  const images = slideImages(slide);
                  return (
                    <div key={slide.id} className="space-y-2 rounded-md border p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{t("slide", { number: index + 1 })}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          disabled={structureLocked || node.children.length <= 1}
                          onClick={() => replace(removeSlide(node, slide.id))}
                          aria-label={t("removeSlide", { number: index + 1 })}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </Button>
                      </div>
                      {images.length ? images.map(inspector) : <p className="text-xs text-muted-foreground">{t("noImage")}</p>}
                    </div>
                  );
                })}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={structureLocked}
                  onClick={() => replace(addSlide(node, () => newId("n")))}
                >
                  <Plus aria-hidden />
                  {t("addSlide")}
                </Button>
              </div>
            )}
          </fieldset>
        );
      })}
    </section>
  );
}
