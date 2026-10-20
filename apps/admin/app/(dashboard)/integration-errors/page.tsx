import { redirect } from "next/navigation";

/** Moved into the integrations hub (docs/admin-saas.md §3.5). Kept so old links still work. */
export default function IntegrationErrorsPage() {
  redirect("/integrations?tab=errors");
}
