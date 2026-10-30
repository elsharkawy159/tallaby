"use client";

import { useEffect, useState } from "react";
import { Check, Link2, Printer, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";

/**
 * The shared catalog's tools (ROADMAP.md F-11c): print / Save as PDF, and
 * share the page on WhatsApp (the phone's share sheet when there is one).
 * Hidden when printing.
 */
export function CatalogShareTools({ autoPrint, shareText }: { autoPrint: boolean; shareText: string }) {
  const t = useTranslations("catalogShare");
  const [copied, setCopied] = useState(false);

  // ?print=1 (the dashboard's "PDF" link): print once the photos have loaded.
  useEffect(() => {
    if (!autoPrint) return;
    let cancelled = false;
    const images = Array.from(document.querySelectorAll<HTMLImageElement>("#catalog-share img"));
    const loaded = Promise.all(
      images.map((img) => (img.complete ? Promise.resolve() : new Promise<void>((done) => {
        img.addEventListener("load", () => done(), { once: true });
        img.addEventListener("error", () => done(), { once: true });
      }))),
    );
    const timeout = new Promise<void>((done) => setTimeout(done, 8000));
    void Promise.race([loaded, timeout]).then(() => {
      if (!cancelled) window.print();
    });
    return () => {
      cancelled = true;
    };
  }, [autoPrint]);

  const pageUrl = () => window.location.href.replace(/[?&]print=1\b/, "");

  const share = async () => {
    const url = pageUrl();
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text: shareText, url });
        return;
      } catch {
        // Cancelled or refused: fall back to WhatsApp.
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${url}`)}`, "_blank", "noopener,noreferrer");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="catalog-noprint flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => window.print()}>
        <Printer className="size-4" />
        {t("print")}
      </Button>
      <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={share}>
        <Share2 className="size-4" />
        {t("share")}
      </Button>
      <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={copy}>
        {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
        {copied ? t("copied") : t("copyLink")}
      </Button>
    </div>
  );
}
