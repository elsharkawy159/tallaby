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
// import { Textarea } from "@workspace/ui/components/textarea";
// import { createSectionAction, duplicateSectionAction, updateSectionMetaAction, type SectionActionResult } from "./sections.server";
//
// const SELECT_CLASS = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";
// const KEY_RE = /^[a-z0-9-]{2,48}$/;
//
// export type SectionDetails = {
//   id: string;
//   key: string;
//   category: string;
//   subcategory: string;
//   name: { ar: string; en: string };
//   description: { ar: string; en: string };
// };
//
// type Mode = { kind: "create" } | { kind: "duplicate"; source: SectionDetails } | { kind: "edit"; section: SectionDetails };
//
// /**
//  * One dialog for a new blank section, a duplicate (new key) and the details
//  * of an existing one. Every save is audited. A new or
//  * duplicated section opens in the section editor; sellers only see it after
//  * its first Publish.
//  */
// function SectionFormDialog({ mode, categories, open, onOpenChange }: { mode: Mode; categories: readonly string[]; open: boolean; onOpenChange: (open: boolean) => void }) {
//   const router = useRouter();
//   const base = mode.kind === "create" ? null : mode.kind === "duplicate" ? mode.source : mode.section;
//   const [key, setKey] = useState(mode.kind === "duplicate" ? `${mode.source.key}-copy`.slice(0, 48) : "");
//   const [category, setCategory] = useState(base?.category ?? categories[0] ?? "hero");
//   const [subcategory, setSubcategory] = useState(base?.subcategory ?? "");
//   const [nameAr, setNameAr] = useState(base?.name.ar ?? "");
//   const [nameEn, setNameEn] = useState(base?.name.en ?? "");
//   const [descriptionAr, setDescriptionAr] = useState(base?.description.ar ?? "");
//   const [descriptionEn, setDescriptionEn] = useState(base?.description.en ?? "");
//   const [pending, startTransition] = useTransition();
//
//   const needsKey = mode.kind !== "edit";
//   const editsMeta = mode.kind !== "duplicate";
//   const valid = (!needsKey || KEY_RE.test(key.trim())) && (!editsMeta || (nameAr.trim() && nameEn.trim()));
//
//   const title = mode.kind === "create" ? "New section" : mode.kind === "duplicate" ? `Duplicate ${mode.source.name.en || mode.source.key}` : `Details of ${mode.section.name.en || mode.section.key}`;
//
//   const save = () =>
//     startTransition(async () => {
//       const meta = {
//         category,
//         subcategory: subcategory.trim(),
//         name: { ar: nameAr.trim(), en: nameEn.trim() },
//         description: { ar: descriptionAr.trim(), en: descriptionEn.trim() },
//         reason: ADMIN_DEFAULT_REASON,
//       };
//       let result: SectionActionResult;
//       if (mode.kind === "create") result = await createSectionAction({ key: key.trim(), ...meta });
//       else if (mode.kind === "duplicate") result = await duplicateSectionAction({ id: mode.source.id, key: key.trim(), reason: ADMIN_DEFAULT_REASON });
//       else result = await updateSectionMetaAction({ id: mode.section.id, ...meta });
//       if (!result.success) {
//         toast.error(result.error);
//         return;
//       }
//       toast.success(result.message);
//       onOpenChange(false);
//       if (result.id) router.push(`/sections/${result.id}/editor`);
//       else router.refresh();
//     });
//
//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
//         <DialogHeader>
//           <DialogTitle>{title}</DialogTitle>
//           <DialogDescription>
//             {mode.kind === "edit"
//               ? "How the section is listed in sellers' Add › Sections. Stores that already use it are not changed."
//               : "It opens in the section editor. Sellers see it only after you publish it."}
//           </DialogDescription>
//         </DialogHeader>
//         <div className="space-y-4">
//           {needsKey && (
//             <div className="space-y-1.5">
//               <Label htmlFor="section-key">Key</Label>
//               <Input id="section-key" dir="ltr" value={key} onChange={(e) => setKey(e.target.value.toLowerCase())} placeholder="hero-summer" maxLength={48} />
//               <p className="text-xs text-muted-foreground">Lowercase letters, digits and dashes (2–48). It cannot be changed later.</p>
//             </div>
//           )}
//           {editsMeta && (
//             <>
//               <div className="grid grid-cols-2 gap-3">
//                 <div className="space-y-1.5">
//                   <Label htmlFor="section-category">Category</Label>
//                   <select id="section-category" className={SELECT_CLASS} value={category} onChange={(e) => setCategory(e.target.value)}>
//                     {categories.map((id) => (
//                       <option key={id} value={id}>
//                         {id}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//                 <div className="space-y-1.5">
//                   <Label htmlFor="section-subcategory">Subcategory</Label>
//                   <Input id="section-subcategory" dir="ltr" value={subcategory} onChange={(e) => setSubcategory(e.target.value.toLowerCase())} placeholder="split" maxLength={40} />
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 gap-3">
//                 <div className="space-y-1.5">
//                   <Label htmlFor="section-name-en">Name (English)</Label>
//                   <Input id="section-name-en" value={nameEn} onChange={(e) => setNameEn(e.target.value)} maxLength={80} />
//                 </div>
//                 <div className="space-y-1.5">
//                   <Label htmlFor="section-name-ar">Name (Arabic)</Label>
//                   <Input id="section-name-ar" dir="rtl" value={nameAr} onChange={(e) => setNameAr(e.target.value)} maxLength={80} />
//                 </div>
//               </div>
//               <div className="grid grid-cols-2 gap-3">
//                 <div className="space-y-1.5">
//                   <Label htmlFor="section-description-en">Description (English)</Label>
//                   <Textarea id="section-description-en" rows={2} value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} maxLength={300} />
//                 </div>
//                 <div className="space-y-1.5">
//                   <Label htmlFor="section-description-ar">Description (Arabic)</Label>
//                   <Textarea id="section-description-ar" dir="rtl" rows={2} value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} maxLength={300} />
//                 </div>
//               </div>
//             </>
//           )}
//         </div>
//         <DialogFooter>
//           <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
//             Cancel
//           </Button>
//           <Button onClick={save} disabled={pending || !valid}>
//             {mode.kind === "create" ? "Create and edit" : mode.kind === "duplicate" ? "Duplicate and edit" : "Save"}
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
//       {open && <SectionFormDialog mode={mode} categories={categories} open={open} onOpenChange={setOpen} />}
//     </>
//   );
// }
//
// export function NewSectionButton({ categories }: { categories: readonly string[] }) {
//   return <DialogButton label="New section" mode={{ kind: "create" }} categories={categories} variant="default" />;
// }
//
// export function DuplicateSectionButton({ section, categories }: { section: SectionDetails; categories: readonly string[] }) {
//   return <DialogButton label="Duplicate" mode={{ kind: "duplicate", source: section }} categories={categories} />;
// }
//
// export function SectionDetailsButton({ section, categories }: { section: SectionDetails; categories: readonly string[] }) {
//   return <DialogButton label="Details" mode={{ kind: "edit", section }} categories={categories} />;
// }
//
