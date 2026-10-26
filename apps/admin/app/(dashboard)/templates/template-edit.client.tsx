// Disabled 2026-10-27: storefront templates and the section library come from the codebase only
// (owner; @workspace/store-sections). The templates, template_versions and library_sections tables
// were dropped (0109). The original code is kept below, commented out, for reference.
export {};

// "use client";
//
// import { useState, useTransition } from "react";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";
// import { Button } from "@workspace/ui/components/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@workspace/ui/components/dialog";
// import { Input } from "@workspace/ui/components/input";
// import { Label } from "@workspace/ui/components/label";
// import { Switch } from "@workspace/ui/components/switch";
// import { ADMIN_DEFAULT_REASON } from "@workspace/lib/admin";
// import { updateTemplateAction } from "./templates.server";
//
// /** Gallery settings of one template: active, premium + price, order. Saves are audited. */
// export function TemplateEditButton({
//   template,
// }: {
//   template: { id: string; name: string; isActive: boolean; isPremium: boolean; price: string | null; sortOrder: number; isDefault: boolean };
// }) {
//   const router = useRouter();
//   const [open, setOpen] = useState(false);
//   const [isActive, setIsActive] = useState(template.isActive);
//   const [isPremium, setIsPremium] = useState(template.isPremium);
//   const [price, setPrice] = useState(template.price ?? "");
//   const [sortOrder, setSortOrder] = useState(String(template.sortOrder));
//   const [pending, startTransition] = useTransition();
//
//   const save = () =>
//     startTransition(async () => {
//       const result = await updateTemplateAction({
//         templateId: template.id,
//         isActive,
//         isPremium,
//         price: price.trim() ? price.trim() : null,
//         sortOrder: Number.parseInt(sortOrder, 10) || 0,
//         reason: ADMIN_DEFAULT_REASON,
//       });
//       if (result.success) {
//         toast.success(result.message);
//         setOpen(false);
//         router.refresh();
//       } else {
//         toast.error(result.error);
//       }
//     });
//
//   return (
//     <>
//       <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
//         Settings
//       </Button>
//       <Dialog open={open} onOpenChange={setOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>{template.name}</DialogTitle>
//             <DialogDescription>
//               Gallery settings only (edit the pages with Edit design). Stores already using this template are not changed.
//             </DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4">
//             <label className="flex items-center justify-between gap-3">
//               <span className="text-sm">
//                 Active (shown in the seller gallery)
//                 {template.isDefault ? (
//                   <span className="block text-xs text-muted-foreground">The default template must stay active.</span>
//                 ) : (
//                   !template.isActive && <span className="block text-xs text-muted-foreground">Inactive: turn this on to show it to sellers. Publishing a version does not.</span>
//                 )}
//               </span>
//               <Switch checked={isActive} onCheckedChange={setIsActive} disabled={template.isDefault} />
//             </label>
//             <label className="flex items-center justify-between gap-3">
//               <span className="text-sm">Premium</span>
//               <Switch checked={isPremium} onCheckedChange={setIsPremium} />
//             </label>
//             <div className="grid grid-cols-2 gap-3">
//               <div className="space-y-1.5">
//                 <Label htmlFor="template-price">Price (EGP)</Label>
//                 <Input id="template-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={isPremium ? "Required" : "Free"} />
//               </div>
//               <div className="space-y-1.5">
//                 <Label htmlFor="template-order">Order</Label>
//                 <Input id="template-order" inputMode="numeric" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
//               </div>
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
//               Cancel
//             </Button>
//             <Button onClick={save} disabled={pending || (isPremium && !price.trim())}>
//               Save
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }
//
