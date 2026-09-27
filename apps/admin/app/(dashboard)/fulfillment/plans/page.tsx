import { getFulfillmentPlans } from "../fulfillment.server";
import { PlansClient } from "./plans.client";

export const dynamic = "force-dynamic";

export default async function FulfillmentPlansPage() {
  const plans = await getFulfillmentPlans();
  return <PlansClient plans={plans} />;
}
