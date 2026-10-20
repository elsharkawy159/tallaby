import { BuilderIntl } from "./builder-intl.client";

/**
 * Full-screen builder routes (spec 2026-10-20-admin-website-builder §5.5):
 * no admin sidebar. The proxy keeps moderators out; every page and action
 * re-checks the admin itself.
 */
export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <BuilderIntl>
      <div className="min-h-dvh bg-background">{children}</div>
    </BuilderIntl>
  );
}
