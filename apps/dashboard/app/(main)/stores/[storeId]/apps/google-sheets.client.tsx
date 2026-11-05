"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ExternalLink, LoaderCircle } from "lucide-react";

import { isValidSpreadsheetId, spreadsheetUrl } from "@workspace/lib/integrations";
import type { StoreIntegrationSummary } from "@workspace/lib/integrations/server";
import { SheetFooter } from "@workspace/ui/components/sheet";
import { Note, SellerButton } from "@/components/seller-ui";
import { APP_DRAWER_FOOTER_CLASS } from "./app-drawer.lib";
import { disconnectStoreApp } from "./apps.server";
import { DisconnectAppButton } from "./disconnect-button.client";
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
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-[18px]">
        <p className="text-[13px] text-(--s-muted)">{t("googleSheets.scopeNote")}</p>
        {connected && sheetId && (
          <a
            href={spreadsheetUrl(sheetId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-1.5 text-sm font-bold text-(--s-link) underline-offset-4 hover:underline"
          >
            {current?.details.spreadsheetTitle ?? t("googleSheets.openSheet")}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        )}
        {connected && current?.lastSyncedAt && (
          <p className="text-xs text-(--s-subtle)">
            {t("googleSheets.lastSync", { date: new Date(current.lastSyncedAt).toLocaleString() })}
            {typeof current.details.exportedOrders === "number"
              ? ` · ${t("googleSheets.rows", { count: current.details.exportedOrders })}`
              : ""}
          </p>
        )}
        {current?.status === "error" && current.lastError && (
          <Note tone="danger">
            <span dir="auto">
              {t("lastError")}: {current.lastError}
            </span>
          </Note>
        )}
        {connected && <p className="text-xs text-(--s-faint)">{t("googleSheets.dailyNote")}</p>}
      </div>
      <SheetFooter className={APP_DRAWER_FOOTER_CLASS}>
        {!connected ? (
          readOnly ? (
            <SellerButton disabled>{t("googleSheets.connect")}</SellerButton>
          ) : (
            <SellerButton asChild>
              {/* A full navigation: the OAuth route sets the nonce cookie and redirects to Google. */}
              <a href={`/api/integrations/google/start?storeId=${encodeURIComponent(storeId)}`}>{t("googleSheets.connect")}</a>
            </SellerButton>
          )
        ) : !sheetId ? (
          <SellerButton disabled={isPending || readOnly} onClick={createSheet}>
            {isPending && <LoaderCircle className="animate-spin" aria-hidden />}
            {t("googleSheets.createSheet")}
          </SellerButton>
        ) : (
          <SellerButton disabled={isPending} onClick={exportOrders}>
            {isPending && <LoaderCircle className="animate-spin" aria-hidden />}
            {t("googleSheets.export")}
          </SellerButton>
        )}
        {current && (
          <DisconnectAppButton
            pending={isPending}
            description={t("disconnectConfirm.googleSheets")}
            onConfirm={remove}
          />
        )}
      </SheetFooter>
    </>
  );
}
