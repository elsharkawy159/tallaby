import { FormCardSkeleton } from "../../../_components/page.skeletons";

/* Below the settings layout (page header and tabs stay), so only the tab content. */
export default function Loading() {
  return (
    <>
      <FormCardSkeleton rows={3} />
      <FormCardSkeleton rows={2} />
    </>
  );
}
