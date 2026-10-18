import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { listFormSubmissions, listStoreFormDefinitions } from "@workspace/lib/store-forms/server";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { INBOX_STATUSES, type InboxFilter } from "../forms.dto";
import { SubmissionsInbox } from "./submissions.client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("storeForms.tabs");
  return { title: t("submissions") };
}

/** Submissions inbox of one store (customer PII: owner only, never cached). */
export default async function StoreFormSubmissionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ form?: string; status?: string; page?: string }>;
}) {
  const [{ storeId }, query] = await Promise.all([params, searchParams]);
  const store = await loadStorePage(storeId);
  const forms = await listStoreFormDefinitions(store.sellerId, store.id);

  const filter: InboxFilter = {
    formId: forms.some((f) => f.id === query.form) ? query.form! : null,
    status: INBOX_STATUSES.includes(query.status as never) ? (query.status as InboxFilter["status"]) : "all",
  };
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  const { rows, total } = await listFormSubmissions(store.sellerId, store.id, {
    ...filter,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  return (
    <SubmissionsInbox
      storeId={store.id}
      forms={forms.map((f) => ({ id: f.id, name: f.name, fields: f.fields.map((x) => ({ key: x.key, label: x.label })) }))}
      filter={filter}
      rows={rows}
      total={total}
      page={page}
      pageSize={PAGE_SIZE}
    />
  );
}
