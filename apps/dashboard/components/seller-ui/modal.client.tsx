"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { cn } from "@/lib/utils";

/**
 * The design's modal (`.mod`/`.mbox`). A bottom sheet at 480px and below, like
 * every dialog in the (main) layout (globals.css).
 * `<Modal open={open} onOpenChange={setOpen} title="…" footer={<>…</>}>…</Modal>`
 */
export function Modal({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  footer,
  width = 480,
  className,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Optional opener; omit when you control `open` yourself. */
  trigger?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Buttons; they share the width equally. */
  footer?: React.ReactNode;
  /** Max width from 481px up. */
  width?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const t = useTranslations("common");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        closeLabel={t("close")}
        style={{ maxWidth: width }}
        className={cn("flex flex-col gap-4 p-6 max-[720px]:p-[18px]", className)}
      >
        <div className="pe-8">
          <DialogTitle className="text-lg font-bold leading-normal text-(--s-ink)">{title}</DialogTitle>
          {/* Radix warns about a dialog with no description unless one is present or explicitly absent. */}
          {description ? (
            <DialogDescription className="mt-0.5 text-[13px] text-(--s-muted)">{description}</DialogDescription>
          ) : (
            <DialogDescription className="sr-only">{title}</DialogDescription>
          )}
        </div>
        {children}
        {footer && <div className="flex gap-2 [&>*]:flex-1">{footer}</div>}
      </DialogContent>
    </Dialog>
  );
}
