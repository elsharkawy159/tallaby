"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, MousePointerClick, Paintbrush, PenLine, Plus } from "lucide-react";
import { useStore } from "zustand";
import type { ComponentNode } from "@workspace/store-sections";
import { getElementDefinition, storeSectionRegistry, updateNode } from "@workspace/store-sections/render";
import { cn } from "@workspace/ui/lib/utils";
import { ChromeOptions } from "./chrome-options.client";
import { styleTargetOf, type EditorCommands } from "../lib/editor-commands.lib";
import { AgentDock } from "./agent-dock.client";
import { SidebarHeader } from "./sidebar-header.client";
import { ElementInspector, SectionInspector } from "./editor-inspector.client";
import { SectionSettings } from "./section-settings.client";
import { getInstance, getNode, partField, refOf, selectionLabel, withTree } from "../lib/editor-selection.lib";
import { clearDeviceOverrides, clearStyle, setStyle, styleKindOf } from "../lib/editor-style.lib";
import type { EditorCategory, EditorForm, EditorProduct } from "../editor.dto";
import type { EditorStore } from "../state/editor.store";
import { StylePanel } from "./style-panel.client";
import { readShell, setShell } from "../lib/editor-library.lib";
import { hasCarousel } from "../lib/section-settings.lib";
import { isProductPage } from "@workspace/store-sections";
import { nameOf } from "../panels/pages-panel.client";

/** Three everyday shortcuts under the empty state (the full list is in the shortcuts dialog). */
const EMPTY_TIPS = [
  { action: "undo", keys: "Ctrl Z" },
  { action: "duplicate", keys: "Ctrl D" },
  { action: "quickInsert", keys: "Ctrl K" },
] as const;

type Catalog = { products: EditorProduct[]; categories: EditorCategory[]; forms: EditorForm[] };

/**
 * Right sidebar (P4B-03): what is selected (path and quick actions), then
 * Content | Style, and the AI assistant input at the foot. Content is the
 * section's fields (or only the clicked part's field), or the element's
 * fields; Style edits the device shown in the top bar.
 */
export function EditorSidebar({
  store,
  storeId,
  readOnly,
  catalog,
  uiLocale,
  commands,
  translated = false,
  hasLogo = false,
  onAddSection,
}: {
  store: EditorStore;
  commands: EditorCommands;
  storeId: string;
  readOnly: boolean;
  catalog: Catalog;
  uiLocale: string;
  /** The store has more than one language: the navbar offers its language switcher. */
  translated?: boolean;
  /** The store uploaded a logo: header and footer show it (unless hidden). */
  hasLogo?: boolean;
  /** Opens the Add panel from the empty state (when adding is allowed). */
  onAddSection?: () => void;
}) {
  const t = useTranslations("storeEditor.sidebar");
  const tShortcut = useTranslations("storeEditor.shortcuts");
  const selection = useStore(store, (s) => s.selection);
  const pages = useStore(store, (s) => s.pages);
  const activePageId = useStore(store, (s) => s.activePageId);
  const header = useStore(store, (s) => s.header);
  const footer = useStore(store, (s) => s.footer);
  const locale = useStore(store, (s) => s.locale);
  const defaultLocale = useStore(store, (s) => s.defaultLocale);
  const device = useStore(store, (s) => s.device);
  const preferredTab = useStore(store, (s) => s.inspectorTab);
  const chromeFocus = useStore(store, (s) => s.chromeFocus);
  // The style-only element the seller still chose Content for.
  const [contentFor, setContentFor] = useState<string | null>(null);
  const focusSelected = useStore(store, (s) => s.focusSelected);
  const page = pages.find((p) => p.id === activePageId) ?? pages[0]!;

  const instance = selection ? getInstance({ content: page.content, header, footer }, refOf(selection)) : null;
  const definition = instance ? storeSectionRegistry.get(instance.sectionId) : undefined;
  const info = selectionLabel(instance, selection, uiLocale);

  if (!selection || !instance || !definition || !info) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {/* Nothing selected: the page being edited heads the panel (Claude Design). */}
        <div data-sidebar-header="" className="flex items-center gap-2.5 border-b border-(--s-line-soft) px-3.5 py-3 max-lg:pt-1">
          <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-(--s-hover) text-(--s-primary)">
            <FileText className="size-[17px]" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-bold leading-tight text-(--s-ink)">{nameOf(page.name, uiLocale) || page.slug}</h2>
            <p className="truncate font-montserrat text-[11.5px] text-(--s-subtle)">
              <span dir="ltr">/{page.isHome ? "" : isProductPage(page) ? "products/…" : page.slug}</span>
            </p>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2.5 overflow-y-auto p-6 text-center">
          <span className="grid size-[52px] place-items-center rounded-2xl bg-(--s-hover) text-(--s-primary)">
            <MousePointerClick className="size-6" aria-hidden />
          </span>
          <p className="text-sm font-bold text-(--s-ink)">{t("emptyTitle")}</p>
          <p className="max-w-56 text-[12.5px] text-(--s-subtle)">{t("empty")}</p>
          <ul className="mt-1.5 flex w-full flex-col gap-1.5 max-lg:hidden">
            {EMPTY_TIPS.map(({ action, keys }) => (
              <li key={action} className="flex items-center gap-2 rounded-[10px] bg-(--s-tint) px-2.5 py-2 text-start text-xs text-(--s-muted)">
                {tShortcut(`actions.${action}`)}
                <kbd dir="ltr" className="ms-auto whitespace-nowrap rounded-md border border-(--s-line) bg-(--s-surface) px-1.5 font-montserrat text-[10.5px] font-semibold">
                  {keys}
                </kbd>
              </li>
            ))}
          </ul>
          {onAddSection && !readOnly && (
            <button
              type="button"
              onClick={onAddSection}
              className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-full bg-(--s-solid) px-3 text-[12.5px] font-bold text-(--s-solid-fg) transition-colors hover:bg-(--s-solid-hover)"
            >
              <Plus className="size-4" aria-hidden />
              {t("addSection")}
            </button>
          )}
        </div>
        <AgentDock store={store} uiLocale={uiLocale} />
      </div>
    );
  }

  const ref = refOf(selection);
  const node = getNode(instance, selection.nodeId);
  const field = selection.part ? partField(definition, selection.part) : undefined;
  const target = styleTargetOf(selection);
  const kind = styleKindOf(target, { nodeType: node?.type, fieldType: field?.type, partKey: selection.part?.split(".").pop() });
  const selectionKey = `${instance.id}:${selection.nodeId ?? selection.part ?? ""}`;
  // An element with nothing to fill in (spacer, divider, box…) opens on Style, without changing the tab others open on.
  const styleOnly = Boolean(node) && getElementDefinition(node!.type)?.fields.length === 0;
  const tab = styleOnly && contentFor !== selectionKey ? "style" : preferredTab;
  const openTab = (key: "content" | "style") => {
    setContentFor(styleOnly && key === "content" ? selectionKey : null);
    if (!styleOnly || key === "content") state.setInspectorTab(key);
  };
  const state = store.getState();

  const editNode = (next: ComponentNode) =>
    state.editSection(ref, (i) => withTree(i, (nodes) => updateNode(nodes, next.id, () => next)), `content:${selectionKey}`);
  const settingsProps = {
    onEditTree: (update: (nodes: ComponentNode[]) => ComponentNode[], key: string) =>
      state.editSection(ref, (i) => withTree(i, update), `content:${selectionKey}:${key}`),
    locale,
    defaultLocale,
    uiLocale,
    catalog,
    storeId,
    readOnly,
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SidebarHeader
        store={store}
        commands={commands}
        instance={instance}
        selection={selection}
        info={info}
        uiLocale={uiLocale}
        readOnly={readOnly}
        device={device}
      />
      <div role="tablist" className="mx-3.5 mt-3 grid grid-cols-2 gap-0.5 rounded-xl bg-(--s-fill) p-[3px]">
        {(["content", "style"] as const).map((key) => {
          const TabIcon = key === "content" ? PenLine : Paintbrush;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => openTab(key)}
              className={cn(
                "inline-flex h-8 items-center justify-center gap-1.5 rounded-[9px] text-[12.5px] font-semibold transition-colors max-lg:h-[38px]",
                tab === key ? "bg-(--s-surface) text-(--s-ink) shadow-[0_1px_3px_rgb(13_55_67/0.1)]" : "text-(--s-subtle) hover:text-(--s-ink)",
              )}
            >
              <TabIcon className="size-3.5" aria-hidden />
              {t(`tabs.${key}`)}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3.5">
        {tab === "content" && ref.target !== "page" && !selection.part && (!node || node.type === "section") && (
          // The whole header or footer is selected: its logo and tools (drawn, never saved into the tree).
          <ChromeOptions
            key={instance.id}
            instance={instance}
            part={ref.target}
            onChange={(update, key) => state.editSection(ref, update, key)}
            storeId={storeId}
            readOnly={readOnly}
            translated={translated}
            hasLogo={hasLogo}
            pages={pages}
            locale={locale}
            focus={chromeFocus}
          />
        )}
        {tab === "content" ? (
          node?.type === "carousel" ? (
            // A selected carousel also lists its slides' photos (the section's options show the same).
            <SectionSettings key={node.id} tree={[node]} {...settingsProps} />
          ) : node ? (
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
              onOpenStyle={() => state.setInspectorTab("style")}
            />
          ) : (
            <div className="space-y-4">
              {field && (
                <div className="flex items-center justify-between rounded-xl border border-(--s-line) px-2.5 py-1.5 text-xs">
                  <button
                    type="button"
                    aria-pressed={focusSelected}
                    onClick={() => state.setFocusSelected(true)}
                    className={cn("rounded-lg px-2 py-1", focusSelected ? "bg-(--s-fill) font-semibold text-(--s-ink)" : "text-(--s-subtle)")}
                  >
                    {t("selectedOnly")}
                  </button>
                  <button
                    type="button"
                    aria-pressed={!focusSelected}
                    onClick={() => state.setFocusSelected(false)}
                    className={cn("rounded-lg px-2 py-1", !focusSelected ? "bg-(--s-fill) font-semibold text-(--s-ink)" : "text-(--s-subtle)")}
                  >
                    {t("showAll")}
                  </button>
                </div>
              )}
              {instance.sectionId === "custom-section" && !selection.part && (
                <>
                  <p className="rounded-xl bg-(--s-tint) p-2.5 text-xs text-(--s-muted)">{t("customHint")}</p>
                  <SectionSettings
                    key={instance.id}
                    tree={instance.componentTree ?? []}
                    onSelectNode={(nodeId) => state.select({ ...ref, nodeId })}
                    {...settingsProps}
                  />
                </>
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
                    readOnly,
                    defaultWidth: hasCarousel(instance.componentTree ?? []) ? "full" : "contained",
                  }
                : undefined
            }
          />
        )}
      </div>
      <AgentDock store={store} uiLocale={uiLocale} />
    </div>
  );
}
