"use server";

/**
 * Calls the ecommerce site's revalidate API to invalidate cached product data
 * after dashboard CRUD operations. Uses ECOMMERCE_DOMAIN and REVALIDATE_SECRET.
 */
export async function revalidateEcommerce(tags: string[]): Promise<void> {
  const baseUrl =
    process.env.ECOMMERCE_DOMAIN?.replace(/\/$/, "") ||
    "https://www.tallaby.com";
  const secret = process.env.REVALIDATE_SECRET;

  if (!secret) {
    console.warn(
      "[revalidateEcommerce] REVALIDATE_SECRET not set, skipping ecommerce cache invalidation"
    );
    return;
  }

  if (!tags.length) return;

  const url = new URL("/api/revalidate", baseUrl);
  url.searchParams.set("tags", tags.join(","));

  try {
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "x-revalidate-secret": secret,
      },
      // Prevent passing secret in query string when using header
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[revalidateEcommerce] Failed:", res.status, body);
      return;
    }
  } catch (err) {
    console.error("[revalidateEcommerce] Request failed:", err);
  }
}
