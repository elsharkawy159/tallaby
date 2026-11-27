import type { AppManifest } from "@workspace/apps";

/**
 * Which "How to start" steps an app page shows (owner, 2026-11-27: every app
 * page should tell the seller everything in a glance). Pure: the keys map to
 * `appDetail.start.<kind>.<step>` strings in both locales.
 */
export type AppStartKind = "builtin" | "feature" | "install" | "installPaid" | "connect" | "request" | "soon";

export const APP_START_STEPS: Record<AppStartKind, readonly string[]> = {
  builtin: ["included", "settings", "thisStore"],
  feature: ["included", "where", "open"],
  install: ["press", "settings", "remove"],
  installPaid: ["pressPaid", "settings", "remove"],
  connect: ["press", "settings", "disconnect"],
  request: ["soon", "press", "notify"],
  soon: ["soon", "notify"],
};

export function appStartKind(
  manifest: Pick<AppManifest, "installMode" | "settingsRoute" | "pricing">,
  state: { available: boolean; requestable: boolean },
): AppStartKind {
  if (state.requestable || manifest.installMode === "request") return "request";
  if (!state.available) return "soon";
  if (manifest.settingsRoute === "feature_page") return "feature";
  if (manifest.installMode === "builtin") return "builtin";
  if (manifest.installMode === "connect") return "connect";
  return manifest.pricing.model === "free" ? "install" : "installPaid";
}

/** The steps to show: a built-in app with nothing to set skips the Settings step. */
export function appStartSteps(kind: AppStartKind, hasSettings: boolean): readonly string[] {
  const steps = APP_START_STEPS[kind];
  return kind === "builtin" && !hasSettings ? steps.filter((step) => step !== "settings") : steps;
}
