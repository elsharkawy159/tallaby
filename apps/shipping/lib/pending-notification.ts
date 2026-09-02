/**
 * Detects realtime payloads that add an item to the admin "Pending" queue.
 *
 * Pending = order.status is `pending` and payment is not yet paid/collected
 * (COD / awaiting payment). Matches stageConditions("pending") in orders.query.ts.
 *
 * New website orders arrive as `order` INSERT events — shipments are often
 * created later, so shipment-only detection would miss them.
 */

function isUnpaidPendingOrder(
  status: unknown,
  paymentStatus: unknown
): boolean {
  return (
    status === "pending" &&
    paymentStatus !== "paid" &&
    paymentStatus !== "collected"
  );
}

/** A new or updated order that should appear in the Pending tab. */
export function isNewPendingOrder(
  payload: Record<string, unknown>
): boolean {
  const op = payload.op;
  if (op !== "INSERT" && op !== "UPDATE") return false;

  return isUnpaidPendingOrder(payload.status, payload.paymentStatus);
}

/** A newly created shipment row in pending status. */
export function isNewPendingShipment(
  payload: Record<string, unknown>
): boolean {
  return payload.op === "INSERT" && payload.status === "pending";
}
