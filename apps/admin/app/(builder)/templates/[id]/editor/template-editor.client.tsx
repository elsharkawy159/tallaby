// Disabled 2026-10-27: storefront templates and the section library come from the codebase only
// (owner; @workspace/store-sections). The templates, template_versions and library_sections tables
// were dropped (0109). The original code is kept below, commented out, for reference.
export {};

// "use client";
//
// import { useCallback, useRef, useState } from "react";
// import { ADMIN_DEFAULT_REASON } from "@workspace/lib/admin";
// import type { SiteConfig } from "@workspace/store-sections";
// import { StoreEditor, type EditorInitial } from "@workspace/store-editor/editor.client";
// import { Button } from "@workspace/ui/components/button";
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
// import { Label } from "@workspace/ui/components/label";
// import { Textarea } from "@workspace/ui/components/textarea";
// import { useTemplateAdapter } from "./template-adapter.client";
//
// type Props = {
//   initial: EditorInitial;
//   config: SiteConfig;
//   /** Every page's names in both languages (the draft's, else the published ones). */
//   pageNames: Record<string, { ar: string; en: string }>;
//   draftVersion: number;
//   templateName: string;
//   isDefault: boolean;
//   isActive: boolean;
// };
//
// /**
//  * Opens the template editor straight away (owner, 2026-10-24: no reason
//  * prompt); Publish and Restore are audited with ADMIN_DEFAULT_REASON (draft
//  * saves are not audited).
//  */
// export function TemplateEditorGate(props: Props) {
//   return <TemplateEditor {...props} reason={ADMIN_DEFAULT_REASON} />;
// }
//
// function TemplateEditor({ initial, config, pageNames, draftVersion, reason }: Props & { reason: string }) {
//   const [changelogOpen, setChangelogOpen] = useState(false);
//   const [changelog, setChangelog] = useState("");
//   const resolver = useRef<((value: string | null) => void) | null>(null);
//
//   const askChangelog = useCallback(
//     () =>
//       new Promise<string | null>((resolve) => {
//         resolver.current = resolve;
//         setChangelog("");
//         setChangelogOpen(true);
//       }),
//     [],
//   );
//
//   const answer = (value: string | null) => {
//     resolver.current?.(value);
//     resolver.current = null;
//     setChangelogOpen(false);
//   };
//
//   const adapter = useTemplateAdapter({
//     templateId: initial.storeId,
//     reason,
//     config,
//     pageNames,
//     draftVersion,
//     catalog: initial.catalog,
//     askChangelog,
//     onRestored: () => window.location.reload(),
//   });
//
//   return (
//     <>
//       <StoreEditor initial={initial} adapter={adapter} />
//       <Dialog open={changelogOpen} onOpenChange={(open) => (open ? setChangelogOpen(true) : answer(null))}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Publish a new template version</DialogTitle>
//             <DialogDescription>
//               Stores created from now on start from this version, and the seller gallery shows it. Stores that already use the
//               template keep their site. Publishing does not change whether the template is shown to sellers (its Active switch).
//             </DialogDescription>
//           </DialogHeader>
//           <form
//             className="space-y-4"
//             onSubmit={(event) => {
//               event.preventDefault();
//               answer(changelog.trim());
//             }}
//           >
//             <div className="space-y-1.5">
//               <Label htmlFor="template-changelog">What changed (optional)</Label>
//               <Textarea
//                 id="template-changelog"
//                 rows={3}
//                 maxLength={500}
//                 value={changelog}
//                 onChange={(e) => setChangelog(e.target.value)}
//                 placeholder="New hero and tighter product grid"
//                 autoFocus
//               />
//             </div>
//             <DialogFooter>
//               <Button type="button" variant="outline" onClick={() => answer(null)}>
//                 Cancel
//               </Button>
//               <Button type="submit">Publish version</Button>
//             </DialogFooter>
//           </form>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }
//
