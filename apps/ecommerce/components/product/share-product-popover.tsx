"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SimpleIcon } from "simple-icons";
import {
  siFacebook,
  siInstagram,
  siPinterest,
  siTelegram,
  siWhatsapp,
  siX,
} from "simple-icons";
import { Check, Copy, Mail, MoreHorizontal, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import posthog from "posthog-js";
import { Button } from "@workspace/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { cn } from "@/lib/utils";
import {
  buildProductShareUrl,
  buildProductShareUrlFromPath,
} from "@/lib/affiliate-coupon.lib";
import { buildPinterestAdDescription } from "@/lib/pinterest-ad-share.lib";

interface ShareProductPopoverProps {
  /** Product title, used for the share text and the popover subtitle. */
  title: string;
  /** Absolute image URL — Pinterest requires one to create a pin. */
  image?: string;
  /**
   * Absolute URL to share. Defaults to the current page (origin + pathname),
   * resolved after mount so the markup stays prerenderable.
   */
  url?: string;
  /** Product description — used for Pinterest ad copy when bullets are absent. */
  description?: string | null;
  /** Product bullet points — preferred body copy for Pinterest ad pins. */
  bulletPoints?: string[];
  /**
   * Active affiliate coupon for the signed-in sharer. When set, appended as
   * `?coupon=` on the share URL. Never accept another user's code here.
   */
  coupon?: string | null;
  /**
   * False while auth/affiliate status is still loading so we do not briefly
   * share a non-affiliate URL and then swap it.
   */
  isUrlReady?: boolean;
  productId?: string;
  className?: string;
}

function BrandIcon({
  icon,
  className,
}: {
  icon: SimpleIcon;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d={icon.path} fill="currentColor" />
    </svg>
  );
}

type ShareChannel = {
  /** Stable key — also the value reported to analytics. */
  id: string;
  label: string;
  /** Chip colours. Brand hexes come from simple-icons. */
  className: string;
  render: (className: string) => React.ReactNode;
  /** Absent for channels handled in code (Instagram, native sheet). */
  href?: string;
  onClick?: () => void;
};

export const ShareProductPopover = ({
  title,
  image,
  url,
  description,
  bulletPoints,
  coupon = null,
  isUrlReady = true,
  productId,
  className,
}: ShareProductPopoverProps) => {
  const t = useTranslations("product.share");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState("");
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (!isUrlReady) {
      setResolvedUrl("");
      return;
    }

    if (url) {
      try {
        const parsed = new URL(url);
        parsed.search = "";
        parsed.hash = "";
        setResolvedUrl(buildProductShareUrl(parsed.toString(), coupon));
      } catch {
        setResolvedUrl(url);
      }
      return;
    }

    if (typeof window !== "undefined") {
      setResolvedUrl(
        buildProductShareUrlFromPath({
          origin: window.location.origin,
          pathname: window.location.pathname,
          coupon,
        })
      );
    }
  }, [url, coupon, isUrlReady]);

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
  }, []);

  const shareText = useMemo(() => t("shareText", { title }), [t, title]);

  const pinterestText = useMemo(
    () =>
      buildPinterestAdDescription({
        adTitle: t("pinterestAdTitle", { title }),
        bulletPoints,
        description,
        productUrl: resolvedUrl,
      }),
    [bulletPoints, description, resolvedUrl, t, title]
  );

  const track = useCallback(
    (channel: string) => {
      posthog.capture("product_shared", {
        product_id: productId,
        channel,
      });
    },
    [productId]
  );

  const copyLink = useCallback(
    async (channel: string, message?: string) => {
      if (!resolvedUrl) return false;
      try {
        await navigator.clipboard.writeText(resolvedUrl);
        track(channel);
        setCopied(true);
        toast.success(message ?? t("linkCopied"));
        window.setTimeout(() => setCopied(false), 1800);
        return true;
      } catch {
        toast.error(t("copyFailed"));
        return false;
      }
    },
    [resolvedUrl, t, track]
  );

  const nativeShare = useCallback(
    async (channel: string) => {
      try {
        await navigator.share({ title, text: shareText, url: resolvedUrl });
        track(channel);
        setOpen(false);
      } catch {
        // The user dismissed the share sheet — not an error.
      }
    },
    [resolvedUrl, shareText, title, track]
  );

  const channels = useMemo<ShareChannel[]>(() => {
    const encodedUrl = encodeURIComponent(resolvedUrl);
    const encodedText = encodeURIComponent(shareText);
    const encodedPinterestText = encodeURIComponent(pinterestText);

    const list: ShareChannel[] = [
      {
        id: "whatsapp",
        label: "WhatsApp",
        className: "bg-[#25D366]",
        render: (c) => <BrandIcon icon={siWhatsapp} className={c} />,
        href: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
      },
      {
        id: "facebook",
        label: "Facebook",
        className: "bg-[#0866FF]",
        render: (c) => <BrandIcon icon={siFacebook} className={c} />,
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      },
      {
        id: "x",
        label: "X",
        className: "bg-black",
        render: (c) => <BrandIcon icon={siX} className={c} />,
        href: `https://x.com/intent/post?url=${encodedUrl}&text=${encodedText}`,
      },
      {
        id: "pinterest",
        label: "Pinterest",
        className: "bg-[#BD081C]",
        render: (c) => <BrandIcon icon={siPinterest} className={c} />,
        href: `https://www.pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedPinterestText}${
          image ? `&media=${encodeURIComponent(image)}` : ""
        }`,
      },
      {
        id: "telegram",
        label: "Telegram",
        className: "bg-[#26A5E4]",
        render: (c) => <BrandIcon icon={siTelegram} className={c} />,
        href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      },
      {
        id: "instagram",
        label: "Instagram",
        className:
          "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]",
        render: (c) => <BrandIcon icon={siInstagram} className={c} />,
        // Instagram has no web share endpoint: hand off to the native sheet
        // where the app can be picked, otherwise copy the link to paste.
        onClick: () => {
          if (canNativeShare) {
            void nativeShare("instagram");
            return;
          }
          void copyLink("instagram", t("instagramHint"));
        },
      },
      {
        id: "email",
        label: t("email"),
        className: "bg-gray-600",
        render: (c) => <Mail className={c} strokeWidth={2.2} />,
        href: `mailto:?subject=${encodedText}&body=${encodedText}%0A%0A${encodedUrl}`,
      },
    ];

    if (canNativeShare) {
      list.push({
        id: "native",
        label: t("more"),
        className: "bg-gray-100 text-gray-700",
        render: (c) => <MoreHorizontal className={c} strokeWidth={2.2} />,
        onClick: () => void nativeShare("native"),
      });
    }

    return list;
  }, [
    canNativeShare,
    copyLink,
    image,
    nativeShare,
    pinterestText,
    resolvedUrl,
    shareText,
    t,
  ]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("share")}
          title={t("share")}
          disabled={!isUrlReady}
          aria-busy={!isUrlReady}
          className={cn(
            "flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm ring-1 ring-black/5 backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 md:size-10",
            open && "bg-white text-primary",
            !isUrlReady && "pointer-events-none opacity-70",
            className
          )}
        >
          <Share2 className="size-4 md:size-[18px]" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[19.5rem] overflow-hidden rounded-2xl border-gray-200 p-0 shadow-xl"
      >
        <div className="px-4 pb-3 pt-3.5">
          <p className="text-sm font-semibold text-gray-900">
            {t("shareTitle")}
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-500">{title}</p>
        </div>

        <div className="grid grid-cols-4 gap-1 px-2 pb-3">
          {channels.map((channel) => {
            const content = (
              <>
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full text-white shadow-sm transition-transform duration-200 group-hover:scale-110",
                    channel.className
                  )}
                >
                  {channel.render("size-[18px]")}
                </span>
                <span className="w-full truncate text-center text-[11px] font-medium leading-tight text-gray-600">
                  {channel.label}
                </span>
              </>
            );

            const itemClassName =
              "group flex cursor-pointer flex-col items-center gap-1.5 rounded-xl px-1 py-2 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

            if (channel.href) {
              return (
                <a
                  key={channel.id}
                  href={channel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={channel.label}
                  onClick={() => {
                    track(channel.id);
                    setOpen(false);
                  }}
                  className={itemClassName}
                >
                  {content}
                </a>
              );
            }

            return (
              <button
                key={channel.id}
                type="button"
                aria-label={channel.label}
                onClick={channel.onClick}
                className={itemClassName}
              >
                {content}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50/70 p-2.5">
          <span
            dir="ltr"
            className="min-w-0 flex-1 truncate rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-start text-xs text-gray-600"
          >
            {resolvedUrl}
          </span>
          <Button
            type="button"
            size="sm"
            variant={copied ? "secondary" : "outline"}
            onClick={() => void copyLink("copy_link")}
            className="shrink-0"
          >
            {copied ? (
              <Check data-icon="inline-start" />
            ) : (
              <Copy data-icon="inline-start" />
            )}
            {copied ? t("copied") : t("copyLink")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
