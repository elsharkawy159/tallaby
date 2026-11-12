import { describe, expect, it } from "vitest";
import { APPS, getAppBySlug } from "@workspace/apps";
import { LEGACY_APP_ROUTES, slugOfAppPath } from "./legacy-routes.lib";

describe("old app URLs (F-93)", () => {
  it("send every old app page to a real App Center app", () => {
    for (const route of LEGACY_APP_ROUTES) {
      const slug = slugOfAppPath(route.to);
      if (route.to === "/stores/[storeId]/apps") continue;
      expect(slug, route.to).not.toBeNull();
      expect(getAppBySlug(slug!), route.to).not.toBeNull();
    }
  });

  it("covers each app that had its own page before the App Center", () => {
    const covered = new Set(LEGACY_APP_ROUTES.map((route) => slugOfAppPath(route.from)).filter(Boolean));
    for (const slug of ["bosta", "wassalha", "size-chart", "ai-assistants"]) expect(covered.has(slug), slug).toBe(true);
  });

  it("sends the old Google Sheets OAuth return to its settings", () => {
    const google = LEGACY_APP_ROUTES.find((route) => route.from.includes("?google="))!;
    expect(google.to).toBe("/stores/[storeId]/apps/google-sheets/settings?google=[result]");
    expect(getAppBySlug("google-sheets")?.settingsRoute).toBe("google_sheets");
  });

  it("gives every built app a settings page or an install-only overview", () => {
    for (const app of APPS) if (app.status === "live") expect(app.settingsRoute !== null || app.installMode === "toggle", app.id).toBe(true);
  });
});
