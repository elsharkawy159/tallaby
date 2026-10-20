import posthog from "posthog-js";
import { isMarketplaceHost } from "@workspace/lib/storefront";

// Skip on localhost / `next dev` — only live traffic should hit analytics & replays.
// capture/identify/reset elsewhere are safe no-ops when PostHog is uninitialized.
// Tallaby analytics stay on the marketplace, never on seller storefronts (PLAN.md P5-05).
if (
  process.env.NODE_ENV !== "development" &&
  isMarketplaceHost(window.location.host)
) {
  const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!projectToken || !host) {
    const missingVariable = !projectToken
      ? "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"
      : "NEXT_PUBLIC_POSTHOG_HOST";

    console.error(
      `${missingVariable} is required for PostHog in production; events will be missed until it is configured.`,
    );
  } else {
    posthog.init(projectToken, {
      api_host: host,
      defaults: "2026-01-30",
      capture_exceptions: true,
      debug: false,
    });
  }
}
