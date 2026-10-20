"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { updateTemplateAction } from "./templates.server";

/** Gallery settings of one template: active, premium + price, order. A reason is required. */
export function TemplateEditButton({
  template,
}: {
  template: { id: string; name: string; isActive: boolean; isPremium: boolean; price: string | null; sortOrder: number; isDefault: boolean };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isActive, setIsActive] = useState(template.isActive);
  const [isPremium, setIsPremium] = useState(template.isPremium);
  const [price, setPrice] = useState(template.price ?? "");
  const [sortOrder, setSortOrder] = useState(String(template.sortOrder));
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const result = await updateTemplateAction({
        templateId: template.id,
        isActive,
        isPremium,
        price: price.trim() ? price.trim() : null,
        sortOrder: Number.parseInt(sortOrder, 10) || 0,
        reason: reason.trim(),
      });
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        setReason("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Edit
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{template.name}</DialogTitle>
            <DialogDescription>
              Gallery settings only. Stores already using this template are not changed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm">
                Shown in the gallery
                {template.isDefault && <span className="block text-xs text-muted-foreground">The default template must stay active.</span>}
              </span>
              <Switch checked={isActive} onCheckedChange={setIsActive} disabled={template.isDefault} />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm">Premium</span>
              <Switch checked={isPremium} onCheckedChange={setIsPremium} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="template-price">Price (EGP)</Label>
                <Input id="template-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={isPremium ? "Required" : "Free"} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="template-order">Order</Label>
                <Input id="template-order" inputMode="numeric" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="template-reason">Reason (saved in the audit log)</Label>
              <Textarea id="template-reason" rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={save} disabled={pending || reason.trim().length < 3 || (isPremium && !price.trim())}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
