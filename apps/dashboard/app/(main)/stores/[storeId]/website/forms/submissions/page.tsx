import { redirect } from "next/navigation";

/** Old Submissions tab URL: the inbox is now a section of the single Forms page (filters kept). */
export default async function StoreFormSubmissionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ storeId }, query] = await Promise.all([params, searchParams]);
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    for (const v of Array.isArray(value) ? value : value === undefined ? [] : [value]) search.append(key, v);
  }
  const qs = search.toString();
  redirect(`/stores/${encodeURIComponent(storeId)}/website/forms${qs ? `?${qs}` : ""}#submissions`);
}
