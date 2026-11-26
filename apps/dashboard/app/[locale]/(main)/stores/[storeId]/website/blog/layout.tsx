import { PageContainer } from "@/components/seller-ui";

/**
 * Website › Blog frame. It awaits nothing (docs/plans/dashboard-performance.md
 * B4): every blog page checks the store and the store-builder rollout itself
 * (loadWebsiteStorePage: a foreign store or a seller outside the rollout is a 404).
 */
export default function StoreBlogLayout({ children }: { children: React.ReactNode }) {
  return <PageContainer narrow>{children}</PageContainer>;
}
