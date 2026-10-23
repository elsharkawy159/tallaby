"use client";

import { useEffect } from "react";
import { ADMIN_DEFAULT_REASON } from "@workspace/lib/admin";
import { StoreEditor, type EditorInitial } from "@workspace/store-editor/editor.client";
import { openStoreEditor } from "./admin-store-editor.server";
import { useAdminStoreAdapter } from "./admin-store-adapter.client";

/**
 * Opens the store editor straight away (owner, 2026-10-24: no reason prompt).
 * Opening is still audited (open_store_editor), and every audited write
 * (publish, restore, page changes…) carries ADMIN_DEFAULT_REASON.
 */
export function ReasonGate({ initial }: { initial: EditorInitial; storeName: string }) {
  useEffect(() => {
    void openStoreEditor(initial.storeId, ADMIN_DEFAULT_REASON);
  }, [initial.storeId]);
  return <AdminStoreEditor initial={initial} reason={ADMIN_DEFAULT_REASON} />;
}

function AdminStoreEditor({ initial, reason }: { initial: EditorInitial; reason: string }) {
  const adapter = useAdminStoreAdapter(initial.storeId, reason);
  return <StoreEditor initial={initial} adapter={adapter} />;
}
