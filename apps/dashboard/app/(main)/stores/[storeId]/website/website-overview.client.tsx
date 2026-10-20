"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Copy,
  ExternalLink,
  Eye,
  FileText,
  FormInput,
  Globe,
  History,
  ImageIcon,
  LayoutTemplate,
  LoaderCircle,
  Newspaper,
  Palette,
  Pencil,
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
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Switch } from "@workspace/ui/components/switch";
import { BUTTON_CLASS, SectionCard, SMALL_BUTTON_CLASS } from "@/components/form/form-ui";
import { cn } from "@/lib/utils";
import { discardDraft, publish, restoreRevision, unpublish } from "@/app/(builder)/stores/[storeId]/editor/server/editor.server";
import { useStorePreview } from "@/app/(builder)/stores/[storeId]/editor/use-store-preview.client";
import type { WebsiteOverviewData } from "./website.types";

/** The other Website pages (PLAN.md §7.2). Some ship later; their links already point at the final routes. */
const WEBSITE_LINKS: { key: string; path: string; icon: LucideIcon }[] = [
  { key: "design", path: "website/design", icon: Palette },
  { key: "pages", path: "website/pages", icon: FileText },
  { key: "domain", path: "website/domain", icon: Globe },
  { key: "social", path: "website/social", icon: Share2 },
  { key: "blog", path: "website/blog", icon: Newspaper },
  { key: "forms", path: "website/forms", icon: FormInput },
  { key: "media", path: "website/media", icon: ImageIcon },
  { key: "templates", path: "website/templates", icon: LayoutTemplate },
];

type StatusKey = "draft" | "published" | "changes" | "unpublished";

function statusKey(data: WebsiteOverviewData): StatusKey {
  if (data.isLive) return data.hasUnpublishedChanges ? "changes" : "published";
  return data.siteStatus === "unpublished" ? "unpublished" : "draft";
}

export function WebsiteOverview({ data }: { data: WebsiteOverviewData }) {
  const t = useTranslations("websiteOverview");
  const te = useTranslations("storeEditor");
  const format = useFormatter();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const preview = useStorePreview(data.storeId);
  const status = statusKey(data);
  const base = `/stores/${data.storeId}`;
  const date = (iso: string) => format.dateTime(new Date(iso), { dateStyle: "medium", timeStyle: "short" });

  /** Runs an editor action, shows its error, refreshes the server data. */
  const run = (
    key: string,
    action: () => Promise<{ success: true } | { success: false; error: string }>,
    done: string,
    onFail?: () => void,
  ) => {
    setBusy(key);
    startTransition(async () => {
      try {
        const result = await action();
        if (result.success) {
          toast.success(done);
          router.refresh();
        } else {
          onFail?.();
          toast.error(te(`errors.${result.error}` as "errors.generic"));
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

  // "Website live" switch: optimistic until the refreshed server data
  // arrives (a new `data.isLive` drops it), reverted when the action fails.
  const [optimistic, setOptimistic] = useState<{ value: boolean; base: boolean } | null>(null);
  const [confirmOffline, setConfirmOffline] = useState(false);
  const live = optimistic && optimistic.base === data.isLive ? optimistic.value : data.isLive;
  const goLive = () => {
    setOptimistic({ value: true, base: data.isLive });
    run("publish", () => publish(data.storeId), t("publishedToast"), () => setOptimistic(null));
  };
  const goOffline = () => {
    setOptimistic({ value: false, base: data.isLive });
    run("unpublish", () => unpublish(data.storeId), t("unpublishedToast"), () => setOptimistic(null));
  };
  const switchHint = live ? "liveSwitchOn" : data.siteStatus === "unpublished" ? "liveSwitchOff" : "liveSwitchDraft";

  return (
    <div className="space-y-5">
      <SectionCard
        id="website-status"
        icon={Globe}
        title={t("title")}
        description={t("description")}
        tag={<StatusBadge status={status} label={t(`status.${status}`)} />}
      >
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border bg-muted/30 p-3">
              <div className="min-w-0 flex-1 basis-48">
                <label htmlFor="website-live" className="text-sm font-semibold">
                  {t("liveSwitch")}
                </label>
                <p id="website-live-hint" className="text-xs text-muted-foreground">
                  {t(switchHint)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {(busy === "publish" || busy === "unpublish") && (
                  <LoaderCircle className="size-4 animate-spin text-muted-foreground" aria-hidden />
                )}
                <Switch
                  id="website-live"
                  aria-describedby="website-live-hint"
                  checked={live}
                  disabled={data.readOnly || working}
                  onCheckedChange={(checked) => (checked ? goLive() : setConfirmOffline(true))}
                />
              </div>
              <ConfirmAction
                open={confirmOffline}
                onOpenChange={setConfirmOffline}
                title={t("unpublishTitle")}
                description={t("unpublishBody")}
                confirm={t("unpublish")}
                destructive
                onConfirm={goOffline}
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">{t("liveUrl")}</p>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={data.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                  className="truncate font-mono text-sm font-medium text-primary hover:underline"
                >
                  {data.hostname}
                </a>
                <Button type="button" variant="outline" size="sm" className={SMALL_BUTTON_CLASS} onClick={copy}>
                  <Copy aria-hidden />
                  {t("copy")}
                </Button>
                <Button asChild variant="outline" size="sm" className={SMALL_BUTTON_CLASS}>
                  <a href={data.liveUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink aria-hidden />
                    {t("open")}
                  </a>
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{t(`statusHint.${status}`)}</p>
            <p className="text-sm">
              <span className="text-muted-foreground">{t("lastPublished")}: </span>
              {data.lastPublishedAt ? date(data.lastPublishedAt) : t("never")}
              <span className="text-muted-foreground"> · {t("pageCount", { count: data.pageCount })}</span>
            </p>

            <div className="flex flex-wrap gap-2">
              <Button asChild className={BUTTON_CLASS}>
                <Link href={`${base}/editor`}>
                  <Pencil aria-hidden />
                  {t("edit")}
                </Link>
              </Button>
              {data.previewEnabled ? (
                <Button
                  type="button"
                  variant="outline"
                  className={BUTTON_CLASS}
                  onClick={preview.open}
                  disabled={preview.opening || data.readOnly}
                >
                  {preview.opening ? <LoaderCircle className="animate-spin" aria-hidden /> : <Eye aria-hidden />}
                  {t("preview")}
                </Button>
              ) : (
                <Button type="button" variant="outline" className={BUTTON_CLASS} disabled title={t("previewUnavailable")}>
                  <Eye aria-hidden />
                  {t("preview")}
                </Button>
              )}
              {!data.readOnly && data.isLive && data.hasUnpublishedChanges && (
                <Button
                  type="button"
                  className={BUTTON_CLASS}
                  disabled={working}
                  onClick={() => run("publish", () => publish(data.storeId), t("publishedToast"))}
                >
                  {busy === "publish" ? <LoaderCircle className="animate-spin" aria-hidden /> : <UploadCloud aria-hidden />}
                  {t("publishChanges")}
                </Button>
              )}
            </div>

            {!data.readOnly && data.isLive && data.hasUnpublishedChanges && (
              <div className="flex flex-wrap gap-2 border-t pt-4">
                <ConfirmAction
                  trigger={
                    <Button type="button" variant="ghost" size="sm" className={SMALL_BUTTON_CLASS} disabled={working}>
                      <Undo2 aria-hidden />
                      {t("discard")}
                    </Button>
                  }
                  title={t("discardTitle")}
                  description={t("discardBody")}
                  confirm={t("discard")}
                  onConfirm={() => run("discard", () => discardDraft(data.storeId), t("discardedToast"))}
                />
              </div>
            )}
          </div>

          {/* Thumbnail of what shoppers see right now (scripts off, not clickable). */}
          <div className="relative hidden aspect-[3/4] overflow-hidden rounded-xl border bg-muted md:block" aria-hidden>
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
      </SectionCard>

      <section aria-labelledby="website-links" className="space-y-3">
        <h2 id="website-links" className="text-sm font-semibold">
          {t("manage")}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {WEBSITE_LINKS.map(({ key, path, icon: Icon }) => (
            <li key={key}>
              <Link
                href={`${base}/${path}`}
                className="flex h-full items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary-soft/40"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-primary-ink">
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{t(`links.${key}.title`)}</span>
                  <span className="block text-xs text-muted-foreground">{t(`links.${key}.body`)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <SectionCard id="website-revisions" icon={History} title={t("revisions")} description={t("revisionsHint")}>
        {data.revisions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noRevisions")}</p>
        ) : (
          <ul className="divide-y">
            {data.revisions.map((revision) => (
              <li key={revision.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="text-sm font-semibold">{t("version", { number: revision.revisionNumber })}</span>
                {revision.isLive && <Badge variant="secondary">{t("live")}</Badge>}
                <span className="text-sm text-muted-foreground">{date(revision.createdAt)}</span>
                {!data.readOnly && (
                  <ConfirmAction
                    trigger={
                      <Button type="button" variant="outline" size="sm" className={cn(SMALL_BUTTON_CLASS, "ms-auto")} disabled={working}>
                        {busy === `restore:${revision.id}` ? <LoaderCircle className="animate-spin" aria-hidden /> : <RotateCcw aria-hidden />}
                        {t("restore")}
                      </Button>
                    }
                    title={t("restoreTitle", { number: revision.revisionNumber })}
                    description={t("restoreBody")}
                    confirm={t("restore")}
                    onConfirm={() =>
                      run(`restore:${revision.id}`, () => restoreRevision(data.storeId, revision.id), t("restoredToast"))
                    }
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

function StatusBadge({ status, label }: { status: StatusKey; label: string }) {
  return (
    <Badge
      variant={status === "published" ? "default" : "outline"}
      className={cn(status === "changes" && "border-amber-300 bg-amber-50 text-amber-900")}
    >
      {label}
    </Badge>
  );
}

function ConfirmAction({
  trigger,
  open,
  onOpenChange,
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(destructive && "bg-destructive text-white hover:bg-destructive/90")}
          >
            {confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
