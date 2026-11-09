import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { currentOrderLock } from "@/lib/auth/require-seller.server";
import { getSelectedStoreLink } from "@/lib/stores/store-link.server";
import { PageHeader } from "@/components/seller-ui";
import { getHomeSnapshot, getPendingOrdersCount } from "./home.queries";
import type { HomeChannel } from "./home.shared";
import { isSetupComplete } from "./setup-checklist.data";

/**
 * "Good morning, {name}" in the seller's (Cairo) time of day. Where the top bar
 * drops the store's address (up to 1020px), it follows in small type here.
 */
export async function HomeGreeting() {
  const [snapshot, t, tHeader, storeLink] = await Promise.all([
    getHomeSnapshot(),
    getTranslations("home.header"),
    getTranslations("header"),
    getSelectedStoreLink().catch(() => null),
  ]);
  const hour = snapshot?.localHour ?? 12;
  return (
    <>
      {t(hour < 12 ? "morning" : "evening", { name: snapshot?.displayName ?? "" })}
      {storeLink && (
        <a
          href={storeLink.href}
          target="_blank"
          rel="noopener noreferrer"
          title={tHeader("openStore")}
          className="ms-2 inline-flex max-w-full items-center gap-1 align-middle font-montserrat text-xs font-medium text-(--s-subtle) no-underline hover:text-(--s-ink) min-[1021px]:hidden"
        >
          <bdi dir="ltr" className="truncate">
            {storeLink.host}
          </bdi>
          <ExternalLink className="size-3 shrink-0" aria-hidden />
        </a>
      )}
    </>
  );
}

/** One line on what needs doing first. */
export async function HomeSubtitle({ channel }: { channel: HomeChannel }) {
  // A seller who isn't activated gets no line that follows from orders (ROADMAP.md F-68).
  const { ordersLocked: locked } = await currentOrderLock();
  const [snapshot, pending, t] = await Promise.all([
    getHomeSnapshot(),
    locked ? 0 : getPendingOrdersCount(channel),
    getTranslations("home.header"),
  ]);
  if (pending > 0) return <>{t("pendingOrders", { count: pending })}</>;
  if (snapshot && (locked || !snapshot.hasOrders) && !isSetupComplete(snapshot)) return <>{t("almostReady")}</>;
  return <>{t("summary")}</>;
}

/** Page header frame. Title and subtitle stream in; the actions render immediately. */
export function HomeHeaderView({
  title,
  subtitle,
  rangeControl,
}: {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  rangeControl: React.ReactNode;
}) {
  return (
    <PageHeader
      title={title}
      description={subtitle}
      actions={rangeControl}
    />
  );
}
