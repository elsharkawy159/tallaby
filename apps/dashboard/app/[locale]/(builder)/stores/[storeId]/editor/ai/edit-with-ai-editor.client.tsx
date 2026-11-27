"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import { useLocale } from "next-intl";
import type { EditorAssistantApi, EditorInitial } from "@workspace/store-editor/editor.client";
import { createClient } from "@/supabase/client";
import { SellerEditor } from "../seller-editor.client";
import { cancelEditWithAiAction, confirmEditWithAiAction, createEditWithAiUploads, editWithAiTurn } from "./server/edit-with-ai.server";
import type { EditWithAiUpload } from "./server/edit-with-ai.dto";
import { chatStorageKey, createEditWithAiChat, type EditWithAiChat } from "./edit-with-ai-chat.lib";
import { EditWithAiPanel } from "./edit-with-ai-panel.client";

/**
 * The website editor in its AI layout (owner request 2026-11-26, F-83c): the
 * seller's editor (same top bar, same canvas, same save and publish) with the
 * "Edit with AI" chat as its assistant panel. A site turn's ops are applied
 * to the editor's drafts at once, as one undo step; autosave saves them.
 */

async function uploadToSignedUrl(upload: EditWithAiUpload, file: File) {
  const { error } = await createClient()
    .storage.from(upload.bucket)
    .uploadToSignedUrl(upload.path, upload.token, file, { contentType: file.type || undefined });
  if (error) throw error;
}

/**
 * After a confirmed store change. Products, settings or shipping: the canvas
 * reloads its store data. The theme (colours, fonts) is part of the drafts
 * this editor holds, and the server just saved a newer one: the editor saves
 * its pending edits and reloads, as it does after "Fill missing translations"
 * (the chat is kept in sessionStorage). If the save fails nothing reloads, so
 * no edit is lost; the editor then reports the newer theme itself.
 */
async function afterStoreChange(editor: EditorAssistantApi | null, skill: string) {
  if (!editor) return;
  if (skill !== "design") return editor.refreshData();
  if (await editor.flush().catch(() => false)) window.location.reload();
}

function safeSessionStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** The chat for one store, kept in this tab's sessionStorage. It reads the editor through `apiRef` when a turn runs. */
function useEditWithAiChat(storeId: string, uiLocale: "ar" | "en", apiRef: RefObject<EditorAssistantApi | null>, onCredits: (remaining: number) => void): EditWithAiChat {
  const [chat] = useState<EditWithAiChat>(() =>
    createEditWithAiChat({
      uiLocale,
      actions: {
        turn: (input) => editWithAiTurn(storeId, input),
        uploads: (input) => createEditWithAiUploads(storeId, input),
        confirm: (actionId) => confirmEditWithAiAction(storeId, actionId),
        cancel: (actionId) => cancelEditWithAiAction(storeId, actionId),
      },
      uploadFile: uploadToSignedUrl,
      storage: typeof window === "undefined" ? null : safeSessionStorage(),
      storageKey: chatStorageKey(storeId),
      // Without the editor (never while the panel is shown) nothing is sent and nothing is applied.
      beforeTurn: () => apiRef.current?.flush() ?? Promise.resolve(false),
      applySiteTurn: (changes) =>
        apiRef.current?.applyTurn(
          { pageId: changes.pageId, target: changes.target, contentLocale: changes.contentLocale },
          { ops: changes.ops, applied: changes.applied, previews: changes.previews },
        ) ?? { applied: [], undoMarker: null, stale: true },
      onStoreChanged: (_tool, skill) => void afterStoreChange(apiRef.current, skill),
      onCredits,
      objectUrl: typeof URL !== "undefined" && "createObjectURL" in URL ? { create: (file) => URL.createObjectURL(file), revoke: (url) => URL.revokeObjectURL(url) } : undefined,
    }),
  );
  return chat;
}

export function EditWithAiEditor({
  initial,
  codeSections,
  editorAgent,
  initialCredits,
}: {
  initial: EditorInitial;
  codeSections: boolean;
  editorAgent: boolean;
  /** AI credits left when the page loaded; null when credits don't apply. */
  initialCredits: number | null;
}) {
  const uiLocale = useLocale() === "en" ? "en" : "ar";
  const storeId = initial.storeId;
  const apiRef = useRef<EditorAssistantApi | null>(null);
  const [credits, setCredits] = useState(initialCredits);
  // Credits only show where they apply: a fresh number never turns the chip on.
  const onCredits = useCallback((remaining: number) => setCredits((current) => (current === null ? null : remaining)), []);
  const chat = useEditWithAiChat(storeId, uiLocale, apiRef, onCredits);
  const assistant = useCallback(
    (api: EditorAssistantApi) => <EditWithAiPanel api={api} apiRef={apiRef} chat={chat} storeId={storeId} credits={credits} />,
    [chat, storeId, credits],
  );
  return <SellerEditor initial={initial} codeSections={codeSections} editorAgent={editorAgent} aiEditor assistant={assistant} />;
}
