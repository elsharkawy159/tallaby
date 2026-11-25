"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import {
  META_RATE_MAX_MICROS,
  WHATSAPP_EVENTS,
  WHATSAPP_RATE_CATEGORIES,
  formatMicrosUsd,
  type WhatsAppAdminSettings,
  type WhatsAppRateCategory,
} from "@workspace/lib/whatsapp/admin";
import type { WhatsAppFailedMessage } from "@workspace/lib/whatsapp/admin/server";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import {
  retryWhatsAppMessagesAction,
  submitWhatsAppTemplatesAction,
  syncWhatsAppTemplatesAction,
  updateWhatsAppSettingsAction,
} from "./whatsapp.server";
import { EVENT_LABELS, RATE_LABELS, cairoTime } from "./whatsapp.lib";

// ── Settings ─────────────────────────────────────────────────────────────

/** The global switch, stores' default, per-event switches and Meta rates. The seller price is fixed at Free (D3). */
export function WhatsAppSettingsForm({ initial }: { initial: WhatsAppAdminSettings }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initial.enabled);
  const [storesDefaultOn, setStoresDefaultOn] = useState(initial.storesDefaultOn);
  const [events, setEvents] = useState<string[]>(initial.eventsEnabled);
  const [rates, setRates] = useState<Record<WhatsAppRateCategory, string>>(
    () =>
      Object.fromEntries(WHATSAPP_RATE_CATEGORIES.map((k) => [k, String(initial.metaRateMicros[k])])) as Record<
        WhatsAppRateCategory,
        string
      >,
  );
  const [pending, startTransition] = useTransition();

  const rateValue = (raw: string) => (/^\d{1,7}$/.test(raw.trim()) ? Number(raw.trim()) : NaN);
  const ratesValid = WHATSAPP_RATE_CATEGORIES.every((k) => {
    const v = rateValue(rates[k]);
    return Number.isInteger(v) && v >= 0 && v <= META_RATE_MAX_MICROS;
  });

  const toggleEvent = (event: string, on: boolean) =>
    setEvents((current) => (on ? [...new Set([...current, event])] : current.filter((e) => e !== event)));

  const save = () =>
    startTransition(async () => {
      const result = await updateWhatsAppSettingsAction({
        enabled,
        storesDefaultOn,
        // Free only: charging sellers needs owner approval (docs/whatsapp.md D3).
        sellerPriceUsdCents: 0,
        metaRateMicros: Object.fromEntries(WHATSAPP_RATE_CATEGORIES.map((k) => [k, rateValue(rates[k])])),
        eventsEnabled: events,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
        <div className="space-y-1">
          <Label htmlFor="wa-enabled">WhatsApp is on</Label>
          <p className="text-sm text-muted-foreground">
            Off: nothing is sent to any shopper. On: messages go only to stores with WhatsApp on and shoppers who opted in at
            checkout. Tallaby pays Meta for every message. It can be turned on only once the backend reports every WhatsApp
            env value as set.
          </p>
        </div>
        <Switch id="wa-enabled" checked={enabled} onCheckedChange={setEnabled} />
      </div>

      <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
        <div className="space-y-1">
          <Label htmlFor="wa-default">On by default for stores</Label>
          <p className="text-sm text-muted-foreground">For stores whose seller never changed their WhatsApp setting.</p>
        </div>
        <Switch id="wa-default" checked={storesDefaultOn} onCheckedChange={setStoresDefaultOn} />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Events Tallaby may send</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {WHATSAPP_EVENTS.map((event) => (
            <label key={event} className="flex items-center gap-2 text-sm">
              <Checkbox checked={events.includes(event)} onCheckedChange={(v) => toggleEvent(event, v === true)} />
              {EVENT_LABELS[event] ?? event}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="wa-price">Seller price per message</Label>
        <Input id="wa-price" value="Free" disabled className="max-w-40" />
        <p className="text-xs text-muted-foreground">Charging sellers needs owner approval.</p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Meta rates per message (micro-USD)</legend>
        <div className="grid gap-4 sm:grid-cols-4">
          {WHATSAPP_RATE_CATEGORIES.map((key) => {
            const v = rateValue(rates[key]);
            const ok = Number.isInteger(v) && v >= 0 && v <= META_RATE_MAX_MICROS;
            return (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={`wa-rate-${key}`}>{RATE_LABELS[key]}</Label>
                <Input
                  id={`wa-rate-${key}`}
                  inputMode="numeric"
                  value={rates[key]}
                  aria-invalid={!ok}
                  onChange={(e) => setRates((r) => ({ ...r, [key]: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground tabular-nums">{ok ? formatMicrosUsd(v) : "0 to 1,000,000"}</p>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Used to price each paid message when Meta reports it. Check them against Meta&apos;s rate card for Egypt.
        </p>
      </fieldset>

      <Button onClick={save} disabled={pending || !ratesValid}>
        {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
        Save settings
      </Button>
    </div>
  );
}

// ── Templates ────────────────────────────────────────────────────────────

/** "Submit to Meta" and "Sync statuses": both run in the backend, which holds the token. */
export function TemplateActions() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState<"submit" | "sync" | null>(null);
  const run = (kind: "submit" | "sync") =>
    startTransition(async () => {
      setRunning(kind);
      const result = kind === "submit" ? await submitWhatsAppTemplatesAction() : await syncWhatsAppTemplatesAction();
      setRunning(null);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => run("submit")} disabled={pending}>
        {running === "submit" && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
        Submit to Meta
      </Button>
      <Button variant="outline" onClick={() => run("sync")} disabled={pending}>
        {running === "sync" && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
        Sync statuses
      </Button>
    </div>
  );
}

export function TemplatePreviewButton({ name, language, preview }: { name: string; language: string; preview: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">
            {name} · {language}
          </DialogTitle>
          <DialogDescription>With Meta&apos;s review sample values.</DialogDescription>
        </DialogHeader>
        <pre
          dir={language === "ar" ? "rtl" : "ltr"}
          className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 font-sans text-sm"
        >
          {preview}
        </pre>
      </DialogContent>
    </Dialog>
  );
}

// ── Failed messages ──────────────────────────────────────────────────────

/** Failed and unknown messages with Retry per row and Retry selected; unknown rows ask first (possible duplicate). */
export function FailedMessagesTable({ rows }: { rows: WhatsAppFailedMessage[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<string[] | null>(null);
  const [pending, startTransition] = useTransition();
  const statusById = new Map(rows.map((r) => [r.id, r.status]));

  const send = (ids: string[], confirmUnknown: boolean) =>
    startTransition(async () => {
      const result = await retryWhatsAppMessagesAction({ ids, confirmUnknown });
      setConfirm(null);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      setSelected(new Set());
      router.refresh();
    });

  const retry = (ids: string[]) => {
    if (ids.length === 0) return;
    if (ids.some((id) => statusById.get(id) === "unknown")) setConfirm(ids);
    else send(ids, false);
  };

  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggle = (id: string, on: boolean) =>
    setSelected((s) => {
      const next = new Set(s);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{selected.size} selected</p>
        <Button size="sm" onClick={() => retry([...selected])} disabled={pending || selected.size === 0}>
          {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          Retry selected
        </Button>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  aria-label="Select all"
                  checked={allChecked}
                  onCheckedChange={(v) => setSelected(v === true ? new Set(rows.map((r) => r.id)) : new Set())}
                />
              </TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Checkbox
                    aria-label="Select message"
                    checked={selected.has(row.id)}
                    onCheckedChange={(v) => toggle(row.id, v === true)}
                  />
                </TableCell>
                <TableCell className="max-w-72">
                  <div className="flex items-center gap-2">
                    <Badge variant={row.status === "unknown" ? "outline" : "destructive"}>
                      {row.status === "unknown" ? "Unknown" : "Failed"}
                    </Badge>
                    {row.errorCode !== null && <span className="font-mono text-xs">{row.errorCode}</span>}
                  </div>
                  {row.errorTitle && <p className="mt-1 truncate text-xs text-muted-foreground">{row.errorTitle}</p>}
                </TableCell>
                <TableCell>{row.storeName ?? "—"}</TableCell>
                <TableCell>{EVENT_LABELS[row.event] ?? row.event}</TableCell>
                <TableCell className="font-mono text-xs" dir="ltr">
                  {row.maskedPhone || "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs">{cairoTime(row.failedAt ?? row.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" disabled={pending} onClick={() => retry([row.id])}>
                    Retry
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retry messages with an unknown result?</AlertDialogTitle>
            <AlertDialogDescription>
              Meta may already have delivered some of these. Retrying can send the shopper the same message twice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={() => confirm && send(confirm, true)}>
              Retry anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
