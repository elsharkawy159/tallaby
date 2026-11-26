import { PageSkeleton } from "./_components/page.skeletons";

/* Neutral fallback for every (main) page without its own loading.tsx; the home page has its own in (home). */
export default function Loading() {
  return <PageSkeleton />;
}
