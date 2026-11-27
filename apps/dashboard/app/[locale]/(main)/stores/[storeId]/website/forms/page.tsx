import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Inbox, LayoutList, ShoppingBag } from "lucide-react";
import { listFormSubmissions, listStoreFormDefinitions, listStoreForms } from "@workspace/lib/store-forms/server";
import { parseStoreCheckoutForm, visibleCheckoutFields } from "@workspace/lib/stores/checkout-form";
import { PageHeader } from "@/components/seller-ui";
import { loadWebsiteStorePage } from "@/lib/stores/website-page.server";
import { SiteOfflineNote } from "../_components/site-offline-note";
import { InPageNav } from "../_components/section-group";
import { BUILT_IN_FORM_KINDS, parseBuiltInFormPointers, resolveBuiltInForms } from "./built-in-forms.lib";
import { BuiltInForms } from "./built-in-forms.client";
import { INBOX_STATUSES, type InboxFilter } from "./forms.dto";
import { FormsList } from "./forms-list.client";
import { SubmissionsInbox } from "./submissions/submissions.client";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const PAGE_SIZE = 25;

/** The checkout's fixed delivery fields (name, phone, governorate and area, address). */
const CHECKOUT_FIXED_FIELDS = 4;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("forms") };
}

/**
 * Website › Forms: the forms the storefront already has (#built-in: checkout,
 * newsletter, contact), the seller's own forms (#forms) and, below them, the
 * submissions inbox (#submissions; customer PII: owner only, never cached).
 * The inbox filter and page come from the URL (?form=…&status=…&page=…).
 */
export default async function StoreFormsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ form?: string; status?: string; page?: string }>;
}) {
  const [{ storeId }, query] = await Promise.all([params, searchParams]);
  const store = await loadWebsiteStorePage(storeId);
  const [forms, definitions, t, tNav, tw] = await Promise.all([
    listStoreForms(store.sellerId, store.id),
    listStoreFormDefinitions(store.sellerId, store.id),
    getTranslations("storeForms.sections"),
    getTranslations("nav"),
    getTranslations("sellerWebsite.forms"),
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

  const pointers = parseBuiltInFormPointers(store.settings);
  const builtIn = resolveBuiltInForms(pointers, definitions);
  const builtInIds = new Set(Object.values(builtIn).map((f) => f.id));
  const summaries = new Map(forms.map((f) => [f.id, f]));
  const cards = BUILT_IN_FORM_KINDS.map((kind) => {
    const summary = builtIn[kind] && summaries.get(builtIn[kind].id);
    return {
      kind,
      pinned: !!summary && pointers[kind] === summary.id,
      form: summary
        ? { id: summary.id, status: summary.status, fieldCount: summary.fieldCount, submissionCount: summary.submissionCount, newCount: summary.newCount }
        : null,
    };
  });
  const checkoutFieldCount = CHECKOUT_FIXED_FIELDS + visibleCheckoutFields(parseStoreCheckoutForm(store.settings)).length;
  const readOnly = store.status !== "active";

  return (
    <>
      <PageHeader className="sui-rise" title={tNav("forms")} description={tw("description")} />
      <SiteOfflineNote storeId={store.id} siteStatus={store.siteStatus} />
      <InPageNav
        label={t("label")}
        items={[
          { id: "built-in", label: t("builtIn"), icon: ShoppingBag },
          { id: "forms", label: t("forms"), icon: LayoutList },
          { id: "submissions", label: t("submissions"), icon: Inbox },
        ]}
      />
      <div id="built-in" className="flex scroll-mt-24 flex-col gap-3.5">
        <BuiltInForms storeId={store.id} readOnly={readOnly} checkoutFieldCount={checkoutFieldCount} cards={cards} />
      </div>
      <div id="forms" className="flex scroll-mt-24 flex-col gap-3.5">
        <FormsList storeId={store.id} forms={forms.filter((f) => !builtInIds.has(f.id))} readOnly={readOnly} />
      </div>
      <div id="submissions" className="flex scroll-mt-24 flex-col gap-3.5">
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
