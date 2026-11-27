import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

/** Products › Trash moved to Store settings › Trash (owner, 2026-11-27); old links land there. */
export default async function ProductTrashRedirect({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  redirect({ href: `/stores/${encodeURIComponent(storeId)}/settings/trash`, locale: await getLocale() });
}
