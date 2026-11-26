import { PageContainer } from "@/components/seller-ui";

/**
 * Website › Forms (PLAN.md §8.4, P4-10): one page with the forms list and the
 * submissions inbox, plus the form editor. The layout awaits nothing
 * (docs/plans/dashboard-performance.md B4): every forms page checks the store
 * and the website-editor rollout gate itself (loadWebsiteStorePage: a foreign
 * store or a seller outside the rollout is a 404).
 */
export default function StoreFormsLayout({ children }: { children: React.ReactNode }) {
  return <PageContainer narrow>{children}</PageContainer>;
}
