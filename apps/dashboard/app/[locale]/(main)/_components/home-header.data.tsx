import { getTranslations } from "next-intl/server";
import { currentOrderLock } from "@/lib/auth/require-seller.server";
import { PageHeader } from "@/components/seller-ui";
import { getHomeSnapshot, getPendingOrdersCount } from "./home.queries";
import type { HomeChannel } from "./home.shared";
import { isSetupComplete } from "./setup-checklist.data";

/** "Good morning, {name}" in the seller's (Cairo) time of day. */
export async function HomeGreeting() {
  const [snapshot, t] = await Promise.all([getHomeSnapshot(), getTranslations("home.header")]);
  const hour = snapshot?.localHour ?? 12;
  return <>{t(hour < 12 ? "morning" : "evening", { name: snapshot?.displayName ?? "" })}</>;
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
