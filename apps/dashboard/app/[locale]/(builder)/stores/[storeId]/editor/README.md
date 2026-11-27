# Store editor route

The website editor UI lives in `@workspace/store-editor` (`packages/store-editor`, see its README).
This folder is only the seller dashboard's side of it:

| File | What it does |
| --- | --- |
| `page.tsx` | Route entry: ownership check (`loadStorePage`) and the initial load (`loadEditorInitial`) |
| `editor-entry.lib.ts`, `editor-entry-chooser.tsx`, `editor-entry-skeleton.tsx` | The first step while AI is on (`editor_agent` switch + AI configured): Edit with AI (`/editor/ai`) or Manual edit (`?mode=manual`). Any other param opens the editor directly |
| `ai/` | Edit with AI, the editor's AI layout: `page.tsx` (store check, AI-off redirect, the same `loadEditorInitial` as the manual editor, the AI credits left), `edit-with-ai-editor.client.tsx` (`SellerEditor` with the chat as its `assistant`; owns the chat and the credits), `edit-with-ai-panel.client.tsx` (the chat panel: messages, composer with the selected-section chip, credits chip, Preview button on phones), `edit-with-ai-chat.lib.ts` (chat state, uploads, save-before-turn, applying a site turn's ops, undo markers, confirm cards, sessionStorage), `edit-with-ai-page.lib.ts` (the page gate, credits tone, the turn's context), `server/` (the turn, uploads, confirm and cancel actions). A site turn returns validated ops and writes nothing: the editor applies them to its drafts as one undo step and autosave saves them |
| `seller-editor.client.tsx` | `SellerEditor`: builds the seller adapter and renders `StoreEditor` (with `assistant`: the AI layout) |
| `seller-adapter.client.tsx` | `useSellerEditorAdapter(storeId)`: the `EditorAdapter` over the seller's server actions, and the top bar's "AI \| Manual" links while AI is on |
| `use-store-preview.client.ts` | "Preview on my store" for the Website overview (same hook as the editor's) |
| `server/` | Server actions (`editor.server.ts`: save, publish, pages, revisions), loaders (`editor.data.ts`; `editor-initial.data.ts`: the `EditorInitial` both editor pages open with), the AI agents' shared helpers (`agent-images.server.ts`, `agent-previews.server.ts`: canvas previews of the code a turn wrote) and stock photos (`explore.server.ts`). Also used by the Website pages in `(main)` |

Every action takes the store id from the URL and re-checks it with `requireStore`; nothing trusts a
seller or store id from the client.
