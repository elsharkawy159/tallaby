"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { BellRing, LoaderCircle, RefreshCw } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
import type { SellerAudience } from "@workspace/lib/admin";
import {
  ADMIN_MESSAGE_BODY_MAX,
  ADMIN_MESSAGE_LINK_MAX,
  ADMIN_MESSAGE_TITLE_MAX,
  isDashboardPath,
} from "@workspace/lib/notifications";
import { countSellerAudienceAction, sendSellerBroadcastAction } from "./seller-notifications.server";
import {
  SELLER_AUDIENCE_GROUPS,
  SELLER_AUDIENCE_LABELS,
  findSellerNotificationTemplate,
  templateFields,
  type SellerMessageLanguage,
} from "./seller-notification-templates.lib";
import { TemplatePicker } from "./template-picker.client";

type Count = { count: number; sample: string[] } | null;

/** The bell's "from" line in the seller dashboard (notifications.types.admin_message.from). */
const FROM_LINE: Record<SellerMessageLanguage, string> = { ar: "من فريق طلبي", en: "From the Tallaby team" };

/**
 * Admin › Seller notifications: pick a template (or write one), choose the
 * audience, check the live count and the preview, then confirm "Send to N
 * sellers?". The message is sent as written in one language.
 */
export function SellerNotificationsForm() {
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [language, setLanguage] = useState<SellerMessageLanguage>("ar");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [audience, setAudience] = useState<SellerAudience>("all");
  const [count, setCount] = useState<Count>(null);
  const [countError, setCountError] = useState<string | null>(null);
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [confirming, setConfirming] = useState(false);
  const [counting, startCounting] = useTransition();
  const [sending, startSending] = useTransition();

  const refreshCount = useCallback((target: SellerAudience) => {
    startCounting(async () => {
      const result = await countSellerAudienceAction(target);
      if (result.success) {
        setCount(result.data);
        setCountError(null);
      } else {
        setCount(null);
        setCountError(result.error);
      }
    });
  }, []);

  useEffect(() => {
    refreshCount(audience);
  }, [audience, refreshCount]);

  const pick = (id: string | null, lang: SellerMessageLanguage) => {
    const fields = templateFields(id, lang);
    if (fields) {
      setTitle(fields.title);
      setBody(fields.body);
      setLink(fields.link);
      // Preselect the template's usual audience only when the template changes.
      if (id !== templateId) setAudience(findSellerNotificationTemplate(id)!.audience);
    } else if (id === null && templateId !== null) {
      setTitle("");
      setBody("");
      setLink("");
    }
    setTemplateId(id);
    setLanguage(lang);
  };

  const trimmedLink = link.trim();
  const linkOk = trimmedLink === "" || isDashboardPath(trimmedLink);
  const recipients = count?.count ?? 0;
  const busy = sending || counting;
  const canSend = title.trim().length > 0 && body.trim().length > 0 && linkOk && recipients > 0 && !busy;

  const send = () =>
    startSending(async () => {
      const result = await sendSellerBroadcastAction({
        audience,
        title,
        body,
        link: trimmedLink || undefined,
        ...(templateId ? { templateId } : {}),
        expectedCount: recipients,
        idempotencyKey: key,
      });
      setConfirming(false);
      if (result.success) {
        toast.success(result.message);
        setKey(crypto.randomUUID());
        refreshCount(audience);
      } else {
        toast.error(result.error);
        if (typeof result.count === "number") setCount((current) => ({ count: result.count!, sample: current?.sample ?? [] }));
      }
    });

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Start from a template</Label>
            <TemplatePicker templateId={templateId} language={language} onPick={pick} disabled={sending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="broadcast-title">Title</Label>
            <Input
              id="broadcast-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={ADMIN_MESSAGE_TITLE_MAX}
              dir="auto"
              disabled={sending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="broadcast-body">Message</Label>
            <Textarea
              id="broadcast-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={ADMIN_MESSAGE_BODY_MAX}
              rows={4}
              dir="auto"
              disabled={sending}
            />
            <p className="text-end text-xs text-muted-foreground tabular-nums">
              {body.length}/{ADMIN_MESSAGE_BODY_MAX} · phone alerts show about the first 180
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="broadcast-link">Opens (optional)</Label>
            <Input
              id="broadcast-link"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              maxLength={ADMIN_MESSAGE_LINK_MAX}
              dir="ltr"
              placeholder="/wallet?topup=1"
              aria-invalid={!linkOk}
              disabled={sending}
            />
            <p className={cn("text-xs", linkOk ? "text-muted-foreground" : "text-destructive")}>
              A page in the seller dashboard, starting with /. /welcome opens the setup page of the seller&apos;s
              selected store.
            </p>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Send to</legend>
            {SELLER_AUDIENCE_GROUPS.map((group) => (
              <div key={group.label} className="space-y-2">
                <p className="pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{group.label}</p>
                {group.audiences.map((value) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 has-[:checked]:border-primary"
                  >
                    <input
                      type="radio"
                      name="audience"
                      value={value}
                      checked={audience === value}
                      onChange={() => setAudience(value)}
                      disabled={sending}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-medium">{SELLER_AUDIENCE_LABELS[value].label}</span>
                      <span className="block text-xs text-muted-foreground">{SELLER_AUDIENCE_LABELS[value].hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            ))}
          </fieldset>
        </CardContent>
      </Card>

      <div className="space-y-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Recipients</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refreshCount(audience)} disabled={busy} aria-label="Count again">
              <RefreshCw className={cn("size-4", counting && "animate-spin")} />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {countError ? (
              <p className="text-destructive">{countError}</p>
            ) : count === null ? (
              <p className="text-muted-foreground">Counting…</p>
            ) : (
              <>
                <p className="text-2xl font-semibold tabular-nums">
                  {count.count} <span className="text-sm font-normal text-muted-foreground">seller{count.count === 1 ? "" : "s"}</span>
                </p>
                {count.sample.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Newest: {count.sample.join(", ")}
                    {count.count > count.sample.length ? ", …" : ""}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div dir={language === "ar" ? "rtl" : "ltr"} className="rounded-2xl border bg-muted/40 p-3 text-start">
              <span className="block text-[11px] font-bold text-primary">{FROM_LINE[language]}</span>
              <p className="text-sm font-semibold" dir="auto">
                {title.trim() || "…"}
              </p>
              <p className="mt-0.5 whitespace-pre-line text-sm text-muted-foreground" dir="auto">
                {body.trim() || "…"}
              </p>
              {trimmedLink && linkOk && (
                <p className="mt-1.5 text-xs text-muted-foreground" dir="ltr">
                  Opens {trimmedLink}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Button className="w-full" onClick={() => setConfirming(true)} disabled={!canSend}>
          <BellRing className="size-4" />
          Send to {recipients} seller{recipients === 1 ? "" : "s"}
        </Button>
      </div>

      <AlertDialog open={confirming} onOpenChange={(next) => !sending && setConfirming(next)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Send to {recipients} seller{recipients === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {SELLER_AUDIENCE_LABELS[audience].label}. Each one gets it in their dashboard bell and as an alert on every
              device where they turned alerts on. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
            <Button onClick={send} disabled={sending}>
              {sending ? <LoaderCircle className="size-4 animate-spin" /> : <BellRing className="size-4" />}
              Send
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
