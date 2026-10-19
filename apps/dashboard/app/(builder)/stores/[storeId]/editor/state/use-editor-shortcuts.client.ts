"use client";

import { useCallback, useEffect } from "react";
import type { EditorCommands } from "../lib/editor-commands.lib";
import type { EditorStore } from "./editor.store";

/** Typing in a field (or editing text on the canvas) never triggers editor shortcuts. */
function isTyping(target: EventTarget | null): boolean {
  if (!target || !(target as HTMLElement).tagName) return false;
  const element = target as HTMLElement;
  return element.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName);
}

/**
 * Keyboard shortcuts (P4B-11, reference `use-builder-shortcuts.ts`). The
 * returned handler is also attached to the canvas frame, whose key events
 * never reach this window.
 */
export function useEditorShortcuts(
  store: EditorStore,
  commands: EditorCommands,
  actions: { save: () => void; quickInsert: () => void; showShortcuts: () => void },
) {
  const handle = useCallback(
    (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;
      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      const state = store.getState();
      const run = (fn: () => void) => {
        event.preventDefault();
        fn();
      };

      if (mod && key === "z") return run(() => (event.shiftKey ? state.redo() : state.undo()));
      if (mod && key === "y") return run(() => state.redo());
      if (mod && key === "s") return run(actions.save);
      if (mod && key === "k") return run(actions.quickInsert);
      if (mod && key === "c") return run(() => commands.copy());
      if (mod && key === "x") return run(() => commands.cut());
      if (mod && key === "v") return run(() => commands.paste());
      if (mod && key === "d") return run(() => commands.duplicate());
      if (mod) return;

      if (key === "?" || (event.shiftKey && key === "/")) return run(actions.showShortcuts);
      if (!state.selection) return;
      if (key === "delete" || key === "backspace") return run(() => commands.remove());
      if (key === "escape") return run(() => (state.selection?.part || state.selection?.nodeId ? commands.selectParent() : state.select(null)));
      if (key === "arrowup") return run(() => (event.altKey ? commands.move(-1) : commands.selectSibling(-1)));
      if (key === "arrowdown") return run(() => (event.altKey ? commands.move(1) : commands.selectSibling(1)));
      // Parent / child follow the reading direction.
      const rtl = document.documentElement.dir === "rtl";
      if (key === (rtl ? "arrowright" : "arrowleft")) return run(() => commands.selectParent());
      if (key === (rtl ? "arrowleft" : "arrowright")) return run(() => commands.selectFirstChild());
    },
    [store, commands, actions],
  );

  useEffect(() => {
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [handle]);

  return handle;
}

/** The list the shortcuts dialog shows (same keys as the handler). */
export const SHORTCUTS = [
  { keys: ["Mod", "Z"], action: "undo" },
  { keys: ["Mod", "Shift", "Z"], action: "redo" },
  { keys: ["Mod", "C"], action: "copy" },
  { keys: ["Mod", "X"], action: "cut" },
  { keys: ["Mod", "V"], action: "paste" },
  { keys: ["Mod", "D"], action: "duplicate" },
  { keys: ["Del"], action: "delete" },
  { keys: ["Mod", "K"], action: "quickInsert" },
  { keys: ["Mod", "S"], action: "save" },
  { keys: ["Esc"], action: "deselect" },
  { keys: ["↑", "↓"], action: "siblings" },
  { keys: ["Alt", "↑", "↓"], action: "move" },
  { keys: ["←", "→"], action: "parentChild" },
  { keys: ["?"], action: "help" },
] as const;
