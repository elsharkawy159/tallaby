import { getApp, type AppManifest } from "@workspace/apps";
import { isPaidAppPricing } from "@workspace/lib/billing/app-pricing";
import {
  getStoreApp,
  isStoreAppDefaultInstalled,
  isStoreAppLive,
  isStoreAppRequestable,
  storeAppPricing,
  storeAppProvider,
  type StoreApp,
} from "@workspace/lib/integrations";

/**
 * One store's state for every App Center app (ROADMAP.md F-93). Pure: the
 * list, the detail page and the settings header all read it, so a card and
 * its page never disagree. The inputs are that store's rows only (rule 5);
 * nothing here is cached across stores (rule 8).
 */

export type AppRequestStatus = "requested" | "enabled" | "declined";

/** What `listStoreIntegrations` returns, narrowed to what the state needs. */
export type AppIntegrationRow = { provider: string; status: "connected" | "error" | "disconnected" };

export type AppCenterStoreState = {
  integrations: AppIntegrationRow[];
  /** Live `store_app_installs` rows (0139). */
  installs: { appKey: string; cancelAtPeriodEnd: boolean }[];
  /** `store_app_requests` rows (0143, F-62). */
  requests: { appKey: string; status: AppRequestStatus }[];
  /** Google OAuth env present: Google Sheets can't connect without it. */
  googleSheetsEnabled: boolean;
  /** The USD switch (0136): a paid app can't be bought before it. */
  usdLive: boolean;
};

/** The one badge a card shows, most important first. */
export type AppBadge =
  | "error"
  | "connected"
  | "installed"
  | "requested"
  | "enabled"
  | "request"
  | "coming_soon"
  | "paid_locked"
  | "available";

export type AppState = {
  /** Built, and usable on this deployment. */
  available: boolean;
  /** Under the Installed tab: built in, connected, or bought. */
  installed: boolean;
  /** Has a `store_integrations` row. */
  connected: boolean;
  failing: boolean;
  /** Has a live install row (the install engine's apps). */
  hasInstallRow: boolean;
  /** Removed, but a paid month keeps it until the period ends. */
  cancelAtPeriodEnd: boolean;
  /** Paid, not bought, and the wallet is not in dollars yet. */
  paidLocked: boolean;
  requestable: boolean;
  requestStatus: AppRequestStatus | null;
  badge: AppBadge;
};

export function appState(app: StoreApp, store: AppCenterStoreState): AppState {
  const provider = storeAppProvider(app);
  const row = provider ? store.integrations.find((item) => item.provider === provider) : undefined;
  const install = store.installs.find((item) => item.appKey === app.key);
  const request = store.requests.find((item) => item.appKey === app.key);
  const available = isStoreAppLive(app) && (app.key !== "google_sheets" || store.googleSheetsEnabled);
  const connected = Boolean(row);
  const failing = row?.status === "error";
  const hasInstallRow = Boolean(install);
  const installed = available && (isStoreAppDefaultInstalled(app) || connected || hasInstallRow);
  const paidLocked = isPaidAppPricing(storeAppPricing(app)) && !store.usdLive && !hasInstallRow;
  const requestable = isStoreAppRequestable(app);
  const requestStatus = request?.status ?? null;

  const badge: AppBadge =
    requestStatus === "enabled"
      ? "enabled"
      : requestStatus === "requested"
        ? "requested"
        : requestable
          ? "request"
          : !available
            ? "coming_soon"
            : failing
              ? "error"
              : connected
                ? "connected"
                : installed
                  ? "installed"
                  : paidLocked
                    ? "paid_locked"
                    : "available";

  return {
    available,
    installed,
    connected,
    failing,
    hasInstallRow,
    cancelAtPeriodEnd: install?.cancelAtPeriodEnd ?? false,
    paidLocked,
    requestable,
    requestStatus,
    badge,
  };
}

/**
 * The detail page's main button.
 * - `settings`: open its settings (connect flows start there too).
 * - `install` / `remove`: the install engine's confirm dialog.
 * - `request`: ask for it (F-62). `requested`: already asked.
 * - `none`: coming soon, or locked until the USD switch.
 */
export type AppPrimaryAction = "settings" | "install" | "remove" | "request" | "requested" | "none";

export function appPrimaryAction(manifest: AppManifest, state: AppState): AppPrimaryAction {
  if (state.requestable) return state.requestStatus ? "requested" : "request";
  if (!state.available) return "none";
  if (manifest.installMode === "toggle") {
    if (!state.hasInstallRow || state.cancelAtPeriodEnd) return state.paidLocked ? "none" : "install";
    return manifest.settingsRoute ? "settings" : "remove";
  }
  return manifest.settingsRoute ? "settings" : "none";
}

/** Whether the detail page also offers "Remove" next to the main button (installed toggle apps with settings). */
export function appCanRemove(manifest: AppManifest, state: AppState): boolean {
  return manifest.installMode === "toggle" && state.hasInstallRow && !state.cancelAtPeriodEnd;
}

/** Both views of one app; null for an unknown id. */
export function appEntry(id: string): { manifest: AppManifest; app: StoreApp } | null {
  const manifest = getApp(id);
  const app = getStoreApp(id);
  return manifest && app ? { manifest, app } : null;
}

export type AppTab = "all" | "installed";

