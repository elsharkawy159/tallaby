import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { getGovernorateLabel } from "@workspace/lib/shipping";
import { formatCurrency, formatDate } from "../sellers.lib";
import type { Seller } from "../sellers.types";

type Value = React.ReactNode;

const humanize = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/^\w/, (c) => c.toUpperCase());

const yesNo = (value: boolean | null | undefined) =>
  value == null ? null : value ? "Yes" : "No";

function formatValue(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    return value.length ? value.map((v) => formatValue(v) ?? "—").join(", ") : null;
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function Row({ label, value, dir }: { label: string; value: Value; dir?: "ltr" | "rtl" }) {
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words font-medium" dir={dir}>
        {value ?? <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="divide-y">{children}</dl>
      </CardContent>
    </Card>
  );
}

/** Renders every non-empty key of a JSON column; returns null when there's nothing to show. */
function JsonSection({ title, data }: { title: string; data: unknown }) {
  const entries =
    data && typeof data === "object" && !Array.isArray(data)
      ? Object.entries(data as Record<string, unknown>)
          .map(([k, v]) => [k, formatValue(v)] as const)
          .filter(([, v]) => v !== null)
      : [];
  if (entries.length === 0) return null;

  return (
    <Section title={title}>
      {entries.map(([key, value]) => (
        <Row key={key} label={humanize(key)} value={value} />
      ))}
    </Section>
  );
}

const LEGAL_ADDRESS_KEYS = new Set(["street", "city", "state", "postalCode", "country"]);

export function SellerInfoSections({
  seller,
  ownerPhone,
}: {
  seller: Seller;
  ownerPhone: string | null;
}) {
  const address = seller.legalAddress ?? {};
  const governorate = formatValue(address.state);
  const extraAddress = Object.entries(address).filter(
    ([key, value]) => !LEGAL_ADDRESS_KEYS.has(key) && formatValue(value) !== null
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Section title="Business information">
        <Row label="Business name" value={seller.businessName} />
        <Row label="Display name" value={seller.displayName} />
        <Row label="Business type" value={humanize(seller.businessType)} />
        <Row label="Description" value={seller.description || seller.storeDescription} />
        <Row label="Tax ID" value={seller.taxId} />
        <Row label="Registration number" value={seller.registrationNumber} />
        <Row label="Support email" value={seller.supportEmail} dir="ltr" />
        <Row label="Support phone" value={seller.supportPhone} dir="ltr" />
        <Row label="Owner phone" value={ownerPhone} dir="ltr" />
      </Section>

      <Section title="Legal address">
        <Row label="Street" value={formatValue(address.street)} />
        <Row label="City" value={formatValue(address.city)} />
        <Row
          label="Governorate"
          value={
            governorate
              ? `${getGovernorateLabel(governorate, "en")} · ${getGovernorateLabel(governorate, "ar")}`
              : null
          }
        />
        <Row label="Postal code" value={formatValue(address.postalCode)} />
        <Row label="Country" value={formatValue(address.country)} />
        {extraAddress.map(([key, value]) => (
          <Row key={key} label={humanize(key)} value={formatValue(value)} />
        ))}
      </Section>

      <Section title="Account & verification">
        <Row label="Verified store" value={yesNo(seller.isVerified)} />
        <Row label="Identity verified" value={yesNo(seller.identityVerified)} />
        <Row
          label="Identity documents"
          value={
            seller.identityDocsUrl ? (
              <a
                href={seller.identityDocsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Open documents
              </a>
            ) : null
          }
        />
        <Row
          label="Onboarding"
          value={
            seller.onboardingComplete
              ? "Complete"
              : seller.onboardingStep != null
                ? `In progress (step ${seller.onboardingStep})`
                : null
          }
        />
        <Row label="Seller level" value={humanize(seller.sellerLevel)} />
        <Row label="Joined" value={seller.joinDate ? formatDate(seller.joinDate) : null} />
        <Row label="Last updated" value={seller.updatedAt ? formatDate(seller.updatedAt) : null} />
        <Row label="Approved categories" value={formatValue(seller.approvedCategories)} />
        <Row label="Fulfillment options" value={formatValue(seller.fulfillmentOptions)} />
      </Section>

      <Section title="Payouts & commission">
        <Row
          label="Commission"
          value={seller.isCommissionExempt ? "Exempt" : `${seller.commissionRate}%`}
        />
        <Row label="Free delivery" value={yesNo(seller.freeDelivery)} />
        <Row label="Payouts enabled" value={yesNo(seller.payoutEnabled)} />
        <Row label="Payout schedule" value={humanize(seller.payoutSchedule)} />
        <Row
          label="Last payout"
          value={
            seller.lastPayoutDate
              ? `${formatCurrency(seller.lastPayoutAmount ?? 0)} on ${formatDate(seller.lastPayoutDate)}`
              : null
          }
        />
        <Row label="Stripe account" value={seller.stripeAccountId} dir="ltr" />
        <Row label="Stripe onboarding" value={yesNo(seller.stripeOnboardingComplete)} />
      </Section>

      {(seller.returnPolicy || seller.shippingPolicy) && (
        <Section title="Policies">
          <Row
            label="Return policy"
            value={seller.returnPolicy && <span className="whitespace-pre-line">{seller.returnPolicy}</span>}
          />
          <Row
            label="Shipping policy"
            value={seller.shippingPolicy && <span className="whitespace-pre-line">{seller.shippingPolicy}</span>}
          />
        </Section>
      )}

      <JsonSection title="Payment details" data={seller.paymentDetails} />
      <JsonSection title="Tax information" data={seller.taxInformation} />
      <JsonSection title="Verification details" data={seller.verificationDetails} />
      <JsonSection title="Fee structure" data={seller.feeStructure} />
      <JsonSection title="External IDs" data={seller.externalIds} />
    </div>
  );
}
