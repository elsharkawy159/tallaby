/**
 * Where a seller lands when Publish or the "Website live" switch is refused
 * because their stores are offline for billing (owner, 2026-11-17;
 * docs/seller-top-up-rules.md §4): the wallet, with the top-up amount focused
 * and the line "Top up your wallet to bring your store back online." above it
 * (`orderLock.goOnlineTopUp`). The refusal itself is the server's
 * (`publishStoreSite` with `refuseWhenBillingOffline`); this is only the route.
 */
export const TOP_UP_TO_GO_ONLINE_NOTICE = "store-offline";
export const TOP_UP_TO_GO_ONLINE_HREF = `/wallet?topup=1&notice=${TOP_UP_TO_GO_ONLINE_NOTICE}`;
