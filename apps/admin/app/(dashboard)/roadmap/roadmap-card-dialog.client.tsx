"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ROADMAP_ADMIN_CATEGORIES,
  ROADMAP_ADMIN_STATUSES,
  ROADMAP_CATEGORY_LABELS,
  ROADMAP_STATUS_LABELS,
  roadmapCardInputSchema,
  type RoadmapAdminCategory,
  type RoadmapAdminStatus,
} from "@workspace/lib/admin";
import type { AdminRoadmapCard } from "@workspace/lib/admin/server";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { saveRoadmapCardAction } from "./roadmap.server";

type Form = {
  status: RoadmapAdminStatus;
  category: RoadmapAdminCategory;
  title: string;
  description: string;
  titleEn: string;
  descriptionEn: string;
  roadmapRef: string;
  launchedAt: string;
};

const EMPTY: Form = {
  status: "planned",
  category: "other",
  title: "",
  description: "",
  titleEn: "",
  descriptionEn: "",
  roadmapRef: "",
  launchedAt: "",
};

function toForm(card: AdminRoadmapCard | null): Form {
  if (!card) return EMPTY;
  return {
    status: card.status,
    category: card.category,
    title: card.title,
    description: card.description,
    titleEn: card.titleEn ?? "",
    descriptionEn: card.descriptionEn ?? "",
    roadmapRef: card.roadmapRef ?? "",
    launchedAt: card.launchedAt ?? "",
  };
}

/** Add a team card (`card` null) or edit any card, seller ideas included. */
export function RoadmapCardDialog({
  card,
  open,
  onOpenChange,
  onSaved,
}: {
  card: AdminRoadmapCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) setForm(toForm(card));
  }, [open, card]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = () => {
    const input = { ...(card ? { id: card.id } : {}), ...form };
    if (!roadmapCardInputSchema.safeParse(input).success) {
      toast.error("Arabic title needs 3 to 120 characters. Check the id (letters, digits, - or _) and the date.");
      return;
    }
    startTransition(async () => {
      const result = await saveRoadmapCardAction(input);
      if (result.success) {
        toast.success(result.message);
        onSaved();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{card ? "Edit card" : "New roadmap card"}</DialogTitle>
          <DialogDescription>
            {card?.sellerId
              ? `Suggested by ${card.storeName || card.sellerName || "a seller"}. Fix the wording or add English text; the seller still shows as the author.`
              : "A Tallaby team card. Arabic is shown by default; English is shown to sellers who use the dashboard in English."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Column</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v as RoadmapAdminStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROADMAP_ADMIN_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {ROADMAP_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => set("category", v as RoadmapAdminCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROADMAP_ADMIN_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {ROADMAP_CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="rm-title">Title (Arabic)</Label>
            <Input id="rm-title" dir="rtl" value={form.title} maxLength={120} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="rm-desc">Description (Arabic)</Label>
            <Textarea
              id="rm-desc"
              dir="rtl"
              rows={3}
              maxLength={2000}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="rm-title-en">Title (English, optional)</Label>
            <Input id="rm-title-en" value={form.titleEn} maxLength={120} onChange={(e) => set("titleEn", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="rm-desc-en">Description (English, optional)</Label>
            <Textarea
              id="rm-desc-en"
              rows={3}
              maxLength={2000}
              value={form.descriptionEn}
              onChange={(e) => set("descriptionEn", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rm-ref">ROADMAP.md id (optional)</Label>
            <Input
              id="rm-ref"
              value={form.roadmapRef}
              maxLength={40}
              placeholder="F-12"
              className="font-mono"
              onChange={(e) => set("roadmapRef", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rm-launched">Launch date</Label>
            <Input
              id="rm-launched"
              type="date"
              value={form.launchedAt}
              disabled={form.status !== "launched"}
              onChange={(e) => set("launchedAt", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Only for Launched. Empty means today.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending ? "Saving…" : card ? "Save changes" : "Add card"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
