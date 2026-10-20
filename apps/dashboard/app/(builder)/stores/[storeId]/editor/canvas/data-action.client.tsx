"use client";

import { ExternalLink, PanelsTopLeft, RotateCw } from "lucide-react";
import { DATA_ACTION_CLASS, type DataNeed } from "@workspace/store-sections/render";
import { dataAction } from "@workspace/store-editor/lib/editor-data.lib";

/**
 * The buttons inside canvas empty states (P4B-05). Management pages open in
 * a new tab so the editor and its unsaved work stay where they are; the
 * editor refreshes its store data when the seller comes back. Navigation is
 * managed here (Pages panel). Rendered inside the canvas frame (React portal),
 * so the click handlers belong to the editor.
 */
export function DataActionButton({
  need,
  label,
  store,
  onOpenPages,
}: {
  need: DataNeed;
  label: string;
  store: { id: string; catalogMode: string | null | undefined };
  onOpenPages: () => void;
}) {
  const action = dataAction(need, store);
  if (action.kind === "pages") {
    return (
      <button type="button" className={DATA_ACTION_CLASS} onClick={onOpenPages} data-editor-action={need}>
        <PanelsTopLeft className="size-4" aria-hidden />
        {label}
      </button>
    );
  }
  return (
    // Same dashboard origin: the session (and store) carry over; noopener keeps the tabs independent.
    <a href={absolute(action.href)} target="_blank" rel="noopener noreferrer" className={DATA_ACTION_CLASS} data-editor-action={need}>
      {label}
      <ExternalLink className="size-3.5 opacity-80 rtl:-scale-x-100" aria-hidden />
    </a>
  );
}

/** The canvas frame has no reliable base URL; links are made absolute on the dashboard origin. */
function absolute(href: string): string {
  return typeof window === "undefined" ? href : new URL(href, window.location.origin).toString();
}

export function DataRetryButton({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <button type="button" className={DATA_ACTION_CLASS} onClick={onRetry} data-editor-action="retry">
      <RotateCw className="size-4" aria-hidden />
      {label}
    </button>
  );
}
