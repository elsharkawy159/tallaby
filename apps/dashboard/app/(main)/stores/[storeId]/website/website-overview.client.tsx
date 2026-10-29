"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  FormInput,
  Globe,
  ImageIcon,
  LayoutTemplate,
  Link2,
  LoaderCircle,
  Newspaper,
  Palette,
  Pencil,
  Radio,
  RotateCcw,
  Share2,
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
import { Button } from "@workspace/ui/components/button";
import { Switch } from "@workspace/ui/components/switch";
import { BUTTON_CLASS, SMALL_BUTTON_CLASS } from "@/components/form/form-ui";
import { cn } from "@/lib/utils";
import { discardDraft, publish, restoreRevision, unpublish } from "@/app/(builder)/stores/[storeId]/editor/server/editor.server";
import { useStorePreview } from "@/app/(builder)/stores/[storeId]/editor/use-store-preview.client";
import { PublishCelebration, type LiveSite } from "@/app/(main)/_components/publish-celebration.client";
import type { WebsiteOverviewData } from "./website.types";

/** The other Website pages (PLAN.md §7.2), in the design's order. */
const WEBSITE_LINKS: { key: string; path: string; icon: LucideIcon }[] = [
  { key: "design", path: "website/design", icon: Palette },
  { key: "templates", path: "website/templates", icon: LayoutTemplate },
  { key: "pages", path: "website/pages", icon: FileText },
  { key: "domain", path: "website/domain", icon: Globe },
  { key: "blog", path: "website/blog", icon: Newspaper },
  { key: "media", path: "website/media", icon: ImageIcon },
  { key: "forms", path: "website/forms", icon: FormInput },
  { key: "social", path: "website/social", icon: Share2 },
];

/** Versions shown before "Show all". */
const REVISIONS_SHOWN = 5;

/** What the seller should do next: pick a template, go live, or publish their changes. */
type NextStep = "template" | "goLive" | "changes";

/**
 * Website › Overview (PLAN.md P4-12; Claude Design "Seller Website", owner
 * 2026-10-28): address, publish state and the next step, a live thumbnail,
 * links to the other Website pages and the version history. On phones the
 * next step moves to a bar stuck to the bottom of the screen and dialogs open
 * as bottom sheets. Every button calls the store-scoped editor actions, which
 * re-check the store.
 */
export function WebsiteOverview({ data }: { data: WebsiteOverviewData }) {
  const t = useTranslations("websiteOverview");
  const te = useTranslations("storeEditor");
  const ts = useTranslations("storeSettings");
  const format = useFormatter();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
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

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(data.liveUrl);
      toast.success(t("copied"));
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

  /** The next step's buttons, shared by the card panel and the phone bar. */
  const nextActions = (size: "sm" | "lg") => {
    const cls = size === "sm" ? SMALL_BUTTON_CLASS : cn(BUTTON_CLASS, "h-[46px] px-4");
    if (next === "template")
      return (
        <Button asChild variant="accent" className={cn(cls, "publish-attention")}>
          <Link href={`${base}/website/templates`}>
            <LayoutTemplate aria-hidden />
            {t("chooseTemplate")}
          </Link>
        </Button>
      );
    const publishing = busy === "publish";
    return (
      <>
        {next === "changes" && (
          <ConfirmAction
            trigger={
              <Button type="button" variant="soft" className={cls} disabled={working}>
                {busy === "discard" ? <LoaderCircle className="animate-spin" aria-hidden /> : <Undo2 aria-hidden />}
                {/* The phone bar has room for the icon only. */}
                {size === "sm" ? t("discard") : <span className="sr-only">{t("discard")}</span>}
              </Button>
            }
            icon={Undo2}
            title={t("discardTitle")}
            description={t("discardBody")}
            confirm={t("discard")}
            destructive
            onConfirm={discard}
          />
        )}
        <Button
          type="button"
          variant="accent"
          // Soft ring and sheen (globals.css `publish-attention`) so the next step is hard to miss.
          className={cn(cls, !working && "publish-attention")}
          disabled={working}
          onClick={next === "goLive" ? goLive : publishChanges}
        >
          {publishing ? <LoaderCircle className="animate-spin" aria-hidden /> : <UploadCloud aria-hidden />}
          {next === "goLive" ? t("publish") : size === "sm" ? t("publishChanges") : t("publish")}
        </Button>
      </>
    );
  };

  const revisions = showAll ? data.revisions : data.revisions.slice(0, REVISIONS_SHOWN);

  return (
    <div className={cn("space-y-4 sm:space-y-5", next && "max-sm:pb-24")}>
      <div className="max-sm:hidden">
        <h1 className="text-2xl font-bold">{t("heading")}</h1>
        <p className="text-pretty text-muted-foreground">{t("description")}</p>
      </div>

      <section className="grid overflow-hidden rounded-2xl border bg-card shadow-xs md:grid-cols-[minmax(0,1fr)_280px] lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex min-w-0 flex-col gap-4 p-[18px] sm:gap-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusPill tone={live ? "ok" : "off"}>
              {live ? t("liveSwitchOnline") : t(data.siteStatus === "unpublished" ? "status.unpublished" : "status.draft")}
            </StatusPill>
            {live && data.hasUnpublishedChanges && <StatusPill tone="warn">{t("status.changes")}</StatusPill>}
            {data.readOnly && <StatusPill tone="off">{ts("readOnlyBadge")}</StatusPill>}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2 sm:justify-start">
              <a
                href={data.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className="min-w-0 font-sans text-xl leading-snug font-bold [overflow-wrap:anywhere] text-foreground hover:text-primary sm:text-[26px]"
              >
                {data.hostname}
              </a>
              <span className="flex shrink-0 gap-1">
                <IconButton label={t("copy")} onClick={copy}>
                  <Copy />
                </IconButton>
                <IconButton label={t("open")} href={data.liveUrl}>
                  <ExternalLink />
                </IconButton>
              </span>
            </div>
            <div className="flex flex-wrap gap-x-[18px] gap-y-1 text-[13px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <Clock className="size-[15px]" aria-hidden />
                {t("lastPublished")}: {data.lastPublishedAt ? date(data.lastPublishedAt) : t("never")}
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <FileText className="size-[15px]" aria-hidden />
                {t("pageCount", { count: data.pageCount })}
              </span>
              {data.defaultHostname !== data.hostname && (
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <Link2 className="size-[15px]" aria-hidden />
                  <span dir="ltr" className="font-sans">
                    {data.defaultHostname}
                  </span>
                </span>
              )}
            </div>
          </div>

          {next && (
            <div className="flex flex-wrap items-center gap-3.5 rounded-[14px] border border-accent/35 bg-accent-soft px-4 py-3.5 max-sm:hidden">
              <span className="grid size-[38px] shrink-0 place-items-center rounded-[11px] bg-card text-accent-ink" aria-hidden>
                {next === "template" ? <LayoutTemplate className="size-[18px]" /> : <UploadCloud className="size-[18px]" />}
              </span>
              <div className="min-w-[220px] flex-1">
                <b className="block text-sm">{nextTitle}</b>
                <small className="text-[12.5px] text-muted-foreground">{nextBody}</small>
              </div>
              <div className="ms-auto flex shrink-0 gap-1.5">{nextActions("sm")}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
            <Button asChild variant="secondary" className={cn(BUTTON_CLASS, "h-[46px] px-3 sm:px-5")}>
              <Link href={`${base}/editor`}>
                <Pencil aria-hidden />
                {t("edit")}
              </Link>
            </Button>
            <Button
              type="button"
              variant="neutral"
              className={cn(BUTTON_CLASS, "h-[46px] px-3 sm:px-5")}
              onClick={preview.open}
              disabled={!data.previewEnabled || preview.opening || data.readOnly}
              title={data.previewEnabled ? undefined : t("previewUnavailable")}
            >
              {preview.opening ? <LoaderCircle className="animate-spin" aria-hidden /> : <Eye aria-hidden />}
              {t("preview")}
            </Button>
          </div>

          <div className="mt-auto flex items-center gap-3 border-t pt-[18px]">
            <div className="min-w-0 flex-1">
              <label htmlFor="website-live" className="block text-[13.5px] font-semibold">
                {t("visibility")}
              </label>
              <p id="website-live-hint" className="text-[12.5px] text-muted-foreground">
                {t(switchHint)}
              </p>
            </div>
            {(busy === "publish" || busy === "unpublish") && (
              <LoaderCircle className="size-4 animate-spin text-muted-foreground" aria-hidden />
            )}
            <Switch
              id="website-live"
              aria-describedby="website-live-hint"
              checked={live}
              disabled={data.readOnly || working || needsTemplate}
              className="data-[state=checked]:bg-success"
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
        </div>

        {/* What shoppers see right now (scripts off, not clickable). On phones it leads the card. */}
        <div className="order-first flex items-center justify-center border-b bg-muted p-4 md:order-none md:border-b-0 md:border-s md:p-6" aria-hidden>
          <div className="w-full max-w-[420px] overflow-hidden rounded-xl border border-input bg-white shadow-[0_10px_30px_rgba(20,81,99,0.10)] md:max-w-none">
            <div dir="ltr" className="flex h-7 items-center gap-[5px] border-b border-[#e3e6e5] bg-[#f1f3f2] px-2.5">
              <i className="size-2 rounded-full bg-[#d5dad8]" />
              <i className="size-2 rounded-full bg-[#d5dad8]" />
              <i className="size-2 rounded-full bg-[#d5dad8]" />
              <span className="ms-2 flex h-4 min-w-0 flex-1 items-center truncate rounded-[5px] bg-white px-2 font-sans text-[10px] text-[#7b878c]">
                {data.hostname}
              </span>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden">
              <iframe
                src={data.liveUrl}
                title={t("thumbnail")}
                tabIndex={-1}
                loading="lazy"
                sandbox=""
                className="pointer-events-none absolute start-0 top-0 h-[400%] w-[400%] origin-top-left scale-25 rtl:origin-top-right"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section aria-labelledby="website-links">
          <h2 id="website-links" className="mb-3 text-base font-bold">
            {t("manage")}
          </h2>
          <ul className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            {WEBSITE_LINKS.map(({ key, path, icon: Icon }) => (
              <li key={key} className="min-w-0">
                <Link
                  href={`${base}/${path}`}
                  className="group flex h-full min-w-0 items-center gap-2.5 rounded-[14px] border bg-card p-3 transition-[border-color,box-shadow,translate] hover:border-input hover:shadow-[0_6px_18px_rgba(20,81,99,0.08)] motion-safe:hover:-translate-y-px sm:flex-col sm:items-stretch sm:gap-3 sm:p-[18px]"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-primary-soft text-primary-ink sm:size-10">
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] leading-normal font-semibold sm:text-[14.5px]">{t(`links.${key}.title`)}</span>
                    <span className="block text-pretty text-[12.5px] text-muted-foreground max-sm:hidden">{t(`links.${key}.body`)}</span>
                  </span>
                  <ArrowUpRight
                    className="mt-auto size-[18px] self-end text-faint group-hover:text-primary-ink max-sm:hidden rtl:-scale-x-100"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="website-revisions" className="rounded-2xl border bg-card shadow-xs">
          <div className="border-b px-4 py-[18px] sm:px-5">
            <h2 id="website-revisions" className="text-base font-bold">
              {t("revisions")}
            </h2>
            <p className="text-[12.5px] text-muted-foreground max-sm:hidden">{t("revisionsHint")}</p>
          </div>
          {data.revisions.length === 0 ? (
            <p className="px-4 py-5 text-sm text-muted-foreground sm:px-5">{t("noRevisions")}</p>
          ) : (
            <ul className="py-1.5">
              {revisions.map((revision, index) => (
                <li key={revision.id} className="group relative flex items-center gap-3 px-4 py-2.5 sm:px-5">
                  {index > 0 && <span className="absolute -top-2.5 start-[31px] h-5 w-px bg-border sm:start-[35px]" aria-hidden />}
                  <span
                    className={cn(
                      "relative z-[1] grid size-[31px] shrink-0 place-items-center rounded-full border font-sans text-[11px] font-bold",
                      revision.isLive ? "border-transparent bg-success-soft text-success" : "bg-muted text-muted-foreground",
                    )}
                    aria-hidden
                  >
                    {revision.isLive ? <Radio className="size-[15px]" /> : revision.revisionNumber}
                  </span>
                  <div className="min-w-0 flex-1">
                    <b className="flex items-center gap-2 text-[13.5px] font-semibold">
                      {t("version", { number: revision.revisionNumber })}
                      {revision.isLive && (
                        <span className="inline-flex h-5 items-center rounded-full bg-success-soft px-2 text-[11px] font-semibold text-success">
                          {t("live")}
                        </span>
                      )}
                    </b>
                    <small className="block text-xs text-muted-foreground">{date(revision.createdAt)}</small>
                  </div>
                  {!data.readOnly && !revision.isLive && (
                    <ConfirmAction
                      trigger={
                        <Button
                          type="button"
                          variant="neutral"
                          className={cn(
                            SMALL_BUTTON_CLASS,
                            "transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100",
                          )}
                          disabled={working}
                        >
                          {busy === `restore:${revision.id}` ? <LoaderCircle className="animate-spin" aria-hidden /> : <RotateCcw aria-hidden />}
                          {t("restore")}
                        </Button>
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
            </ul>
          )}
          {data.revisions.length > REVISIONS_SHOWN && (
            <div className="border-t px-4 pt-2.5 pb-4 sm:px-5">
              <Button type="button" variant="soft" className={cn(SMALL_BUTTON_CLASS, "w-full")} onClick={() => setShowAll((v) => !v)}>
                {showAll ? t("showLess") : t("showAll", { count: data.revisions.length })}
                {showAll ? <ChevronUp aria-hidden /> : <ChevronDown aria-hidden />}
              </Button>
            </div>
          )}
        </section>
      </div>

      {/* Phones: the next step stays in reach at the bottom of the screen. */}
      {next && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2.5 border-t bg-card px-3.5 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-6px_20px_rgba(20,81,99,0.08)] sm:hidden">
          <div className="min-w-0 flex-1">
            <b className="block truncate text-[13.5px] leading-snug">{nextTitle}</b>
            <small className="line-clamp-1 text-xs leading-snug text-muted-foreground">{nextBody}</small>
          </div>
          {nextActions("lg")}
        </div>
      )}

      <PublishCelebration live={celebrate} onClose={() => setCelebrate(null)} />
    </div>
  );
}

function StatusPill({ tone, children }: { tone: "ok" | "off" | "warn"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold whitespace-nowrap",
        tone === "ok" && "bg-success-soft text-success",
        tone === "off" && "border bg-muted text-muted-foreground",
        tone === "warn" && "bg-accent-soft text-accent-ink",
      )}
    >
      {tone !== "warn" && (
        <i className="size-2 rounded-full bg-current shadow-[0_0_0_3px_color-mix(in_oklab,currentColor_22%,transparent)]" aria-hidden />
      )}
      {children}
    </span>
  );
}

function IconButton({ label, onClick, href, children }: { label: string; onClick?: () => void; href?: string; children: ReactNode }) {
  const cls =
    "grid size-[38px] place-items-center rounded-[10px] border border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground [&_svg]:size-[18px]";
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls} aria-label={label} title={label}>
      {children}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls} aria-label={label} title={label}>
      {children}
    </button>
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
      {/* A bottom sheet on phones, a centred dialog from sm up. */}
      <AlertDialogContent className="max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-none max-sm:rounded-t-[22px] max-sm:border-x-0 max-sm:border-b-0 max-sm:pb-[calc(18px+env(safe-area-inset-bottom))] sm:max-w-[440px] sm:rounded-[20px]">
        <span className="mx-auto -mt-2 mb-1 block h-1 w-10 rounded-full bg-input sm:hidden" aria-hidden />
        <AlertDialogHeader className="text-start">
          <span
            className={cn(
              "mb-1 grid size-11 place-items-center rounded-xl",
              destructive ? "bg-destructive-soft text-destructive" : "bg-primary-soft text-primary-ink",
            )}
            aria-hidden
          >
            <Icon className="size-5" />
          </span>
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
