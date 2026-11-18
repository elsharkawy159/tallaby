"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
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

type ActionResult = { success: true; message: string } | { success: false; error: string };

const TABS = [
  { href: "/tallaby-pay", label: "Overview", exact: true },
  { href: "/tallaby-pay/sales", label: "Sales" },
  { href: "/tallaby-pay/payouts", label: "Withdrawals", count: "payouts" },
  { href: "/tallaby-pay/refunds", label: "Refunds", count: "refunds" },
  { href: "/tallaby-pay/kyc", label: "Identity checks", count: "kyc" },
  { href: "/tallaby-pay/wallets", label: "Wallets" },
  { href: "/tallaby-pay/settings", label: "Settings" },
] as const;

/** The section's tabs, with the open-work counts next to the queues. */
export function TallabyPayTabs({ counts }: { counts: { payouts: number; refunds: number; kyc: number } }) {
  const pathname = usePathname();
  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto border-b px-1" aria-label="Tallaby Pay sections">
      {TABS.map((tab) => {
        const active = "exact" in tab ? pathname === tab.href : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const count = "count" in tab ? counts[tab.count] : 0;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm",
              active ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {count > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-xs leading-5 text-primary-foreground tabular-nums">{count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export type DialogField = {
  name: string;
  label: string;
  multiline?: boolean;
  optional?: boolean;
  /** Characters needed before the confirm button turns on (default 3, 0 when optional). */
  min?: number;
  placeholder?: string;
  inputMode?: "decimal" | "text";
};

/**
 * A button that opens a dialog with a few text fields, runs one server action
 * and refreshes the page. Every money action in this section uses it.
 */
export function ActionButton({
  label,
  variant = "outline",
  size = "sm",
  title,
  description,
  fields,
  confirm,
  destructive,
  run,
  disabled,
}: {
  label: ReactNode;
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost";
  size?: "sm" | "default";
  title: string;
  description: ReactNode;
  fields: DialogField[];
  confirm: string;
  destructive?: boolean;
  run: (values: Record<string, string>) => Promise<ActionResult>;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const ready = fields.every((f) => (values[f.name] ?? "").trim().length >= (f.min ?? (f.optional ? 0 : 3)));

  const submit = () =>
    startTransition(async () => {
      const trimmed = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()]));
      const result = await run(trimmed);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      setValues({});
      setOpen(false);
      router.refresh();
    });

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)} disabled={disabled}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription asChild>
              <div>{description}</div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {fields.map((f) => {
              const id = `tp-field-${f.name}`;
              return (
                <div key={f.name} className="space-y-1.5">
                  <Label htmlFor={id}>
                    {f.label}
                    {f.optional && <span className="text-muted-foreground"> (optional)</span>}
                  </Label>
                  {f.multiline ? (
                    <Textarea
                      id={id}
                      rows={3}
                      maxLength={500}
                      placeholder={f.placeholder}
                      value={values[f.name] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    />
                  ) : (
                    <Input
                      id={id}
                      maxLength={120}
                      inputMode={f.inputMode}
                      placeholder={f.placeholder}
                      value={values[f.name] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant={destructive ? "destructive" : "default"} onClick={submit} disabled={pending || !ready}>
              {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
              {confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
