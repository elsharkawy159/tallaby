"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { BellRing, LoaderCircle } from "lucide-react";

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
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
import {
  ADMIN_MESSAGE_BODY_MAX,
  ADMIN_MESSAGE_LINK_MAX,
  ADMIN_MESSAGE_TITLE_MAX,
  isDashboardPath,
} from "@workspace/lib/notifications";
import { sendSellerNotificationAction } from "./seller-admin.server";

/** Seller dashboard pages a message usually points to. */
const LINKS: { label: string; path: string }[] = [
  { label: "None", path: "" },
  { label: "Orders", path: "/orders" },
  { label: "Products", path: "/products" },
  { label: "Wallet", path: "/wallet" },
  { label: "Settings", path: "/settings" },
];

/**
 * Admin › Sellers › <seller> › "Send notification" (ROADMAP.md F-06f): a
 * message that lands in the seller dashboard bell and is pushed to every
 * device where the seller turned alerts on. Written as-is (no translation),
 * so write it in the seller's language. Logged in the seller's audit tab.
 */
export function SendSellerNotification({ sellerId, sellerName }: { sellerId: string; sellerName: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [pending, startTransition] = useTransition();

  const linkOk = link.trim() === "" || isDashboardPath(link.trim());
  const canSend = title.trim().length > 0 && body.trim().length > 0 && linkOk && !pending;

  const reset = () => {
    setTitle("");
    setBody("");
    setLink("");
    setKey(crypto.randomUUID());
  };

  const send = () =>
    startTransition(async () => {
      const result = await sendSellerNotificationAction({
        sellerId,
        title,
        body,
        link: link.trim() || undefined,
        idempotencyKey: key,
      });
      if (result.success) {
        toast.success(result.message);
        reset();
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <BellRing className="size-4" />
        Send notification
      </Button>
      <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send a notification to {sellerName}</DialogTitle>
            <DialogDescription>
              It appears in the seller&apos;s dashboard bell and as a phone or browser alert on every device where they
              turned alerts on. It is shown exactly as written, so write it in the seller&apos;s language (usually
              Arabic).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="seller-notify-title">Title</Label>
              <Input
                id="seller-notify-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={ADMIN_MESSAGE_TITLE_MAX}
                dir="auto"
                placeholder="مثال: تحديث مهم لمتجرك"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seller-notify-body">Message</Label>
              <Textarea
                id="seller-notify-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                maxLength={ADMIN_MESSAGE_BODY_MAX}
                rows={4}
                dir="auto"
              />
              <p className="text-end text-xs text-muted-foreground tabular-nums">
                {body.length}/{ADMIN_MESSAGE_BODY_MAX}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seller-notify-link">Opens (optional)</Label>
              <div className="flex flex-wrap gap-1.5">
                {LINKS.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setLink(option.path)}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs transition-colors hover:bg-muted",
                      link === option.path && "border-primary bg-primary/10 text-primary",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <Input
                id="seller-notify-link"
                value={link}
                onChange={(event) => setLink(event.target.value)}
                maxLength={ADMIN_MESSAGE_LINK_MAX}
                dir="ltr"
                placeholder="/wallet"
                aria-invalid={!linkOk}
              />
              <p className={cn("text-xs", linkOk ? "text-muted-foreground" : "text-destructive")}>
                A page in the seller dashboard, starting with /. Leave empty to just show the message.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={send} disabled={!canSend}>
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : <BellRing className="size-4" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
