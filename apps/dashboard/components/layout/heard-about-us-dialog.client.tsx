"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Ellipsis, Facebook, Instagram, Music2, Search, Users, Youtube, type LucideIcon } from "lucide-react";
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
import { cn } from "@workspace/ui/lib/utils";
import {
  HEARD_ABOUT_US_OTHER_MAX,
  HEARD_ABOUT_US_SOURCES,
  type HeardAboutUsSource,
} from "@workspace/lib/sellers";
import { saveHeardAboutUs } from "./heard-about-us.server";

/** Per browser session: "Later" hides the pop-up until the next session. */
const DISMISSED_KEY = "tallaby:heard-about-us-dialog";

const ICONS: Record<HeardAboutUsSource, LucideIcon> = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  tiktok: Music2,
  google: Search,
  friend: Users,
  other: Ellipsis,
};

/**
 * Asks a seller once where they heard about Tallaby (sellers.heard_about_us,
 * 0099). Shown until answered; "Later" snoozes it for the browser session.
 */
export function HeardAboutUsDialog({ show }: { show: boolean }) {
  const t = useTranslations("heardAboutUsDialog");
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<HeardAboutUsSource | null>(null);
  const [other, setOther] = useState("");
  const [isSaving, startSaving] = useTransition();

  useEffect(() => {
    if (!show) return;
    try {
      if (window.sessionStorage.getItem(DISMISSED_KEY)) return;
    } catch {
      // Storage blocked: still ask, just not remembered.
    }
    setOpen(true);
  }, [show]);

  const snooze = () => {
    setOpen(false);
    try {
      window.sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Storage blocked: it may show again on the next page load.
    }
  };

  const onOpenChange = (next: boolean) => {
    if (next) setOpen(true);
    else if (!isSaving) snooze();
  };

  const save = () => {
    if (!source) return;
    startSaving(async () => {
      const result = await saveHeardAboutUs({ source, other: source === "other" ? other : null });
      if (result.success) {
        setOpen(false);
        toast.success(t("saved"));
      } else {
        toast.error(t("error"));
      }
    });
  };

  if (!show) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div role="group" aria-label={t("title")} className="flex flex-wrap gap-2">
          {HEARD_ABOUT_US_SOURCES.map((value) => {
            const Icon = ICONS[value];
            const selected = source === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => setSource(value)}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors outline-none",
                  "focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-muted",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {t(`sources.${value}`)}
              </button>
            );
          })}
        </div>

        {source === "other" && (
          <Input
            autoFocus
            value={other}
            maxLength={HEARD_ABOUT_US_OTHER_MAX}
            onChange={(event) => setOther(event.target.value)}
            placeholder={t("otherPlaceholder")}
            aria-label={t("otherPlaceholder")}
          />
        )}

        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={snooze} disabled={isSaving}>
            {t("later")}
          </Button>
          <Button type="button" onClick={save} disabled={!source || isSaving}>
            {isSaving ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
