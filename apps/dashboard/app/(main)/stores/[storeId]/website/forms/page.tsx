import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Inbox, LayoutList } from "lucide-react";
import { listFormSubmissions, listStoreFormDefinitions, listStoreForms } from "@workspace/lib/store-forms/server";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { InPageNav } from "../domain/section-group";
import { INBOX_STATUSES, type InboxFilter } from "./forms.dto";
import { FormsList } from "./forms-list.client";
import { SubmissionsInbox } from "./submissions/submissions.client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("forms") };
}

/**
 * Website › Forms: the store's forms (#forms) and, below them, the submissions
 * inbox (#submissions; customer PII: owner only, never cached). The inbox
 * filter and page come from the URL (?form=…&status=…&page=…).
 */
export default async function StoreFormsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ form?: string; status?: string; page?: string }>;
}) {
  const [{ storeId }, query] = await Promise.all([params, searchParams]);
  const store = await loadStorePage(storeId);
  const [forms, definitions, t] = await Promise.all([
    listStoreForms(store.sellerId, store.id),
    listStoreFormDefinitions(store.sellerId, store.id),
    getTranslations("storeForms.sections"),
  ]);

  const filter: InboxFilter = {
    formId: definitions.some((f) => f.id === query.form) ? query.form! : null,
    status: INBOX_STATUSES.includes(query.status as never) ? (query.status as InboxFilter["status"]) : "all",
  };
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  const { rows, total } = await listFormSubmissions(store.sellerId, store.id, {
    ...filter,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  return (
    <>
      <InPageNav
        label={t("label")}
        items={[
          { id: "forms", label: t("forms"), icon: LayoutList },
          { id: "submissions", label: t("submissions"), icon: Inbox },
        ]}
      />
      <div id="forms" className="scroll-mt-[136px] md:scroll-mt-[88px]">
        <FormsList storeId={store.id} forms={forms} readOnly={store.status !== "active"} />
      </div>
      <div id="submissions" className="scroll-mt-[136px] md:scroll-mt-[88px]">
        <SubmissionsInbox
          storeId={store.id}
          forms={definitions.map((f) => ({ id: f.id, name: f.name, fields: f.fields.map((x) => ({ key: x.key, label: x.label })) }))}
          filter={filter}
          rows={rows}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
        />
      </div>
    </>
  );
}
