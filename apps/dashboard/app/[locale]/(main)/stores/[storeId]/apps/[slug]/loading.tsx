import { FormCardSkeleton } from "../../../../_components/page.skeletons";

/* Below the app layout (its header and tabs stay), so only the tab content. */
export default function Loading() {
  return <FormCardSkeleton rows={3} />;
}
