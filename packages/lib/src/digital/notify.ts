/**
 * Asks the Hono backend to email the buyer their download links
 * (`/api/emails/digital-delivery`). Only ids travel: the backend reads the
 * links, the address (an order's own email, else the account's real one),
 * the language and the store from the database. Best-effort: a failure here
 * never undoes fulfillment, so errors are logged, not thrown.
 */
export async function sendDigitalDeliveryEmail(params: {
  orderId: string;
  /** digital_orders rows of that order to include (one link per order line). */
  digitalOrderIds: string[];
}): Promise<{ success: boolean; error?: string }> {
  const backendUrl = process.env.BACKEND_API_URL;
  const apiSecret = process.env.INTERNAL_API_SECRET;

  if (!backendUrl || !apiSecret) {
    console.error(
      "sendDigitalDeliveryEmail: BACKEND_API_URL or INTERNAL_API_SECRET not configured; skipping email"
    );
    return { success: false, error: "Email backend not configured" };
  }
  if (params.digitalOrderIds.length === 0) return { success: true };

  try {
    const res = await fetch(`${backendUrl}/api/emails/digital-delivery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiSecret}`,
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("sendDigitalDeliveryEmail: backend returned error:", res.status, body);
      return { success: false, error: `Backend error ${res.status}` };
    }

    return { success: true };
  } catch (error) {
    console.error("sendDigitalDeliveryEmail: failed to reach backend:", error);
    return { success: false, error: "Failed to reach email backend" };
  }
}
