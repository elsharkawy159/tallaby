# Store editor route

The website editor UI lives in `@workspace/store-editor` (`packages/store-editor`, see its README).
This folder is only the seller dashboard's side of it:

| File | What it does |
| --- | --- |
| `page.tsx` | Route entry: ownership check (`loadStorePage`) and the initial load (`EditorInitial`) |
| `seller-editor.client.tsx` | `SellerEditor`: builds the seller adapter and renders `StoreEditor` |
| `seller-adapter.client.tsx` | `useSellerEditorAdapter(storeId)`: the `EditorAdapter` over the seller's server actions |
| `use-store-preview.client.ts` | "Preview on my store" for the Website overview (same hook as the editor's) |
| `server/` | Server actions (`editor.server.ts`: save, publish, pages, revisions), loaders (`editor.data.ts`) and stock photos (`explore.server.ts`). Also used by the Website pages in `(main)` |

Every action takes the store id from the URL and re-checks it with `requireStore`; nothing trusts a
seller or store id from the client.
