import { storeUrl } from "@workspace/lib/storefront";
import { fetchSellerSettings } from "./seller-settings.server";
import type { SellerSettingsInitialData } from "./seller-settings.types";
import { SellerSettingsForm } from "./seller-settings.client";
import { StoreLinkSection } from "./store-link.client";
import { CustomDomainSection } from "./custom-domain.client";
import { getCustomDomain } from "@/actions/custom-domain";
import { getSellerAccountView } from "@workspace/lib/sellers/server";
import { getPrimaryStore } from "@workspace/lib/stores/server";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { DomainPageLink } from "./domain-page-link";
import { PushAlertsSection } from "./push-alerts.client";
import { getSellerPushPrefs, getVapidPublicKey } from "@/lib/push/push-alerts.server";
import { getSellerAccountDeletion } from "@workspace/lib/account-deletion/server";
import { AccountDeletionSection } from "./account-deletion.client";

export async function SellerSettingsData() {
  const seller = await requireSeller();
  // Phone alerts (F-06) only when the VAPID keys are set.
  const vapidPublicKey = getVapidPublicKey();
  const [{ profile, documents, error }, account, primaryStore, pushPrefs, deletion] = await Promise.all([
    fetchSellerSettings(),
    getSellerAccountView(seller.sellerId),
    getPrimaryStore(seller.sellerId),
    // A failed read (e.g. 0124 not applied yet) hides the card, never the page.
    vapidPublicKey ? getSellerPushPrefs(seller.sellerId).catch(() => null) : Promise.resolve(null),
    // Delete my account (F-82): a failed read (0157 not applied yet) hides the card, never the page.
    getSellerAccountDeletion(seller.userId).then(
      (request) => ({ ok: true as const, request }),
      () => ({ ok: false as const, request: null }),
    ),
  ]);
  // The primary store's domain; every store's lives on Website › Domain & SEO (P4-14).
  const customDomainRes = primaryStore ? await getCustomDomain(primaryStore.id) : null;
  const customDomain = customDomainRes?.success ? customDomainRes.domain : null;
  if (error || !profile || !account) {
    throw new Error(error || "Failed to load seller settings");
  }
  const liveDomain = customDomain?.status === "active" ? customDomain.domain : null;
  const initial: SellerSettingsInitialData = {
    profile: {
      id: profile.id,
      businessName: profile.businessName,
      displayName: profile.displayName,
      description: profile.description,
      logoUrl: profile.logoUrl,
      bannerUrl: profile.bannerUrl,
      supportEmail: profile.supportEmail,
      supportPhone: profile.supportPhone,
      returnPolicy: profile.returnPolicy,
      shippingPolicy: profile.shippingPolicy,
      privacyPolicy: profile.privacyPolicy,
    },
    documents: (documents ?? []).map((doc) => ({
      id: doc.id,
      sellerId: doc.sellerId,
      documentType: doc.documentType,
      fileUrl: doc.fileUrl,
      expiryDate: doc.expiryDate,
      status: doc.status,
      uploadedAt: doc.uploadedAt,
    })),
  }
  return (
    <SellerSettingsForm
      initialData={initial}
      storeHref={storeUrl(profile.subdomain, liveDomain)}
      account={account}
      primaryStoreId={primaryStore?.id ?? null}
      accountDeletionSection={deletion.ok ? <AccountDeletionSection initial={deletion.request} /> : null}
      pushAlertsSection={
        vapidPublicKey && pushPrefs ? <PushAlertsSection publicKey={vapidPublicKey} initialPrefs={pushPrefs} /> : null
      }
      linkSection={
        primaryStore ? (
          <>
            <StoreLinkSection
              storeId={primaryStore.id}
              initialSubdomain={primaryStore.subdomain}
              customDomain={liveDomain}
              siteStatus={primaryStore.siteStatus}
            />
                        <CustomDomainSection storeId={primaryStore.id} initial={customDomain} />
            <DomainPageLink storeId={primaryStore.id} />
          </>
        ) : null
      }
    />
  )
}
