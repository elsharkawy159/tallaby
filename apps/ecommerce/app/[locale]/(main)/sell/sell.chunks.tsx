import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { getTranslations } from 'next-intl/server'

import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'

import { DynamicBreadcrumb } from '@/components/layout/dynamic-breadcrumb'
import { SellCta } from './sell-cta'
import { SellFaq } from './sell-faq.client'
import { SellSectionNav } from './sell-section-nav.client'
import {
  CHECKLIST_ITEMS,
  DASHBOARD_FEATURES,
  FULFILLMENT_FEATURES,
  GROWTH_FEATURES,
  INTRODUCTION_FEATURES,
  LISTING_STEPS,
  PRODUCT_PAGE_PARTS,
  REQUIREMENTS_ITEMS,
} from './sell.lib'

interface SellPageContentProps {
  user: User | null
}

export async function SellPageContent({ user }: SellPageContentProps) {
  const t = await getTranslations('pages.sell')

  return (
    <div className="min-h-screen flex flex-col">
      <DynamicBreadcrumb customLabels={{ sell: t('breadcrumb') }} />

      <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-12 md:py-16 lg:py-20">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-start">
              <Badge className="bg-accent text-black mb-4">{t('heroBadge')}</Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                {t('heroTitle')}
                <span className="block text-accent">{t('heroTitleAccent')}</span>
              </h1>
              <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto lg:mx-0 text-white/90">
                {t('heroDescription')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <SellCta user={user} size="lg" className="hover:bg-accent/90" />
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="border-white text-white hover:bg-white hover:text-primary bg-transparent"
                >
                  <Link href="#introduction">{t('learnMore')}</Link>
                </Button>
              </div>
            </div>
            <div className="relative order-first lg:order-last">
              <Image
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop"
                alt={t('heroImageAlt')}
                width={600}
                height={400}
                className="rounded-lg shadow-2xl w-full h-auto"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 lg:gap-12">
          <aside className="hidden lg:block">
            <SellSectionNav />
          </aside>

          <div className="space-y-16 lg:space-y-20">
            <section id="introduction" className="scroll-mt-24">
              <SectionHeader title={t('introductionTitle')} description={t('introductionDescription')} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {INTRODUCTION_FEATURES.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <Card key={feature.titleKey}>
                      <CardHeader>
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{t(feature.titleKey)}</CardTitle>
                        <CardDescription>{t(feature.descriptionKey)}</CardDescription>
                      </CardHeader>
                    </Card>
                  )
                })}
              </div>
            </section>

            <section id="before-you-start" className="scroll-mt-24 rounded-2xl bg-muted/50 p-6 md:p-10">
              <SectionHeader title={t('beforeYouStartTitle')} description={t('beforeYouStartDescription')} />
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('requirementsTitle')}</CardTitle>
                    <CardDescription>{t('requirementsDescription')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {REQUIREMENTS_ITEMS.map((item) => (
                        <li key={item.key} className="flex items-start gap-3 text-sm">
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                          <span>{t(item.key)}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>{t('pricingTitle')}</CardTitle>
                    <CardDescription>{t('pricingDescription')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border bg-background p-4">
                      <p className="text-2xl font-bold text-primary">{t('pricingPlanName')}</p>
                      <p className="text-sm text-muted-foreground mt-1">{t('pricingPlanDescription')}</p>
                      <ul className="mt-4 space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                          {t('pricingFeature1')}
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                          {t('pricingFeature2')}
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                          {t('pricingFeature3')}
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="mt-8 flex justify-center">
                <SellCta user={user} />
              </div>
              <div className="mt-10">
                <h3 className="text-lg font-semibold mb-4">{t('faqTitle')}</h3>
                <SellFaq />
              </div>
            </section>

            <section id="seller-dashboard" className="scroll-mt-24">
              <SectionHeader title={t('dashboardTitle')} description={t('dashboardDescription')} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {DASHBOARD_FEATURES.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <Card key={feature.titleKey}>
                      <CardHeader>
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{t(feature.titleKey)}</CardTitle>
                        <CardDescription>{t(feature.descriptionKey)}</CardDescription>
                      </CardHeader>
                    </Card>
                  )
                })}
              </div>
            </section>

            <section id="listing-products" className="scroll-mt-24 rounded-2xl bg-muted/50 p-6 md:p-10">
              <SectionHeader title={t('listingTitle')} description={t('listingDescription')} />
              <ol className="mt-8 space-y-4">
                {LISTING_STEPS.map((step, index) => (
                  <li key={step.key} className="flex gap-4 rounded-lg border bg-background p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    <p className="text-sm md:text-base pt-1">{t(step.key)}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section id="product-page" className="scroll-mt-24">
              <SectionHeader title={t('productPageTitle')} description={t('productPageDescription')} />
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="rounded-xl border bg-muted/30 p-6 space-y-4">
                  <div className="aspect-square rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm">
                    {t('productMockImage')}
                  </div>
                  <div className="h-6 w-3/4 rounded bg-muted" />
                  <div className="h-8 w-1/3 rounded bg-primary/20" />
                  <div className="h-20 rounded bg-muted" />
                </div>
                <div className="space-y-4">
                  {PRODUCT_PAGE_PARTS.map((part) => (
                    <div key={part.number} className="flex gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-black">
                        {part.number}
                      </span>
                      <div>
                        <p className="font-medium">{t(part.titleKey)}</p>
                        <p className="text-sm text-muted-foreground">{t(part.descriptionKey)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="fulfillment" className="scroll-mt-24 rounded-2xl bg-muted/50 p-6 md:p-10">
              <SectionHeader title={t('fulfillmentTitle')} description={t('fulfillmentDescription')} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {FULFILLMENT_FEATURES.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <Card key={feature.titleKey}>
                      <CardHeader>
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{t(feature.titleKey)}</CardTitle>
                        <CardDescription>{t(feature.descriptionKey)}</CardDescription>
                      </CardHeader>
                    </Card>
                  )
                })}
              </div>
            </section>

            <section id="after-sale" className="scroll-mt-24">
              <SectionHeader title={t('afterSaleTitle')} description={t('afterSaleDescription')} />
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('afterSaleOrdersTitle')}</CardTitle>
                    <CardDescription>{t('afterSaleOrdersDescription')}</CardDescription>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>{t('afterSaleReviewsTitle')}</CardTitle>
                    <CardDescription>{t('afterSaleReviewsDescription')}</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </section>

            <section id="growth" className="scroll-mt-24 rounded-2xl bg-muted/50 p-6 md:p-10">
              <SectionHeader title={t('growthTitle')} description={t('growthDescription')} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {GROWTH_FEATURES.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <Card key={feature.titleKey}>
                      <CardHeader>
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{t(feature.titleKey)}</CardTitle>
                        <CardDescription>{t(feature.descriptionKey)}</CardDescription>
                      </CardHeader>
                    </Card>
                  )
                })}
              </div>
            </section>

            <section id="checklist" className="scroll-mt-24">
              <SectionHeader title={t('checklistTitle')} description={t('checklistDescription')} />
              <ul className="mt-8 space-y-3">
                {CHECKLIST_ITEMS.map((item, index) => (
                  <li
                    key={item.key}
                    className="flex items-start gap-3 rounded-lg border p-4 bg-background"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span className="text-sm md:text-base">{t(item.key)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>

      <section id="final-cta" className="bg-gradient-to-br from-primary to-primary/80 text-white py-16 md:py-20">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('finalCtaTitle')}</h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">{t('finalCtaDescription')}</p>
          <div className="flex justify-center">
            <SellCta user={user} size="lg" className="bg-accent text-black hover:bg-accent/90" />
          </div>
        </div>
      </section>
    </div>
  )
}

function SectionHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl md:text-3xl font-bold mb-3">{title}</h2>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
