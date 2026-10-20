"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { styleTargetOf, type EditorCommands } from "../lib/editor-commands.lib";
import { refOf } from "../lib/editor-selection.lib";
import { setStyle } from "../lib/editor-style.lib";
import type { EditorStore } from "./editor.store";

/**
 * Deleting is never per device, so a delete while a tablet or phone is shown
 * says it removed the element everywhere and offers to hide it on that
 * device instead (undo, then hide). The offer lapses after any other edit.
 */
export function useDeviceCommands(store: EditorStore, commands: EditorCommands): EditorCommands {
  const t = useTranslations("storeEditor.responsive.remove");
  const tDevices = useTranslations("storeEditor.responsive.override.devices");

  return useMemo(
    () => ({
      ...commands,
      remove() {
        const before = store.getState();
        const { selection, device } = before;
        const last = before.past.at(-1);
        commands.remove();
        const removed = store.getState().past.at(-1);
        if (device === "desktop" || !selection || removed === last) return;

        const name = tDevices(device);
        toast(t("deleted"), {
          id: "device-remove",
          description: t("description", { device: name }),
          action: {
            label: t("hideInstead", { device: name }),
            onClick: () => {
              const state = store.getState();
              if (state.past.at(-1) !== removed || state.device !== device) {
                toast.info(t("expired"), { id: "device-remove" });
                return;
              }
              state.undo();
              const target = styleTargetOf(selection);
              store.getState().editSection(refOf(selection), (i) => setStyle(i, target, device, { hidden: true }));
              store.getState().select(selection);
            },
          },
        });
      },
    }),
    [store, commands, t, tDevices],
  );
}
