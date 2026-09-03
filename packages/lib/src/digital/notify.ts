/**
 * Fires the digital-delivery email via the Hono backend. Best-effort: a
 * failure here must never roll back fulfillment (the buyer still has access
 * via "My Digital Products"), so errors are logged, not thrown.
 */
export async function sendDigitalDeliveryEmail(params: {
  email: string;
  name: string;
  orderNumber: string;
  preferredLanguage?: string | null;
  items: Array<{
    productName: string;
    downloadUrl: string;
    licenseKey?: string | null;
    expiresAt?: string | null;
    maxDownloads?: number | null;
  }>;
}) {
  const backendUrl = process.env.BACKEND_API_URL;
  const apiSecret = process.env.INTERNAL_API_SECRET;

  if (!backendUrl || !apiSecret) {
    console.error(
      "sendDigitalDeliveryEmail: BACKEND_API_URL or INTERNAL_API_SECRET not configured; skipping email"
    );
    return { success: false, error: "Email backend not configured" };
  }

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
