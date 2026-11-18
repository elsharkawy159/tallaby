import { piastresToAmount } from "@workspace/lib/tallaby-pay";
import { Card, CardContent } from "@workspace/ui/components/card";
import { loadTallabyPaySettings } from "../tallaby-pay.data";
import { LoadError } from "../tallaby-pay.ui";
import { TallabyPaySettingsEditor } from "./settings.client";

export const dynamic = "force-dynamic";

/** Fee, hold days, minimum withdrawal (billing_settings, 0175) and the launch switch. Same permission as Billing. */
export default async function TallabyPaySettingsPage() {
  const result = await loadTallabyPaySettings();
  if (!result.data) return <LoadError error={result.error} />;
  const s = result.data;
  return (
    <Card>
      <CardContent className="py-6">
        <TallabyPaySettingsEditor
          initial={{ feeBps: s.feeBps, holdDays: s.holdDays, minPayout: piastresToAmount(s.minPayoutPiastres), live: s.live }}
        />
      </CardContent>
    </Card>
  );
}
