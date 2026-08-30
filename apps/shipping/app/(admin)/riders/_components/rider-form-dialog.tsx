"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";

import { createRider, updateRider } from "../riders.server";

interface RiderFormDialogProps {
  rider?: {
    id: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
  };
}

export function RiderFormDialog({ rider }: RiderFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [fullName, setFullName] = useState(rider?.fullName ?? "");
  const [email, setEmail] = useState(rider?.email ?? "");
  const [phone, setPhone] = useState(rider?.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(rider?.avatarUrl ?? "");

  const submit = () => {
    startTransition(async () => {
      const result = rider
        ? await updateRider({ riderId: rider.id, fullName, phone, avatarUrl })
        : await createRider({ fullName, email, phone, avatarUrl });

      if (result.success) {
        toast.success(result.message ?? "Saved");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {rider ? (
          <Button variant="ghost" size="icon" aria-label={`Edit ${rider.fullName ?? "rider"}`}>
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="size-4" />
            Add rider
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{rider ? "Edit rider" : "Add rider"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="rider-name">Full name</Label>
            <Input id="rider-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rider-email">Email</Label>
            <Input
              id="rider-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!rider}
            />
            {rider && (
              <p className="text-xs text-muted-foreground">
                Email can&apos;t be changed here.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rider-phone">Phone</Label>
            <Input id="rider-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rider-avatar">Avatar URL</Label>
            <Input
              id="rider-avatar"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending || !fullName || !phone || (!rider && !email)}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {rider ? "Save changes" : "Create rider"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
