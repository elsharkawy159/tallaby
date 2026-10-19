"use client";

import { useTranslations } from "next-intl";
import { MousePointerClick } from "lucide-react";
import { useStore } from "zustand";
import type { ComponentNode } from "@workspace/store-sections";
import { storeSectionRegistry, updateNode } from "@workspace/store-sections/render";
import { cn } from "@workspace/ui/lib/utils";
import { styleTargetOf } from "../lib/editor-commands.lib";
import { ElementInspector, SectionInspector } from "./editor-inspector.client";
import { getInstance, getNode, partField, refOf, selectionLabel, withTree } from "../lib/editor-selection.lib";
import { clearDeviceOverrides, clearStyle, setStyle, styleKindOf } from "../lib/editor-style.lib";
import type { EditorCategory, EditorForm, EditorProduct } from "../server/editor.data";
import type { EditorStore } from "../state/editor.store";
import { StylePanel } from "./style-panel.client";
import { readShell, setShell } from "../lib/editor-library.lib";

type Catalog = { products: EditorProduct[]; categories: EditorCategory[]; forms: EditorForm[] };

/**
 * Right sidebar (P4B-03): what is selected, then Content | Style. Content is
 * the section's fields (or only the clicked part's field), or the element's
 * fields; Style edits the device shown in the top bar.
 */
export function EditorSidebar({
  store,
  storeId,
  readOnly,
  catalog,
  uiLocale,
}: {
  store: EditorStore;
  storeId: string;
  readOnly: boolean;
  catalog: Catalog;
  uiLocale: string;
}) {
  const t = useTranslations("storeEditor.sidebar");
  const selection = useStore(store, (s) => s.selection);
  const pages = useStore(store, (s) => s.pages);
  const activePageId = useStore(store, (s) => s.activePageId);
  const header = useStore(store, (s) => s.header);
  const footer = useStore(store, (s) => s.footer);
  const locale = useStore(store, (s) => s.locale);
  const defaultLocale = useStore(store, (s) => s.defaultLocale);
  const device = useStore(store, (s) => s.device);
  const tab = useStore(store, (s) => s.inspectorTab);
  const focusSelected = useStore(store, (s) => s.focusSelected);
  const page = pages.find((p) => p.id === activePageId) ?? pages[0]!;

  const instance = selection ? getInstance({ content: page.content, header, footer }, refOf(selection)) : null;
  const definition = instance ? storeSectionRegistry.get(instance.sectionId) : undefined;
  const info = selectionLabel(instance, selection, uiLocale);

  if (!selection || !instance || !definition || !info) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <MousePointerClick className="size-8 text-muted-foreground/60" aria-hidden />
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      </div>
    );
  }

  const ref = refOf(selection);
  const node = getNode(instance, selection.nodeId);
  const field = selection.part ? partField(definition, selection.part) : undefined;
  const target = styleTargetOf(selection);
  const kind = styleKindOf(target, { nodeType: node?.type, fieldType: field?.type, partKey: selection.part?.split(".").pop() });
  const selectionKey = `${instance.id}:${selection.nodeId ?? selection.part ?? ""}`;
  const state = store.getState();

  const editNode = (next: ComponentNode) =>
    state.editSection(ref, (i) => withTree(i, (nodes) => updateNode(nodes, next.id, () => next)), `content:${selectionKey}`);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">{t(info.kind)}</p>
        <h2 className="truncate font-semibold">{info.title}</h2>
        {info.detail && <p className="truncate text-xs text-muted-foreground">{info.detail}</p>}
      </div>
      <div role="tablist" className="mx-4 mt-3 grid grid-cols-2 rounded-lg bg-muted p-1">
        {(["content", "style"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => state.setInspectorTab(key)}
            className={cn("rounded-md py-1.5 text-sm font-medium transition-colors", tab === key ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            {t(`tabs.${key}`)}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "content" ? (
          node ? (
            <ElementInspector
              key={node.id}
              node={node}
              onChange={editNode}
              locale={locale}
              defaultLocale={defaultLocale}
              uiLocale={uiLocale}
              catalog={catalog}
              storeId={storeId}
              readOnly={readOnly}
            />
          ) : (
            <div className="space-y-4">
              {field && (
                <div className="flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs">
                  <button
                    type="button"
                    aria-pressed={focusSelected}
                    onClick={() => state.setFocusSelected(true)}
                    className={cn("rounded px-1.5 py-0.5", focusSelected ? "bg-muted font-medium" : "text-muted-foreground")}
                  >
                    {t("selectedOnly")}
                  </button>
                  <button
                    type="button"
                    aria-pressed={!focusSelected}
                    onClick={() => state.setFocusSelected(false)}
                    className={cn("rounded px-1.5 py-0.5", !focusSelected ? "bg-muted font-medium" : "text-muted-foreground")}
                  >
                    {t("showAll")}
                  </button>
                </div>
              )}
              {instance.sectionId === "custom-section" && !selection.part && (
                <p className="rounded-md bg-muted/60 p-2.5 text-xs text-muted-foreground">{t("customHint")}</p>
              )}
              <SectionInspector
                key={instance.id}
                definition={definition}
                instance={instance}
                onChange={(next) => state.editSection(ref, () => next, `content:${selectionKey}`)}
                locale={locale}
                defaultLocale={defaultLocale}
                uiLocale={uiLocale}
                catalog={catalog}
                storeId={storeId}
                readOnly={readOnly}
                focusPart={selection.part}
                onlyPart={Boolean(field) && focusSelected}
              />
            </div>
          )
        ) : (
          <StylePanel
            key={selectionKey}
            instance={instance}
            target={target}
            kind={kind}
            nodeType={node?.type}
            device={device}
            onPatch={(patch) =>
              state.editSection(ref, (i) => setStyle(i, target, device, patch), `style:${selectionKey}:${device}:${Object.keys(patch).join(",")}`)
            }
            onReset={() => state.editSection(ref, (i) => clearStyle(i, target, device))}
            onResetDevice={() => state.editSection(ref, (i) => clearDeviceOverrides(i, device))}
            shell={
              ref.target === "page" && target.kind === "section"
                ? {
                    value: readShell(instance),
                    onChange: (patch) => state.editSection(ref, (i) => setShell(i, patch), `shell:${selectionKey}:${Object.keys(patch).join(",")}`),
                    storeId,
                    readOnly,
                  }
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
