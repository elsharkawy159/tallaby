"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  CircleCheck,
  ClipboardList,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Facebook,
  FileText,
  Files,
  Globe,
  Images,
  Instagram,
  LayoutTemplate,
  Link2,
  LoaderCircle,
  Lock,
  MessageCircle,
  Monitor,
  Newspaper,
  Palette,
  Pencil,
  RotateCcw,
  Share2,
  Smartphone,
  Undo2,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { IconButton, IconTile, Note, PageHeader, Segmented, SellerButton, SellerCard, StatusBadge, Tag, Toggle } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { discardDraft, publish, restoreRevision, unpublish } from "@/app/(builder)/stores/[storeId]/editor/server/editor.server";
import { useStorePreview } from "@/app/(builder)/stores/[storeId]/editor/use-store-preview.client";
import { PublishCelebration, type LiveSite } from "@/app/(main)/_components/publish-celebration.client";
import type { WebsiteOverviewData } from "./website.types";

type ManageLink = { key: string; path: string; icon: LucideIcon };

/** The other Website pages (PLAN.md §7.2), grouped as in the design. */
const LINK_GROUPS: { group: "look" | "reach"; links: ManageLink[] }[] = [
  {
    group: "look",
    links: [
      { key: "design", path: "website/design", icon: Palette },
      { key: "templates", path: "website/templates", icon: LayoutTemplate },
      { key: "pages", path: "website/pages", icon: Files },
      { key: "media", path: "website/media", icon: Images },
    ],
  },
  {
    group: "reach",
    links: [
      { key: "domain", path: "website/domain", icon: Globe },
      { key: "social", path: "website/social", icon: Share2 },
      { key: "blog", path: "website/blog", icon: Newspaper },
      { key: "forms", path: "website/forms", icon: ClipboardList },
    ],
  },
];

/** Versions shown before "Show all". */
const REVISIONS_SHOWN = 5;

/** What the seller should do next: pick a template, go live, or publish their changes. */
type NextStep = "template" | "goLive" | "changes";

/**
 * Website › Overview (PLAN.md P4-12; Claude Design "Seller Website" v3):
 * address, publish state and the next step, the store as shoppers see it, links
 * to the other Website pages and the version history. Going live only ever
 * happens through the Publish action here. Every button calls the store-scoped
 * editor actions, which re-check the store.
 */
export function WebsiteOverview({ data }: { data: WebsiteOverviewData }) {
  const t = useTranslations("websiteOverview");
  const te = useTranslations("storeEditor");
  const ts = useTranslations("storeSettings");
  const tw = useTranslations("sellerWebsite.overview");
  const tl = useTranslations("settings.storeLink");
  const format = useFormatter();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [celebrate, setCelebrate] = useState<LiveSite | null>(null);
  const preview = useStorePreview(data.storeId);
  const base = `/stores/${data.storeId}`;
  const date = (iso: string) => format.dateTime(new Date(iso), { dateStyle: "medium", timeStyle: "short" });

  /** Runs an editor action, shows its error, refreshes the server data. `done` is a toast, or a callback in its place. */
  const run = (
    key: string,
    action: () => Promise<{ success: true } | { success: false; error: string }>,
    done: string | (() => void),
    onFail?: () => void,
  ) => {
    setBusy(key);
    startTransition(async () => {
      try {
        const result = await action();
        if (result.success) {
          if (typeof done === "string") toast.success(done);
          else done();
          router.refresh();
        } else {
          onFail?.();
          if (result.error === "templateNotChosen")
            toast.error(te("errors.templateNotChosen"), {
              action: { label: t("chooseTemplate"), onClick: () => router.push(`${base}/website/templates`) },
            });
          else toast.error(te(`errors.${result.error}` as "errors.generic"));
        }
      } catch {
        onFail?.();
        toast.error(te("errors.generic"));
      } finally {
        setBusy(null);
      }
    });
  };

  const copy = async (message = t("copied")) => {
    try {
      await navigator.clipboard.writeText(data.liveUrl);
      toast.success(message);
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const working = pending || busy !== null;

  // "Website visibility" switch: optimistic until the refreshed server data
  // arrives (a new `data.isLive` drops it), reverted when the action fails.
  const [optimistic, setOptimistic] = useState<{ value: boolean; base: boolean } | null>(null);
  const [confirmOffline, setConfirmOffline] = useState(false);
  const live = optimistic && optimistic.base === data.isLive ? optimistic.value : data.isLive;
  const goLive = () => {
    setOptimistic({ value: true, base: data.isLive });
    // Going live is the milestone: the celebration pop-up instead of a toast.
    run("publish", () => publish(data.storeId), () => setCelebrate({ url: data.liveUrl, hostname: data.hostname }), () => setOptimistic(null));
  };
  const goOffline = () => {
    setOptimistic({ value: false, base: data.isLive });
    run("unpublish", () => unpublish(data.storeId), t("unpublishedToast"), () => setOptimistic(null));
  };
  const publishChanges = () => run("publish", () => publish(data.storeId), t("publishedToast"));
  const discard = () => run("discard", () => discardDraft(data.storeId), t("discardedToast"));

  // Going live needs a template the seller chose (the publish action checks it too).
  const needsTemplate = !live && !data.templateChosen;
  const switchHint = live
    ? "liveSwitchOn"
    : needsTemplate
      ? "liveSwitchNeedsTemplate"
      : data.siteStatus === "unpublished"
        ? "liveSwitchOff"
        : "liveSwitchDraft";

  const next: NextStep | null = data.readOnly
    ? null
    : needsTemplate
      ? "template"
      : !live
        ? "goLive"
        : data.hasUnpublishedChanges
          ? "changes"
          : null;
  const nextTitle =
    next === "template" ? t("needsTemplateTitle") : next === "goLive" ? t("readyTitle") : t("status.changes");
  const nextBody =
    next === "template"
      ? t("liveSwitchNeedsTemplate")
      : next === "goLive"
        ? t(data.siteStatus === "unpublished" ? "statusHint.unpublished" : "statusHint.draft")
        : t("statusHint.changes");

  const revisions = showAll ? data.revisions : data.revisions.slice(0, REVISIONS_SHOWN);
  const shareText = encodeURIComponent(data.liveUrl);
  const shareClass =
    "grid size-[34px] place-items-center rounded-full bg-(--s-fill) text-(--s-muted) transition-colors duration-150 hover:bg-(--s-hover) hover:text-(--s-ink) max-[600px]:size-10 [&_svg]:size-4";

  return (
    <>
      <PageHeader title={t("heading")} description={t("description")} className="sui-rise" />

      <SellerCard
        aria-label={tw("statusLabel")}
        className="sui-rise grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] overflow-hidden rounded-[28px] [animation-delay:.05s] max-[1180px]:grid-cols-1"
      >
        <div className="flex min-w-0 flex-col gap-[18px] px-7 py-[26px] max-[720px]:px-[18px] max-[720px]:py-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={live ? "success" : "muted"} className="h-7 px-3 text-[12.5px] font-bold">
              {live ? t("liveSwitchOnline") : t(data.siteStatus === "unpublished" ? "status.unpublished" : "status.draft")}
            </StatusBadge>
            {live && data.hasUnpublishedChanges && (
              <StatusBadge tone="warning" className="h-7 px-3 text-[12.5px] font-bold">
                {t("status.changes")}
              </StatusBadge>
            )}
            {data.readOnly && <Tag>{ts("readOnlyBadge")}</Tag>}
          </div>

          <div className="flex flex-col gap-1.5">
            <small className="text-[12.5px] text-(--s-subtle)">{t("liveUrl")}</small>
            <div className="flex min-w-0 items-center gap-1.5">
              <a
                href={`/api/stores/${data.storeId}/view`}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className="min-w-0 truncate font-montserrat text-[clamp(17px,1.8vw,22px)] font-bold leading-[1.3] text-(--s-ink) no-underline hover:text-(--s-link) max-[600px]:py-2.5"
              >
                {data.hostname}
              </a>
              <IconButton aria-label={t("copy")} title={t("copy")} onClick={() => void copy()}>
                <Copy aria-hidden />
              </IconButton>
              <IconButton asChild aria-label={t("open")} title={t("open")}>
                <a href={`/api/stores/${data.storeId}/view`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink aria-hidden className="rtl:-scale-x-100" />
                </a>
              </IconButton>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-(--s-subtle) [&_svg]:size-[15px] [&_svg]:shrink-0">
              <span className="inline-flex items-center gap-1.5">
                <Clock aria-hidden />
                {t("lastPublished")}: {data.lastPublishedAt ? date(data.lastPublishedAt) : t("never")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FileText aria-hidden />
                {t("pageCount", { count: data.pageCount })}
              </span>
              {data.defaultHostname !== data.hostname ? (
                <span className="inline-flex items-center gap-1.5">
                  <Link2 aria-hidden />
                  <bdi dir="ltr" className="font-montserrat">
                    {data.defaultHostname}
                  </bdi>
                </span>
              ) : (
                <Link href={`${base}/website/domain#custom-domain`} className="inline-flex items-center gap-1.5 font-semibold text-(--s-link) no-underline hover:underline max-[600px]:min-h-10">
                  <Globe aria-hidden />
                  {tw("connectDomain")}
                </Link>
              )}
            </div>
          </div>

          {next ? (
            <div className="flex flex-wrap items-center gap-3.5 rounded-[20px] border border-accent/30 bg-accent-soft px-4 py-3.5">
              <IconTile icon={next === "template" ? LayoutTemplate : UploadCloud} tone="accent" className="bg-(--s-surface)" />
              <div className="min-w-[180px] flex-1">
                <b className="block text-sm font-bold text-(--s-ink)">{nextTitle}</b>
                <small className="block text-pretty text-[12.5px] leading-[1.6] text-(--s-muted)">{nextBody}</small>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 max-[480px]:w-full max-[480px]:[&>*]:basis-full">
                {next === "template" ? (
                  <SellerButton asChild size="sm" className="publish-attention">
                    <Link href={`${base}/website/templates`}>
                      <LayoutTemplate aria-hidden />
                      {t("chooseTemplate")}
                    </Link>
                  </SellerButton>
                ) : (
                  <>
                    {next === "changes" && (
                      <ConfirmAction
                        trigger={
                          <SellerButton variant="mini" size="sm" disabled={working}>
                            {busy === "discard" ? <LoaderCircle className="animate-spin" aria-hidden /> : <Undo2 aria-hidden />}
                            {t("discard")}
                          </SellerButton>
                        }
                        icon={Undo2}
                        title={t("discardTitle")}
                        description={t("discardBody")}
                        confirm={t("discard")}
                        destructive
                        onConfirm={discard}
                      />
                    )}
                    <SellerButton
                      size="sm"
                      // Soft ring and sheen (globals.css `publish-attention`) so the next step is hard to miss.
                      className={cn(!working && "publish-attention")}
                      disabled={working}
                      onClick={next === "goLive" ? goLive : publishChanges}
                    >
                      {busy === "publish" ? <LoaderCircle className="animate-spin" aria-hidden /> : <UploadCloud aria-hidden />}
                      {next === "goLive" ? t("publish") : t("publishChanges")}
                    </SellerButton>
                  </>
                )}
              </div>
            </div>
          ) : live && !data.readOnly ? (
            <Note tone="success" icon={CircleCheck}>
              {t("statusHint.published")}
            </Note>
          ) : null}

          <div className="flex flex-wrap gap-2 max-[720px]:[&>*]:flex-1">
            <SellerButton asChild variant="solid" className="h-[46px]">
              <Link href={`${base}/editor`}>
                <Pencil aria-hidden />
                {t("edit")}
              </Link>
            </SellerButton>
            <SellerButton
              variant="outline"
              className="h-[46px]"
              onClick={preview.open}
              disabled={!data.previewEnabled || preview.opening || data.readOnly}
              title={data.previewEnabled ? undefined : t("previewUnavailable")}
            >
              {preview.opening ? <LoaderCircle className="animate-spin" aria-hidden /> : <Eye aria-hidden />}
              {t("preview")}
            </SellerButton>
          </div>

          <div className="mt-auto flex flex-col gap-3 border-t border-(--s-line-soft) pt-4">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p id="website-live-label" className="text-[13.5px] font-bold text-(--s-text)">
                  {t("visibility")}
                </p>
                <p id="website-live-hint" className="text-pretty text-[12.5px] text-(--s-subtle)">
                  {t(switchHint)}
                </p>
              </div>
              {(busy === "publish" || busy === "unpublish") && <LoaderCircle className="size-4 animate-spin text-(--s-subtle)" aria-hidden />}
              <Toggle
                aria-labelledby="website-live-label"
                aria-describedby="website-live-hint"
                checked={live}
                disabled={data.readOnly || working || needsTemplate}
                onCheckedChange={(checked) => (checked ? goLive() : setConfirmOffline(true))}
              />
              <ConfirmAction
                open={confirmOffline}
                onOpenChange={setConfirmOffline}
                icon={EyeOff}
                title={t("unpublishTitle")}
                description={t("unpublishBody")}
                confirm={t("unpublish")}
                destructive
                onConfirm={goOffline}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2.5 text-[12.5px] text-(--s-subtle)">
              <span>{tw("share")}</span>
              <div className="flex gap-1.5">
                <a className={shareClass} href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener noreferrer" aria-label={tl("whatsapp")}>
                  <MessageCircle aria-hidden />
                </a>
                <a className={shareClass} href={`https://www.facebook.com/sharer/sharer.php?u=${shareText}`} target="_blank" rel="noopener noreferrer" aria-label={tl("facebook")}>
                  <Facebook aria-hidden />
                </a>
                {/* Instagram has no share URL: copy the link for the seller's bio or story. */}
                <button type="button" className={cn(shareClass, "cursor-pointer")} onClick={() => void copy(tl("instagramCopied"))} aria-label={tl("instagram")}>
                  <Instagram aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 border-s border-(--s-line) bg-linear-[160deg,var(--s-fill),var(--s-surface-2)] px-[22px] pt-5 max-[1180px]:border-s-0 max-[1180px]:border-t max-[720px]:px-3.5 max-[720px]:pt-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <b className="text-[13px] font-bold text-(--s-text)">{t("thumbnail")}</b>
            <Segmented
              label={tw("deviceLabel")}
              value={device}
              onChange={setDevice}
              options={[
                { value: "desktop", label: <DeviceLabel icon={Monitor} text={tw("deviceDesktop")} /> },
                { value: "mobile", label: <DeviceLabel icon={Smartphone} text={tw("deviceMobile")} /> },
              ]}
            />
          </div>
          <LiveFrame url={data.liveUrl} hostname={data.hostname} device={device} title={t("thumbnail")} />
        </div>
      </SellerCard>

      <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] items-start gap-4 max-[1180px]:grid-cols-1">
        <SellerCard aria-labelledby="website-links" className="sui-rise flex flex-col gap-[18px] px-6 pb-6 pt-[22px] [animation-delay:.1s] max-[720px]:px-4 max-[720px]:pb-5 max-[720px]:pt-[18px]">
          <h2 id="website-links" className="text-[17px] font-bold text-(--s-ink)">
            {t("manage")}
          </h2>
          {LINK_GROUPS.map(({ group, links }) => (
            <div key={group} className="flex flex-col gap-2.5">
              <small className="text-xs font-bold text-(--s-faint)">{tw(`groups.${group}`)}</small>
              <div className="grid grid-cols-2 gap-2.5 max-[720px]:grid-cols-1">
                {links.map(({ key, path, icon }) => (
                  <Link
                    key={key}
                    href={`${base}/${path}`}
                    className="group flex items-center gap-3.5 rounded-[18px] border border-(--s-line) bg-(--s-surface) p-3.5 text-inherit no-underline transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-(--s-outline) hover:shadow-(--s-shadow-hover) motion-reduce:hover:translate-y-0"
                  >
                    <IconTile icon={icon} className="size-11 rounded-[14px] transition-colors duration-200 group-hover:bg-(--s-primary) group-hover:text-(--s-solid-fg) [&_svg]:size-[19px]" />
                    <span className="min-w-0 flex-1">
                      <b className="flex items-center gap-1.5 text-sm font-bold text-(--s-ink)">
                        {t(`links.${key}.title`)}
                        {key === "pages" && (
                          <Tag tone="info" className="font-montserrat tabular-nums">
                            {data.pageCount}
                          </Tag>
                        )}
                      </b>
                      <small className="block text-xs leading-[1.6] text-(--s-subtle)">{key === "pages" ? tw("pagesBody") : t(`links.${key}.body`)}</small>
                    </span>
                    <ChevronLeft aria-hidden className="size-4 shrink-0 text-(--s-field-strong) transition-[color,transform] duration-150 group-hover:text-(--s-primary) ltr:rotate-180" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </SellerCard>

        <SellerCard aria-labelledby="website-revisions" className="sui-rise [animation-delay:.15s]">
          <div className="px-[22px] pt-5 max-[600px]:px-4 max-[600px]:pt-4">
            <h3 id="website-revisions" className="text-[15.5px] font-bold text-(--s-ink)">
              {t("revisions")}
            </h3>
            <p className="mt-0.5 text-pretty text-[12.5px] text-(--s-subtle)">{t("revisionsHint")}</p>
          </div>
          {data.revisions.length === 0 ? (
            <p className="px-[22px] py-5 text-[13px] text-(--s-subtle) max-[600px]:px-4">{t("noRevisions")}</p>
          ) : (
            <ol className="flex flex-col px-4 pb-1.5 pt-3.5">
              {revisions.map((revision, index) => (
                <li key={revision.id} className="group relative grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 rounded-[14px] px-2 py-2.5 transition-colors duration-150 hover:bg-(--s-tint)">
                  {index < revisions.length - 1 && <span aria-hidden className="absolute -bottom-2.5 start-[23px] top-[42px] w-[1.5px] bg-(--s-line)" />}
                  <span
                    aria-hidden
                    className={cn(
                      "relative z-[1] grid size-8 place-items-center rounded-full border-[1.5px] font-montserrat text-[11.5px] font-bold tabular-nums",
                      revision.isLive ? "border-(--s-primary) bg-(--s-primary) text-(--s-solid-fg)" : "border-(--s-field) bg-(--s-surface) text-(--s-muted)",
                    )}
                  >
                    {revision.revisionNumber}
                  </span>
                  <div className="min-w-0">
                    <b className="flex flex-wrap items-center gap-2 text-[13.5px] font-bold text-(--s-text)">
                      {t("version", { number: revision.revisionNumber })}
                      {revision.isLive && <Tag tone="success">{t("live")}</Tag>}
                    </b>
                    <small className="block text-xs text-(--s-subtle)">{date(revision.createdAt)}</small>
                  </div>
                  {!data.readOnly && !revision.isLive && (
                    <ConfirmAction
                      trigger={
                        <SellerButton
                          variant="mini"
                          size="xs"
                          className="transition-opacity group-hover:opacity-100 focus-visible:opacity-100 min-[721px]:[@media(hover:hover)]:opacity-0"
                          disabled={working}
                        >
                          {busy === `restore:${revision.id}` ? <LoaderCircle className="animate-spin" aria-hidden /> : <RotateCcw aria-hidden />}
                          {t("restore")}
                        </SellerButton>
                      }
                      icon={RotateCcw}
                      title={t("restoreTitle", { number: revision.revisionNumber })}
                      description={t("restoreBody")}
                      confirm={t("restore")}
                      onConfirm={() => run(`restore:${revision.id}`, () => restoreRevision(data.storeId, revision.id), t("restoredToast"))}
                    />
                  )}
                </li>
              ))}
            </ol>
          )}
          {data.revisions.length > REVISIONS_SHOWN ? (
            <div className="flex justify-center pb-[18px] pt-1.5">
              <SellerButton variant="mini" size="xs" onClick={() => setShowAll((v) => !v)}>
                {showAll ? <ChevronUp aria-hidden /> : <ChevronDown aria-hidden />}
                {showAll ? t("showLess") : t("showAll", { count: data.revisions.length })}
              </SellerButton>
            </div>
          ) : (
            <div className="h-3" />
          )}
        </SellerCard>
      </div>

      <PublishCelebration live={celebrate} onClose={() => setCelebrate(null)} />
    </>
  );
}

function DeviceLabel({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <span className="grid place-items-center">
      <Icon aria-hidden className="size-[15px]" />
      <span className="sr-only">{text}</span>
    </span>
  );
}

/** Width the live page is drawn at, before it is scaled to fit the frame. */
const FRAME_WIDTH = { desktop: 1280, mobile: 390 } as const;

/**
 * The real storefront in a scaled, inert browser window (scripts off, not
 * clickable), so an offline store shows its real "store unavailable" page.
 */
function LiveFrame({ url, hostname, device, title }: { url: string; hostname: string; device: "desktop" | "mobile"; title: string }) {
  const locale = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scale = size.width ? size.width / FRAME_WIDTH[device] : 0;

  return (
    <div
      aria-hidden
      className={cn(
        "mx-auto flex w-full flex-1 flex-col overflow-hidden rounded-t-[18px] border border-b-0 border-(--s-field) bg-(--s-surface) shadow-[0_-6px_30px_rgb(13_55_67/0.08)] transition-[max-width] duration-[450ms] ease-[cubic-bezier(.2,.7,.2,1)] motion-reduce:transition-none",
        device === "mobile" ? "max-w-[260px]" : "max-w-full",
      )}
    >
      <div dir="ltr" className="flex h-9 shrink-0 items-center gap-2 border-b border-(--s-line-soft) bg-(--s-surface-2) px-3">
        <i className="size-[9px] shrink-0 rounded-full bg-(--s-field-strong)" />
        <i className="size-[9px] shrink-0 rounded-full bg-(--s-field-strong)" />
        <i className="size-[9px] shrink-0 rounded-full bg-(--s-field-strong)" />
        <span className="flex h-[22px] min-w-0 flex-1 items-center justify-center gap-[5px] overflow-hidden whitespace-nowrap rounded-full bg-(--s-fill) px-2 font-montserrat text-[11px] font-medium text-(--s-subtle)">
          <Lock className="size-[11px] shrink-0" />
          <span className="truncate">{hostname}</span>
        </span>
      </div>
      <div ref={ref} className="relative min-h-[330px] flex-1 overflow-hidden">
        {scale > 0 && (
          <iframe
            src={url}
            title={title}
            tabIndex={-1}
            loading="lazy"
            sandbox=""
            className="pointer-events-none absolute start-0 top-0 border-0"
            style={{
              width: FRAME_WIDTH[device],
              height: size.height / scale,
              transform: `scale(${scale})`,
              transformOrigin: locale === "en" ? "top left" : "top right",
            }}
          />
        )}
      </div>
    </div>
  );
}

function ConfirmAction({
  trigger,
  open,
  onOpenChange,
  icon: Icon,
  title,
  description,
  confirm,
  destructive = false,
  onConfirm,
}: {
  /** The button that opens the dialog; omit it to control the dialog with `open`. */
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  icon: LucideIcon;
  title: string;
  description: string;
  confirm: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  const t = useTranslations("websiteOverview");
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent className="sm:max-w-[440px]">
        <AlertDialogHeader className="text-start">
          <IconTile icon={Icon} tone={destructive ? "danger" : "primary"} className="mb-1 size-11 [&_svg]:size-5" />
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="max-sm:flex-row max-sm:[&>*]:flex-1">
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={cn(destructive && "bg-destructive text-white hover:bg-destructive/90")}>
            {confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
