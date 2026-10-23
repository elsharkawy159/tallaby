import Link from "next/link";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { logServerError } from "@workspace/db/log";
import { getPlatformSettingsForAdmin, type AdminPlatformSettings } from "@workspace/lib/admin/server";
import { FEE_TRIAL_DAYS, STANDARD_FEE_MIN_PIASTRES } from "@workspace/lib/orders/platform-fee";
import { DEFAULT_PLAN, PLANS, type PlanId } from "@workspace/lib/plans";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { AdminTable, type AdminTableColumn } from "../_components/admin-table/admin-table";
import { formatAdminDate, localizedText } from "../stores/stores.lib";

export const dynamic = "force-dynamic";

const TEAM_COLUMNS: AdminTableColumn[] = [
  { id: "name", header: "Admin", sortable: true },
  { id: "status", header: "Status", sortable: true },
  { id: "lastLoginAt", header: "Last sign-in", sortable: true, descFirst: true },
  { id: "createdAt", header: "Added", sortable: true, descFirst: true },
];

const PLAN_COLUMNS: AdminTableColumn[] = [
  { id: "plan", header: "Plan" },
  { id: "maxStores", header: "Stores", align: "end" },
  { id: "aiCredits", header: "AI credits / month", align: "end" },
  { id: "features", header: "Features" },
];

const FEATURE_LABELS: Record<string, string> = {
  customDomain: "Custom domain",
  ai: "AI tools",
  advancedSettings: "Advanced settings",
  removeTallabyBadge: "Remove Tallaby badge",
};

/**
 * Services the admin app talks to, from its environment. Only whether each is
 * set is shown; values never leave the server (the two app URLs are public).
 */
function serviceStatus() {
  const set = (...keys: string[]) => keys.every((key) => Boolean(process.env[key]?.trim()));
  return [
    { name: "Database", detail: "Shared Postgres (Supabase)", ok: set("DATABASE_URL") },
    { name: "Supabase auth", detail: "Admin sign-in", ok: set("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY") },
    { name: "Supabase service role", detail: "Storage uploads and admin-only reads", ok: set("SUPABASE_SERVICE_ROLE_KEY") },
    {
      name: "Cache refresh",
      detail: "Admin changes show on the storefront and dashboard at once",
      ok: set("ECOMMERCE_URL", "DASHBOARD_URL", "REVALIDATE_SECRET"),
      urls: [process.env.ECOMMERCE_URL, process.env.DASHBOARD_URL].filter((url): url is string => Boolean(url)),
    },
    {
      name: "Vercel domains",
      detail: "Re-check and remove custom domains",
      ok: set("STOREFRONT_VERCEL_PROJECT_ID", "STOREFRONT_VERCEL_TOKEN"),
    },
  ];
}

/**
 * Platform settings as they are today: the signed-in admin, the admin team,
 * the business rules that live in code (plans, fee, trial) and which services
 * are configured. Read-only; each rule links to where it is changed.
 */
export default async function SettingsPage() {
  const me = await getCurrentAdminUser();
  let data: AdminPlatformSettings;
  try {
    data = await getPlatformSettingsForAdmin();
  } catch (error) {
    logServerError("admin", "settings load failed", {}, error);
    return <p className="text-sm text-destructive">Settings could not be loaded. Try again.</p>;
  }
  const services = serviceStatus();
  const fee = STANDARD_FEE_MIN_PIASTRES / 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Your account, the admin team and the rules every seller is on. Plans, the fee and the trial are set in code
          (PLAN.md §13), so they are shown here, not edited.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your account</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Name</dt>
              <dd>{me.fullName?.trim() || "—"}</dd>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="break-all" dir="ltr">
                {me.email}
              </dd>
              <dt className="text-muted-foreground">Role</dt>
              <dd className="capitalize">{me.role.replace(/_/g, " ")}</dd>
              <dt className="text-muted-foreground">Member since</dt>
              <dd>{formatAdminDate(me.createdAt)}</dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Seller fee</CardTitle>
            <CardDescription>Taken from the store wallet when an order is delivered.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Fee</dt>
              <dd>EGP {fee.toLocaleString()} per seller per delivered order, shipping excluded</dd>
              <dt className="text-muted-foreground">Free trial</dt>
              <dd>
                {FEE_TRIAL_DAYS} days from the seller&apos;s first store
              </dd>
              <dt className="text-muted-foreground">Wallets</dt>
              <dd>
                <Link href="/wallets" className="hover:underline">
                  Store wallets
                </Link>{" "}
                ·{" "}
                <Link href="/store-top-ups" className="hover:underline">
                  Top-ups
                </Link>
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Sellers</dt>
              <dd className="tabular-nums">
                <Link href="/sellers" className="hover:underline">
                  {data.counts.sellers.toLocaleString()}
                </Link>
              </dd>
              <dt className="text-muted-foreground">Stores</dt>
              <dd className="tabular-nums">
                <Link href="/stores" className="hover:underline">
                  {data.counts.stores.toLocaleString()}
                </Link>
              </dd>
              <dt className="text-muted-foreground">Templates shown</dt>
              <dd className="tabular-nums">{data.counts.templates.toLocaleString()}</dd>
              <dt className="text-muted-foreground">Default template</dt>
              <dd>
                <Link href="/templates" className="hover:underline">
                  {data.defaultTemplate ? localizedText(data.defaultTemplate.name) : "None set"}
                </Link>
              </dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seller plans</CardTitle>
          <CardDescription>
            New sellers start on {planName(DEFAULT_PLAN)}. A seller&apos;s store
            limit can be raised on their page (audited).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminTable
            columns={PLAN_COLUMNS}
            rows={(Object.keys(PLANS) as PlanId[]).map((id) => {
              const plan = PLANS[id];
              const features = Object.entries(FEATURE_LABELS).filter(([key]) => plan[key as keyof typeof plan]);
              return {
                id,
                cells: {
                  plan: (
                    <span className="font-medium">
                      {planName(id)}
                      {id === DEFAULT_PLAN && (
                        <Badge variant="outline" className="ml-2 font-normal">
                          Default
                        </Badge>
                      )}
                    </span>
                  ),
                  maxStores: <span className="tabular-nums">{plan.maxStores}</span>,
                  aiCredits: <span className="tabular-nums">{plan.aiCreditsMonthly}</span>,
                  features: (
                    <div className="flex flex-wrap gap-1">
                      {features.length
                        ? features.map(([key, label]) => (
                            <Badge key={key} variant="secondary" className="font-normal">
                              {label}
                            </Badge>
                          ))
                        : "—"}
                    </div>
                  ),
                },
              };
            })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Admin team</CardTitle>
          <CardDescription>Users with access to this admin app.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminTable
            columns={TEAM_COLUMNS}
            defaultSort={{ id: "createdAt", desc: false }}
            emptyMessage="No admins."
            rows={data.team.map((admin) => ({
              id: admin.id,
              sortValues: {
                name: admin.fullName || admin.email,
                status: admin.isSuspended ? 0 : admin.isVerified ? 2 : 1,
                lastLoginAt: admin.lastLoginAt,
                createdAt: admin.createdAt,
              },
              cells: {
                name: (
                  <div>
                    <div className="font-medium">
                      {admin.fullName || admin.email || "Admin"}
                      {admin.id === me.id && (
                        <Badge variant="outline" className="ml-2 font-normal">
                          You
                        </Badge>
                      )}
                    </div>
                    {admin.fullName && admin.email && (
                      <div className="text-xs text-muted-foreground" dir="ltr">
                        {admin.email}
                      </div>
                    )}
                  </div>
                ),
                status: (
                  <Badge variant="outline" className="font-normal">
                    {admin.isSuspended ? "Suspended" : admin.isVerified ? "Active" : "Not verified"}
                  </Badge>
                ),
                lastLoginAt: <span className="text-sm text-muted-foreground">{formatAdminDate(admin.lastLoginAt)}</span>,
                createdAt: <span className="text-sm text-muted-foreground">{formatAdminDate(admin.createdAt)}</span>,
              },
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connected services</CardTitle>
          <CardDescription>Whether each service this app needs is configured. Secret values are never shown.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y text-sm">
            {services.map((service) => (
              <li key={service.name} className="flex flex-wrap items-start justify-between gap-2 py-2.5">
                <div>
                  <div className="font-medium">{service.name}</div>
                  <div className="text-xs text-muted-foreground">{service.detail}</div>
                  {service.urls?.map((url) => (
                    <div key={url} className="font-mono text-xs text-muted-foreground" dir="ltr">
                      {url}
                    </div>
                  ))}
                </div>
                <Badge
                  variant="outline"
                  className={
                    service.ok
                      ? "border-green-200 bg-green-100 font-normal text-green-900"
                      : "border-amber-200 bg-amber-100 font-normal text-amber-900"
                  }
                >
                  {service.ok ? "Configured" : "Not set"}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function planName(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}
