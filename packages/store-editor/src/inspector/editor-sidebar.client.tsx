"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MousePointerClick, Paintbrush, PenLine } from "lucide-react";
import { useStore } from "zustand";
import type { ComponentNode } from "@workspace/store-sections";
import { LANGUAGE_SWITCHER_PROP, getElementDefinition, languageSwitcherOn, storeSectionRegistry, updateNode } from "@workspace/store-sections/render";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { cn } from "@workspace/ui/lib/utils";
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
}: {
  store: EditorStore;
  commands: EditorCommands;
  storeId: string;
  readOnly: boolean;
  catalog: Catalog;
  uiLocale: string;
  /** The store has more than one language: the navbar offers its language switcher. */
  translated?: boolean;
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
  const preferredTab = useStore(store, (s) => s.inspectorTab);
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
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-muted">
            <MousePointerClick className="size-5 text-muted-foreground" aria-hidden />
          </span>
          <p className="text-sm font-medium">{t("emptyTitle")}</p>
          <p className="max-w-56 text-xs text-muted-foreground">{t("empty")}</p>
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
      <div role="tablist" className="mx-4 mt-3 grid grid-cols-2 rounded-lg bg-muted p-1">
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
                "inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-colors",
                tab === key ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <TabIcon className="size-3.5" aria-hidden />
              {t(`tabs.${key}`)}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "content" && ref.target === "header" && translated && (
          // Shown by default on a translated store; hiding it stores `languageSwitcher: false` on the header.
          <fieldset disabled={readOnly} className="mb-4 space-y-2 rounded-md border p-3">
            <legend className="px-1 text-xs font-medium text-muted-foreground">{t("navbar")}</legend>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="navbar-language-switcher">{t("languageSwitcher")}</Label>
              <Switch
                id="navbar-language-switcher"
                checked={languageSwitcherOn(instance)}
                onCheckedChange={(on) =>
                  state.editSection(ref, (i) => {
                    const { [LANGUAGE_SWITCHER_PROP]: _, ...props } = i.props;
                    return { ...i, props: on ? props : { ...props, [LANGUAGE_SWITCHER_PROP]: false } };
                  })
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("languageSwitcherHint")}</p>
          </fieldset>
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
                <>
                  <p className="rounded-md bg-muted/60 p-2.5 text-xs text-muted-foreground">{t("customHint")}</p>
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
