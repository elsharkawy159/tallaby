"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, NotebookPen } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";

import { addDeliveryNote } from "../rider.server";

export function AddNote({ shipmentId }: { shipmentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  if (!open) {
    return (
      <Button
        variant="ghost"
        className="w-full text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <NotebookPen className="size-4" />
        Add note
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border bg-white p-4 dark:bg-gray-950">
      <Textarea
        autoFocus
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="e.g. Customer asked to deliver after 6 PM"
        rows={2}
        disabled={isPending}
      />
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="h-10 flex-1"
          disabled={isPending}
          onClick={() => {
            setOpen(false);
            setNote("");
          }}
        >
          Cancel
        </Button>
        <Button
          className="h-10 flex-1"
          disabled={isPending || !note.trim()}
          onClick={() => {
            startTransition(async () => {
              const result = await addDeliveryNote({ shipmentId, note });
              if (result.success) {
                toast.success(result.message ?? "Note added");
                setOpen(false);
                setNote("");
                router.refresh();
              } else {
                toast.error(result.error ?? "Something went wrong");
              }
            });
          }}
        >
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Save note
        </Button>
      </div>
    </div>
  );
}
