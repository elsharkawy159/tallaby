import { logServerError } from "@workspace/db/log";
import { listRoadmapCardsForAdmin, type AdminRoadmapCard } from "@workspace/lib/admin/server";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { RoadmapAdmin } from "./roadmap-admin.client";

export const dynamic = "force-dynamic";

/**
 * The public seller roadmap (0115, dashboard.tallaby.com/roadmap): move cards
 * between the four columns, edit their Arabic and English text, add team
 * cards and hide spam. Not cached: votes and new ideas change all the time.
 */
export default async function RoadmapAdminPage() {
  await getCurrentAdminUser();
  let cards: AdminRoadmapCard[];
  try {
    cards = await listRoadmapCardsForAdmin();
  } catch (error) {
    logServerError("admin", "roadmap list failed", {}, error);
    return <p className="text-sm text-destructive">The roadmap could not be loaded. Is migration 0115 applied?</p>;
  }
  const dashboardUrl = process.env.DASHBOARD_URL?.replace(/\/$/, "") ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Roadmap</h1>
        <p className="text-sm text-muted-foreground">
          Cards on the public seller roadmap. Sellers suggest ideas (they start in Waiting) and vote while a card is
          Waiting or Planned. Drag a card to another column or use its menu. Moving a card to Launched sets today as
          its launch date. Hidden cards stay here but leave the public page.
        </p>
      </div>
      <RoadmapAdmin cards={cards} publicUrl={dashboardUrl ? `${dashboardUrl}/roadmap` : null} />
    </div>
  );
}
