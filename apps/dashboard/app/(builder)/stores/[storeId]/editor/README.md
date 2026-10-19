# Store editor — folder map

The website builder for one store (`/stores/[storeId]/editor`). Sections themselves (rendering,
registry, presets) live in `packages/store-sections`; this folder is only the editor around them.
Plans and decisions: `docs/website-builder.md` and `PLAN.md` Phase 4 / 4B.

| Folder | What lives there | Edit here when… |
| --- | --- | --- |
| `page.tsx`, `editor.client.tsx` | Route entry (ownership check, initial load) and `StoreEditor`, which wires the store, DnD, shell, canvas and panels together | adding a rail tab or a top-level hook |
| `server/` | Server actions (`editor.server.ts`: save, publish, pages, revisions), loaders (`editor.data.ts`), result/error types (`editor.dto.ts`), stock photos (`explore.server.ts`). Also used by the Website pages in `(main)` | changing what is saved or loaded |
| `state/` | The zustand store (`editor.store.ts`: selection, history, dirty pages) and the hooks bound to it: autosave, store-data refresh, shortcuts, preview link | changing editor state or a background behaviour |
| `lib/` | Pure logic, no React, each with a `*.test.ts`: section tree ops (`editor.lib`), commands, selection, per-device style, slots, section library/presets, Add palette, page templates, empty-state data, icons | changing a rule; add a test next to it |
| `shell/` | Chrome around the canvas: top bar, left tab rail, Ctrl+K quick insert and `?` shortcuts dialogs | changing the frame of the editor |
| `canvas/` | The iframe canvas, the selection/hover overlay, the element popover and the empty-state buttons | changing what happens on the page itself |
| `inspector/` | Right sidebar: `editor-sidebar` (Content \| Style tabs), `editor-inspector` (content fields), `style-panel`, and `controls/` (shared style inputs) | changing a field or a style control |
| `panels/` | Left rail tabs: layers, pages, media, explore, brand, forms. `panels/add/` is the Add tab: elements, section library + thumbnails, page templates and their preview | changing a rail tab |
| `dnd/` | The one `@dnd-kit` context, drag payload types, canvas/part probes and the pure drop planners | changing drag and drop |

Conventions: `*.client.tsx` components, `*.lib.ts` pure helpers, `*.server.ts` server actions, `*.data.ts`
loaders, `*.dto.ts` shared types. Strings live under `storeEditor` in `messages/{ar,en}.json`.
