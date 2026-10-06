"use client";

import { useState } from "react";
import { Check, CircleCheckBig, ImageOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import type { AdRequestRow } from "@/actions/ads";
import { AD_PACKAGES, type AdPackageKey } from "@/lib/ad-packages";
import { AdPackageCard } from "./ad-package-card";
import { AdRequestsList } from "./ad-requests-list";
import { PaymentPanel } from "./payment-panel";
import { ProductPicker, type AdProductOption } from "./product-picker";

type Props = {
  products: AdProductOption[];
  requests: AdRequestRow[];
};

export function AdvertiseProducts({ products, requests }: Props) {
  const t = useTranslations("advertise");
  const [packageKey, setPackageKey] = useState<AdPackageKey | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const pkg = AD_PACKAGES.find((p) => p.key === packageKey) ?? null;
  const product = products.find((p) => p.id === productId) ?? null;

  const reset = () => {
    setProductId(null);
    setSubmitted(false);
  };

  return (
    <div className="space-y-10">
      <p className="max-w-2xl text-muted-foreground">{t("intro")}</p>

      {submitted ? (
        <div
          role="status"
          className="flex flex-col items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-6"
        >
          <CircleCheckBig className="size-8 text-primary" aria-hidden />
          <h2 className="text-xl font-bold">{t("success.title")}</h2>
          <p className="max-w-xl text-sm text-muted-foreground">{t("success.body")}</p>
          <Button variant="outline" onClick={reset}>
            {t("success.again")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <ol className="space-y-8">
            <Step index={1} title={t("steps.package")} done={!!pkg} active>
              <div className="space-y-4">
                {AD_PACKAGES.map((p) => (
                  <AdPackageCard
                    key={p.key}
                    pkg={p}
                    selected={p.key === packageKey}
                    onSelect={() => setPackageKey(p.key)}
                  />
                ))}
              </div>
            </Step>

            <Step index={2} title={t("steps.product")} done={!!product} active={!!pkg}>
              {pkg && (
                <ProductPicker
                  products={products}
                  selectedId={productId}
                  onSelect={setProductId}
                />
              )}
            </Step>

            <Step index={3} title={t("steps.payment")} done={false} active={!!pkg && !!product} last>
              {pkg && product && (
                <PaymentPanel
                  pkg={pkg}
                  productId={product.id}
                  onSubmitted={() => setSubmitted(true)}
                />
              )}
            </Step>
          </ol>

          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-4 rounded-2xl border bg-card p-5">
              <h2 className="font-bold">{t("summary.title")}</h2>
              <dl className="space-y-4 text-sm">
                <div className="space-y-1">
                  <dt className="text-xs text-muted-foreground">{t("summary.package")}</dt>
                  <dd className="font-medium">
                    {pkg ? t(`package.${pkg.key}.name`) : (
                      <span className="text-muted-foreground">{t("summary.none")}</span>
                    )}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs text-muted-foreground">{t("summary.product")}</dt>
                  <dd>
                    {product ? (
                      <div className="flex items-center gap-2.5">
                        <div className="size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                          {product.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.image} alt="" className="size-full object-cover" />
                          ) : (
                            <span className="flex size-full items-center justify-center text-muted-foreground">
                              <ImageOff className="size-4" aria-hidden />
                            </span>
                          )}
                        </div>
                        <span className="line-clamp-2 font-medium">{product.title}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">{t("summary.none")}</span>
                    )}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between border-t pt-4">
                  <dt className="text-muted-foreground">{t("summary.total")}</dt>
                  <dd className="text-2xl font-bold tabular-nums">
                    {(pkg?.price ?? 0).toLocaleString()}
                    <span className="ms-1 text-sm font-medium">{t("package.currency")}</span>
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      )}

      <AdRequestsList requests={requests} />
    </div>
  );
}

function Step({
  index,
  title,
  done,
  active,
  last,
  children,
}: {
  index: number;
  title: string;
  done: boolean;
  active: boolean;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="relative flex gap-4">
      {/* Rail connecting the step markers. */}
      {!last && (
        <span
          aria-hidden
          className={cn(
            "absolute start-4 top-10 bottom-[-2rem] w-px -translate-x-1/2 rtl:translate-x-1/2",
            done ? "bg-primary" : "bg-border"
          )}
        />
      )}
      <span
        className={cn(
          "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
          done
            ? "bg-primary text-primary-foreground"
            : active
              ? "border-2 border-primary bg-background text-primary"
              : "border bg-muted text-muted-foreground"
        )}
      >
        {done ? <Check className="size-4" aria-hidden /> : index}
      </span>
      <div className="min-w-0 flex-1 space-y-4 pt-1">
        <h2 className={cn("text-lg font-bold", !active && "text-muted-foreground")}>{title}</h2>
        {children}
      </div>
    </li>
  );
}
