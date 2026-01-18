/**
 * Calls the ecommerce webhook to revalidate the products tag
 * This ensures product lists are updated across all apps when products change
 */
export async function revalidateProductsWebhook(): Promise<void> {
  try {
    const ecommerceUrl = process.env.NEXT_PUBLIC_ECOMMERCE_URL;
    const revalidateToken = process.env.REVALIDATE_SECRET_TOKEN;

    if (!ecommerceUrl) {
      console.warn(
        "NEXT_PUBLIC_ECOMMERCE_URL is not configured. Skipping webhook call."
      );
      return;
    }

    if (!revalidateToken) {
      console.warn(
        "REVALIDATE_SECRET_TOKEN is not configured. Skipping webhook call."
      );
      return;
    }

    const webhookUrl = `${ecommerceUrl}/api/revalidate/products`;

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${revalidateToken}`,
      },
      // Don't wait for response to avoid blocking the request
      // The webhook will process asynchronously
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(
        `Failed to revalidate products via webhook: ${response.status} ${errorText}`
      );
    }
  } catch (error) {
    // Don't throw - webhook failures shouldn't break the main operation
    console.error("Error calling revalidate products webhook:", error);
  }
}
