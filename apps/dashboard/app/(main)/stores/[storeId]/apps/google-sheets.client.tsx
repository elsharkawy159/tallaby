"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ExternalLink, LoaderCircle } from "lucide-react";

import { isValidSpreadsheetId, spreadsheetUrl } from "@workspace/lib/integrations";
import type { StoreIntegrationSummary } from "@workspace/lib/integrations/server";
import { Button } from "@workspace/ui/components/button";
import { SheetFooter } from "@workspace/ui/components/sheet";
import { BUTTON_CLASS } from "@/components/form/form-ui";
import { disconnectStoreApp } from "./apps.server";
import { createGoogleSheet, exportOrdersToGoogleSheet } from "./google-sheets.server";

/**
 * Google Sheets panel (PLAN.md §9.2, P7-06): connect with Google (a full
 * page redirect through the signed-state OAuth route), create the sheet,
 * export orders on demand. Disconnect revokes the grant at Google.
 */
export function GoogleSheetsPanel({
  storeId,
  current,
  readOnly,
  onRemoved,
  onClose,
}: {
  storeId: string;
  current?: StoreIntegrationSummary;
  readOnly: boolean;
  onRemoved: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("storeApps");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const connected = Boolean(current?.credentialsSaved);
  const sheetId = isValidSpreadsheetId(current?.details.spreadsheetId) ? current!.details.spreadsheetId! : null;

  const createSheet = () => {
    startTransition(async () => {
      const result = await createGoogleSheet(storeId);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        router.refresh();
        return;
      }
      toast.success(t("googleSheets.sheetCreated"));
      router.refresh();
    });
  };

  const exportOrders = () => {
    startTransition(async () => {
      const result = await exportOrdersToGoogleSheet(storeId);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        router.refresh();
        return;
      }
      toast.success(t("googleSheets.exported", { appended: result.data.appended, updated: result.data.updated }));
      router.refresh();
    });
  };

  const remove = () => {
    startTransition(async () => {
      const result = await disconnectStoreApp(storeId, "google_sheets");
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      onRemoved();
      toast.success(t("removed"));
      router.refresh();
      onClose();
    });
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
        <p className="text-[13px] text-muted-foreground">{t("googleSheets.scopeNote")}</p>
        {connected && sheetId && (
          <a
            href={spreadsheetUrl(sheetId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {current?.details.spreadsheetTitle ?? t("googleSheets.openSheet")}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        )}
        {connected && current?.lastSyncedAt && (
          <p className="text-xs text-muted-foreground">
            {t("googleSheets.lastSync", { date: new Date(current.lastSyncedAt).toLocaleString() })}
            {typeof current.details.exportedOrders === "number"
              ? ` · ${t("googleSheets.rows", { count: current.details.exportedOrders })}`
              : ""}
          </p>
        )}
        {current?.status === "error" && current.lastError && (
          <p className="rounded-xl bg-destructive/10 p-3 text-[13px] text-destructive" dir="auto">
            {t("lastError")}: {current.lastError}
          </p>
        )}
        {connected && <p className="text-xs text-faint">{t("googleSheets.dailyNote")}</p>}
      </div>
      <SheetFooter className="flex-row flex-wrap gap-2">
        {!connected ? (
          readOnly ? (
            <Button type="button" className={BUTTON_CLASS} disabled>
              {t("googleSheets.connect")}
            </Button>
          ) : (
            <Button asChild className={BUTTON_CLASS}>
              {/* A full navigation: the OAuth route sets the nonce cookie and redirects to Google. */}
              <a href={`/api/integrations/google/start?storeId=${encodeURIComponent(storeId)}`}>{t("googleSheets.connect")}</a>
            </Button>
          )
        ) : !sheetId ? (
          <Button type="button" className={BUTTON_CLASS} disabled={isPending || readOnly} onClick={createSheet}>
            {isPending && <LoaderCircle className="animate-spin" aria-hidden />}
            {t("googleSheets.createSheet")}
          </Button>
        ) : (
          <Button type="button" className={BUTTON_CLASS} disabled={isPending} onClick={exportOrders}>
            {isPending && <LoaderCircle className="animate-spin" aria-hidden />}
            {t("googleSheets.export")}
          </Button>
        )}
        {current && (
          <Button type="button" variant="outline" className={BUTTON_CLASS} disabled={isPending} onClick={remove}>
            {t("disconnect")}
          </Button>
        )}
      </SheetFooter>
    </>
  );
}
