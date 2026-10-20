"use client";

import { useTranslations } from "next-intl";
import { LAYOUT_PRESETS, PALETTE_TYPES, getElementDefinition } from "@workspace/store-sections/render";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@workspace/ui/components/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import type { EditorCommands } from "../lib/editor-commands.lib";
import { ELEMENT_ICONS, PRESET_ICONS, SECTION_GROUP_ICONS } from "../lib/editor-icons.lib";
import { recordUse, sectionGroups } from "../lib/editor-palette.lib";
import { SHORTCUTS } from "../state/use-editor-shortcuts.client";

const pick = (value: { ar: string; en: string }, locale: string) => (locale === "en" ? value.en : value.ar) || value.ar;

/**
 * Quick insert (Ctrl+K and the canvas "+", P4B-11): sections, layouts and
 * elements in one searchable list. With `index`, sections go at that place.
 */
export function QuickInsertDialog({
  open,
  onOpenChange,
  index,
  commands,
  uiLocale,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  index: number | null;
  commands: EditorCommands;
  uiLocale: string;
}) {
  const t = useTranslations("storeEditor.quickInsert");
  const tAdd = useTranslations("storeEditor.add");
  const done = () => onOpenChange(false);
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title={t("title")} description={t("description")}>
      <CommandInput placeholder={t("placeholder")} />
      <CommandList>
        <CommandEmpty>{tAdd("noResults")}</CommandEmpty>
        <CommandGroup heading={tAdd("tabs.sections")}>
          {sectionGroups()
            .filter(({ definition }) => !definition.chrome)
            .map(({ key, definition }) => {
              const Icon = SECTION_GROUP_ICONS[key];
              return (
                <CommandItem
                  key={key}
                  value={`section ${tAdd(`sectionGroups.${key}`)} ${definition.displayName.ar} ${definition.displayName.en}`}
                  onSelect={() => {
                    if (index === null) commands.addSection(definition);
                    else commands.addSectionAt(definition, index);
                    recordUse(`section:${definition.id}`);
                    done();
                  }}
                >
                  <Icon aria-hidden />
                  {tAdd(`sectionGroups.${key}`)}
                </CommandItem>
              );
            })}
        </CommandGroup>
        <CommandGroup heading={tAdd("layouts")}>
          {LAYOUT_PRESETS.map((preset) => {
            const Icon = PRESET_ICONS[preset.id] ?? ELEMENT_ICONS.grid;
            return (
              <CommandItem
                key={preset.id}
                value={`layout ${preset.label.ar} ${preset.label.en} ${preset.keywords.join(" ")}`}
                onSelect={() => {
                  commands.addPreset(preset);
                  recordUse(`preset:${preset.id}`);
                  done();
                }}
              >
                <Icon aria-hidden />
                {pick(preset.label, uiLocale)}
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandGroup heading={tAdd("tabs.elements")}>
          {PALETTE_TYPES.map((type) => {
            const definition = getElementDefinition(type)!;
            const Icon = ELEMENT_ICONS[type];
            return (
              <CommandItem
                key={type}
                value={`element ${definition.label.ar} ${definition.label.en} ${definition.keywords.join(" ")}`}
                onSelect={() => {
                  commands.addElement(type);
                  recordUse(`el:${type}`);
                  done();
                }}
              >
                <Icon aria-hidden />
                {pick(definition.label, uiLocale)}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/** Keyboard shortcuts dialog (`?`, reference `keyboard-shortcuts-dialog.tsx`). */
export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("storeEditor.shortcuts");
  const mac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <ul className="divide-y text-sm">
          {SHORTCUTS.map((shortcut) => (
            <li key={shortcut.action} className="flex items-center justify-between gap-4 py-2">
              <span>{t(`actions.${shortcut.action}`)}</span>
              <span dir="ltr" className="flex gap-1">
                {shortcut.keys.map((key) => (
                  <kbd key={key} className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                    {key === "Mod" ? (mac ? "⌘" : "Ctrl") : key}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
