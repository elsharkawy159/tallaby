// Disabled 2026-10-27: storefront templates and the section library come from the codebase only
// (owner; @workspace/store-sections). The templates, template_versions and library_sections tables
// were dropped (0109). The original code is kept below, commented out, for reference.
export {};

// "use client";
//
// import { useState, useTransition } from "react";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";
// import { ADMIN_DEFAULT_REASON } from "@workspace/lib/admin";
// import { Button } from "@workspace/ui/components/button";
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
// import { Input } from "@workspace/ui/components/input";
// import { Label } from "@workspace/ui/components/label";
// import { createTemplateAction, duplicateTemplateAction, type TemplateActionResult } from "./templates.server";
//
// // Same rule as templateKeySchema (templates-studio-admin.lib.ts).
// const KEY_RE = /^[a-z0-9][a-z0-9-]{1,62}$/;
// const CATEGORY_RE = /^[a-z0-9-]{1,40}$/;
//
// type Mode = { kind: "create" } | { kind: "duplicate"; source: { id: string; key: string; name: string } };
//
// const INACTIVE_NOTE = "It starts inactive: sellers do not see it until you turn on Active (Settings) on this page.";
//
// /**
//  * New template (blank: one empty home page, Classic's design system) or a
//  * duplicate of one (its current version and meta under a new key). Both are
//  * audited, start inactive and open in the template editor.
//  */
// function TemplateFormDialog({ mode, categories, open, onOpenChange }: { mode: Mode; categories: readonly string[]; open: boolean; onOpenChange: (open: boolean) => void }) {
//   const router = useRouter();
//   const [key, setKey] = useState(mode.kind === "duplicate" ? `${mode.source.key}-copy`.slice(0, 63) : "");
//   const [nameEn, setNameEn] = useState("");
//   const [nameAr, setNameAr] = useState("");
//   const [category, setCategory] = useState(categories[0] ?? "general");
//   const [pending, startTransition] = useTransition();
//
//   const creating = mode.kind === "create";
//   const valid = KEY_RE.test(key.trim()) && (!creating || (nameEn.trim() && nameAr.trim() && CATEGORY_RE.test(category.trim())));
//
//   const save = () =>
//     startTransition(async () => {
//       let result: TemplateActionResult;
//       if (mode.kind === "create") {
//         result = await createTemplateAction({
//           key: key.trim(),
//           name: { ar: nameAr.trim(), en: nameEn.trim() },
//           description: { ar: "", en: "" },
//           category: category.trim(),
//           reason: ADMIN_DEFAULT_REASON,
//         });
//       } else {
//         result = await duplicateTemplateAction({ id: mode.source.id, key: key.trim(), reason: ADMIN_DEFAULT_REASON });
//       }
//       if (!result.success) {
//         toast.error(result.error);
//         return;
//       }
//       toast.success(result.message);
//       onOpenChange(false);
//       if (result.id) router.push(`/templates/${result.id}/editor`);
//       else router.refresh();
//     });
//
//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
//         <DialogHeader>
//           <DialogTitle>{creating ? "New template" : `Duplicate ${mode.source.name}`}</DialogTitle>
//           <DialogDescription>
//             {creating ? "A blank template: one empty home page with Tallaby Classic's colors and fonts. " : "A copy of its current published version. "}
//             {INACTIVE_NOTE}
//           </DialogDescription>
//         </DialogHeader>
//         <div className="space-y-4">
//           <div className="space-y-1.5">
//             <Label htmlFor="template-key">Key</Label>
//             <Input id="template-key" dir="ltr" value={key} onChange={(e) => setKey(e.target.value.toLowerCase())} placeholder="summer-sale" maxLength={63} />
//             <p className="text-xs text-muted-foreground">Lowercase letters, digits and dashes (2–63). It cannot be changed later.</p>
//           </div>
//           {creating && (
//             <>
//               <div className="grid grid-cols-2 gap-3">
//                 <div className="space-y-1.5">
//                   <Label htmlFor="template-name-en">Name (English)</Label>
//                   <Input id="template-name-en" value={nameEn} onChange={(e) => setNameEn(e.target.value)} maxLength={80} />
//                 </div>
//                 <div className="space-y-1.5">
//                   <Label htmlFor="template-name-ar">Name (Arabic)</Label>
//                   <Input id="template-name-ar" dir="rtl" value={nameAr} onChange={(e) => setNameAr(e.target.value)} maxLength={80} />
//                 </div>
//               </div>
//               <div className="space-y-1.5">
//                 <Label htmlFor="template-category">Category</Label>
//                 <Input
//                   id="template-category"
//                   dir="ltr"
//                   list="template-categories"
//                   value={category}
//                   onChange={(e) => setCategory(e.target.value.toLowerCase())}
//                   maxLength={40}
//                 />
//                 <datalist id="template-categories">
//                   {categories.map((id) => (
//                     <option key={id} value={id} />
//                   ))}
//                 </datalist>
//               </div>
//             </>
//           )}
//         </div>
//         <DialogFooter>
//           <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
//             Cancel
//           </Button>
//           <Button onClick={save} disabled={pending || !valid}>
//             {creating ? "Create and edit" : "Duplicate and edit"}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }
//
// function DialogButton({ label, mode, categories, variant = "outline" }: { label: string; mode: Mode; categories: readonly string[]; variant?: "outline" | "default" }) {
//   const [open, setOpen] = useState(false);
//   return (
//     <>
//       <Button size="sm" variant={variant} onClick={() => setOpen(true)}>
//         {label}
//       </Button>
//       {open && <TemplateFormDialog mode={mode} categories={categories} open={open} onOpenChange={setOpen} />}
//     </>
//   );
// }
//
// export function NewTemplateButton({ categories }: { categories: readonly string[] }) {
//   return <DialogButton label="New template" mode={{ kind: "create" }} categories={categories} variant="default" />;
// }
//
// export function DuplicateTemplateButton({ template }: { template: { id: string; key: string; name: string } }) {
//   return <DialogButton label="Duplicate" mode={{ kind: "duplicate", source: template }} categories={[]} />;
// }
//
