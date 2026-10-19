import { Suspense } from "react";
import { COUPON_STATES, firstParam, parseAdminListParams, pickEnum } from "@workspace/lib/admin";
import { UrlTabs, pickTab } from "../_components/url-tabs";
import { CouponsData } from "./coupons.data";
import { CouponsSkeleton } from "./coupons.skeleton";
import { ScopedCouponsData } from "./seller-coupons.data";
import type { CouponsPageProps } from "./coupons.types";

export const dynamic = "force-dynamic";

const TABS = ["platform", "sellers", "affiliates"] as const;

/** Platform coupons (CRUD), every seller's coupons and affiliate coupons (docs/admin-saas.md §3.2). */
export default async function CouponsPage({ searchParams }: CouponsPageProps) {
  const params = await searchParams;
  const tab = pickTab(params.tab, TABS);
  const { q, page } = parseAdminListParams(params);
  const state = pickEnum(params.state, COUPON_STATES);
  const seller = firstParam(params.seller);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Coupons</h1>
        <p className="text-sm text-muted-foreground">
          Platform coupons are managed here. Seller coupons can be switched off or back on with a logged
          reason; sellers edit them in their dashboard.
        </p>
      </div>
      <UrlTabs
        baseHref="/coupons"
        active={tab}
        tabs={[
          { key: "platform", label: "Platform" },
          { key: "sellers", label: "Sellers" },
          { key: "affiliates", label: "Affiliates" },
        ]}
      />
      {tab === "platform" ? (
        <CouponsData searchParams={Promise.resolve(params)} />
      ) : (
        <Suspense key={JSON.stringify({ tab, q, page, state, seller })} fallback={<CouponsSkeleton />}>
          <ScopedCouponsData
            scope={tab === "sellers" ? "seller" : "affiliate"}
            q={q}
            state={state}
            sellerId={seller}
            page={page}
          />
        </Suspense>
      )}
    </div>
  );
}
