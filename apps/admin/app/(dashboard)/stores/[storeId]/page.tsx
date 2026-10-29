import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CreditCard,
  ExternalLink,
  FileText,
  Globe,
  History,
  Package,
  PencilRuler,
  Plug,
  ShoppingCart,
  Store,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { isAdminWriteRole } from "@workspace/lib/admin";
import {
  getStoreForAdmin,
  getStoreTabCounts,
} from "@workspace/lib/admin/server";
import { storeUrl } from "@workspace/lib/storefront";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { ordersHref } from "../../_components/entity/entity-href.lib";
import { IdentityHeader } from "../../_components/entity/identity-header";
import { accountChips } from "../../_components/entity/relation-chips.lib";
import { getAccountRelations } from "../../_components/entity/relations.server";
import { SiteStatusBadge, StoreStatusBadge } from "../stores.lib";
import { StoreSectionNav, type StoreNavItem } from "./store-section-nav.client";
import {
  StoreAuditSection,
  StoreCatalogSection,
  StoreCommerceSection,
  StoreContentSection,
  StoreFormsSection,
  StoreIntegrationsSection,
  StoreMediaSection,
  StoreOverviewSection,
  StoreWebsiteSection,
} from "./store-sections";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ storeId: string }>;
}

/**
 * One store on one page (docs/admin-saas.md §3.3), grouped by what an admin
 * looks after: the store, its website, products, payments and shipping,
 * integrations, content and activity. Each group streams in on its own, so a
 * slow query never holds up the rest. Section ids are the old `?tab=` keys.
 */
export default async function StoreDetailPage({ params }: PageProps) {
  const { storeId } = await params;
  const admin = await getCurrentAdminUser();
  const [store, counts] = await Promise.all([
    getStoreForAdmin(storeId),
    getStoreTabCounts(storeId).catch(() => null),
  ]);
  if (!store) notFound();
  const owner = await getAccountRelations(store.sellerId).catch(() => null);
  const canWrite = isAdminWriteRole(admin.role);
  const activeDomain =
    store.domains.find((domain) => domain.status === "active")?.domain ?? null;

  const nav: StoreNavItem[] = [
    { id: "overview", label: "Store" },
    { id: "website", label: "Website", count: counts?.pages },
    { id: "catalog", label: "Products" },
    { id: "commerce", label: "Payments & shipping" },
    {
      id: "integrations",
      label: "Integrations",
      count: counts?.integrationErrors,
      alert: true,
    },
    {
      id: "content",
      label: "Forms & content",
      count: counts ? counts.forms + counts.content : undefined,
    },
    { id: "audit", label: "Activity" },
  ];

  return (
    <div className="space-y-6">
      <IdentityHeader
        back={{ href: "/stores", label: "Stores" }}
        title={store.name}
        avatar={{
          kind: "store",
          name: store.name,
          src: store.logoUrl,
          seed: store.id,
        }}
        badges={
          <>
            <SiteStatusBadge status={store.siteStatus} />
            <StoreStatusBadge status={store.status} />
          </>
        }
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1" dir="ltr">
              <Globe className="size-3.5" aria-hidden />
              {activeDomain ?? store.subdomain}
            </span>
            <span className="capitalize">{store.plan} plan</span>
            {store.isPrimary ? <span>Primary store</span> : null}
          </span>
        }
        relations={
          owner
            ? accountChips(owner, {
                personRole: "Owner",
                excludeStoreId: store.id,
                omit: ["orders"],
              }).concat({
                href: ordersHref({ store: store.id }),
                role: "Orders",
                name: "Placed in this store",
                icon: ShoppingCart,
              })
            : []
        }
        actions={
          <>
            {canWrite && (
              <Button asChild size="sm">
                <Link href={`/stores/${storeId}/editor`}>
                  <PencilRuler className="mr-1 h-3.5 w-3.5" />
                  Edit website
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" size="sm">
              <a
                href={storeUrl(store.subdomain, activeDomain)}
                target="_blank"
                rel="noreferrer"
              >
                Open storefront
                <ExternalLink className="ml-1 h-3.5 w-3.5" />
              </a>
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[11rem_minmax(0,1fr)] xl:gap-10">
        <aside>
          <StoreSectionNav items={nav} />
        </aside>

        <div className="min-w-0 space-y-12">
          <PageSection
            id="overview"
            icon={Store}
            title="Store"
            description="Domain, wallet, owner and store-level actions."
          >
            <Streamed>
              <StoreOverviewSection store={store} canWrite={canWrite} />
            </Streamed>
          </PageSection>

          <PageSection
            id="website"
            icon={Globe}
            title="Website"
            description="Theme, store details, brand, social links, SEO, pages and published revisions."
          >
            <Streamed>
              <StoreWebsiteSection store={store} canWrite={canWrite} />
            </Streamed>
          </PageSection>

          <PageSection
            id="catalog"
            icon={Package}
            title="Products"
            description="Which of the seller's products this store sells."
          >
            <Streamed>
              <StoreCatalogSection store={store} />
            </Streamed>
          </PageSection>

          <PageSection
            id="commerce"
            icon={CreditCard}
            title="Payments & shipping"
            description="Payment methods offered at checkout and the store's delivery zones."
          >
            <Streamed>
              <StoreCommerceSection store={store} />
            </Streamed>
          </PageSection>

          <PageSection
            id="integrations"
            icon={Plug}
            title="Integrations"
            description="Pixels, analytics and other connected services."
          >
            <Streamed>
              <StoreIntegrationsSection store={store} />
            </Streamed>
          </PageSection>

          <PageSection
            id="content"
            icon={FileText}
            title="Forms & content"
            description="Forms, blog and CMS items, and uploaded media."
          >
            <div className="space-y-6">
              <div id="forms" className="scroll-mt-4">
                <Streamed>
                  <StoreFormsSection store={store} />
                </Streamed>
              </div>
              <div id="blog" className="scroll-mt-4">
                <Streamed>
                  <StoreContentSection store={store} />
                </Streamed>
              </div>
              <div id="media" className="scroll-mt-4">
                <Streamed>
                  <StoreMediaSection store={store} />
                </Streamed>
              </div>
            </div>
          </PageSection>

          <PageSection
            id="audit"
            icon={History}
            title="Activity"
            description="Admin actions on this store and the seller's settings changes."
          >
            <Streamed>
              <StoreAuditSection store={store} />
            </Streamed>
          </PageSection>
        </div>
      </div>
    </div>
  );
}

/** One group on the page. The heading renders at once; the body streams in (`Streamed`). */
function PageSection({
  id,
  icon: Icon,
  title,
  description,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-4 space-y-4"
    >
      <header className="flex items-start gap-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border bg-background text-muted-foreground">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2
            id={`${id}-title`}
            className="text-lg font-semibold leading-tight tracking-tight"
          >
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function Streamed({ children }: { children: ReactNode }) {
  return <Suspense fallback={<SectionSkeleton />}>{children}</Suspense>;
}

function SectionSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 py-6">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
