"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { THEME_REQUEST_REPLY_MAX, THEME_REQUEST_STATUSES, type ThemeRequestStatus } from "@workspace/lib/theme-requests";
import { STATUS_LABELS } from "../theme-requests.lib";
import { updateThemeRequestAction } from "../theme-requests.server";

const STATUS_HELP: Record<ThemeRequestStatus, string> = {
  new: "Not started. The seller isn't notified.",
  in_progress: "The seller gets a bell + push notification.",
  ready: "Bell + push and an email. Ship the theme to the gallery first.",
  declined: "Bell + push and an email. Say why in the reply.",
};

export function ThemeRequestForm({ requestId, status, reply }: { requestId: string; status: ThemeRequestStatus; reply: string | null }) {
  const router = useRouter();
  const [next, setNext] = useState<ThemeRequestStatus>(status);
  const [text, setText] = useState(reply ?? "");
  const [pending, startTransition] = useTransition();
  const changed = next !== status || text.trim() !== (reply ?? "");

  const save = () =>
    startTransition(async () => {
      const result = await updateThemeRequestAction({ requestId, status: next, reply: text.trim() || null });
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });

  return (
    <div className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Status</legend>
        {THEME_REQUEST_STATUSES.map((value) => (
          <label key={value} className="flex cursor-pointer items-start gap-2 rounded-md border p-2.5 text-sm has-checked:border-primary">
            <input
              type="radio"
              name="status"
              value={value}
              checked={next === value}
              onChange={() => setNext(value)}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">{STATUS_LABELS[value]}</span>
              <span className="block text-xs text-muted-foreground">{STATUS_HELP[value]}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="space-y-1.5">
        <Label htmlFor="theme-request-reply">Reply to the seller</Label>
        <Textarea
          id="theme-request-reply"
          rows={5}
          dir="auto"
          maxLength={THEME_REQUEST_REPLY_MAX}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Shown on the seller's request list and in the ready/declined email."
        />
        <p className="text-xs text-muted-foreground">
          {text.length}/{THEME_REQUEST_REPLY_MAX}. Saving the same status again notifies nobody.
        </p>
      </div>
      <Button className="w-full" disabled={pending || !changed} onClick={save}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
