# @workspace/store-editor — the website editor

The website builder UI, shared by the seller dashboard (`/stores/[storeId]/editor`) and the admin
app. Sections themselves (rendering, registry, presets) live in `packages/store-sections`; this
package is only the editor around them. Plans and decisions: `docs/website-builder.md`, `PLAN.md`
Phase 4 / 4B and `docs/superpowers/specs/2026-10-20-admin-website-builder-design.md`.

## Hosts plug in through an `EditorAdapter`

The package never imports server code. Every server call goes through the `EditorAdapter` the host
passes in (`adapter.types.ts`):

```tsx
<StoreEditor initial={initial} adapter={adapter} />
```

- Every method closes over its target (store, template or section), so none takes a `storeId`.
  Parameter and return types match the dashboard actions each method wraps.
- `capabilities` says what the host supports. Rail tabs, the Add › Templates tab and top-bar items
  whose capability is `false` are not rendered (`shell/capabilities.lib.ts`). The optional method
  groups (`pages`, `revisions`, `templates`, `forms`, `explore`, …) are present when their capability is.
- `media` is always present. It includes `uploadFile(path, file)`: the browser upload of a path that
  `createUploadPaths` handed out (the dashboard uses the seller's session on `store-media`).
- Inside the editor, components read the adapter with `useEditorAdapter()` (`adapter.client.tsx`).
  Media-only hosts (the dashboard's Website › Media page and blog editor) wrap `MediaLibrary` /
  `MediaPicker` in an `EditorAdapterProvider` with just the media group.

The seller dashboard builds its adapter in the browser from its server actions
(`apps/dashboard/app/(builder)/stores/[storeId]/editor/seller-adapter.client.tsx`), so no function
crosses the server/client boundary. Its server actions, loaders and `page.tsx` stay in the dashboard.

## Folder map

| Folder | What lives there | Edit here when… |
| --- | --- | --- |
| `editor.client.tsx` | `StoreEditor` (adapter provider + store) and the shell that wires DnD, shell, canvas and panels | adding a rail tab or a top-level hook |
| `adapter.*` | The `EditorAdapter` contract, its capabilities and `useEditorAdapter()` | a host needs a new server call |
| `editor.dto.ts`, `templates.dto.ts` | Result/error types and the shapes shared with the hosts' server code (`@workspace/store-editor/editor.dto` is safe to import from server files) | changing what is saved or loaded |
| `state/` | The zustand store (`editor.store.ts`: selection, history, dirty pages) and the hooks bound to it: autosave, store-data refresh, shortcuts, preview link | changing editor state or a background behaviour |
| `lib/` | Pure logic, no React, each with a `*.test.ts`: section tree ops (`editor.lib`), commands, selection, per-device style, slots, section library/presets, Add palette, page templates, empty-state data, icons, industries, design presets | changing a rule; add a test next to it |
| `shell/` | Chrome around the canvas: top bar, left tab rail, Ctrl+K quick insert and `?` shortcuts dialogs, capability gating | changing the frame of the editor |
| `canvas/` | The iframe canvas, the selection/hover overlay, the element popover and the empty-state buttons | changing what happens on the page itself |
| `inspector/` | Right sidebar: `editor-sidebar` (Content \| Style tabs), `editor-inspector` (content fields), `style-panel`, and `controls/` (shared style inputs) | changing a field or a style control |
| `panels/` | Left rail tabs: layers, pages, media, explore, brand, forms. `panels/add/` is the Add tab: elements, section library + thumbnails, page templates and their preview | changing a rail tab |
| `dnd/` | The one `@dnd-kit` context, drag payload types, canvas/part probes and the pure drop planners | changing drag and drop |
| `media/` | The media library and picker, the upload hook, media view helpers | changing the media library |
| `preview/` | `SitePreview`, the read-only store page preview (also used by Website › Design and Templates) | changing previews |

Conventions: `*.client.tsx` components, `*.lib.ts` pure helpers, `*.dto.ts` shared types. Strings
live in `src/messages/{ar,en}.json` (`storeEditor`, `mediaLibrary`, `websiteDesign`,
`websiteTemplates`, `storeForms.templates`), in both languages; a host deep-merges them into its
own messages (the dashboard does it in `i18n/request.tsx`).
