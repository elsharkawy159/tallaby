import Link from 'next/link'
import { Check } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { Button } from '@workspace/ui/components/button'

import { DynamicBreadcrumb } from '@/components/layout/dynamic-breadcrumb'
import { cn } from '@/lib/utils'
import { SellCta } from './sell-cta'
import { SellFaq } from './sell-faq.client'
import { SellHandoffBoard } from './sell-handoff-board.client'
import { REQUIREMENT_KEYS, SELL_SERVICES, SELL_STEPS } from './sell.lib'

export async function SellPageContent() {
  const t = await getTranslations('pages.sell')

  return (
    <div className="flex min-h-screen flex-col">
      {/* <DynamicBreadcrumb customLabels={{ sell: t('breadcrumb') }} /> */}

      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute -end-24 -top-24 h-80 w-80 rounded-full border-[48px] border-accent/25"
        />
        <div className="container relative py-14 md:py-20 lg:py-24">
          <h1 className="max-w-4xl text-balance text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            {t('heroTitle')}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-primary-foreground/85 md:text-xl">
            {t('heroDescription')}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <SellCta
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            />
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href="#services">{t('heroSecondaryCta')}</Link>
            </Button>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm md:text-base">
            {(['heroFact1', 'heroFact2', 'heroFact3'] as const).map((key) => (
              <li key={key} className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="services" className="scroll-mt-24 py-16 md:py-24">
        <div className="container grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:gap-14">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="text-3xl font-bold md:text-4xl">{t('board.title')}</h2>
            <p className="mt-4 max-w-md text-muted-foreground">{t('board.description')}</p>
          </div>
          <SellHandoffBoard />
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 bg-muted/50 py-16 md:py-24">
        <div className="container">
          <h2 className="text-3xl font-bold md:text-4xl">{t('stepsTitle')}</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {SELL_STEPS.map((step, index) => (
              <li key={step.titleKey} className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  {index < SELL_STEPS.length - 1 && (
                    <span aria-hidden className="hidden h-px flex-1 bg-primary/25 lg:block" />
                  )}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{t(step.titleKey)}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground md:text-base">
                  {t(step.descriptionKey)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">{t('requirementsTitle')}</h2>
            <ul className="mt-6 space-y-4">
              {REQUIREMENT_KEYS.map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
                  </span>
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">{t('faqTitle')}</h2>
            <div className="mt-4">
              <SellFaq />
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16 md:pb-24">
        <div className="container">
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 overflow-hidden rounded-[2rem] bg-primary p-8 text-primary-foreground sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:p-12 lg:p-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -start-24 h-72 w-72 rounded-full border-[48px] border-accent/20"
            />

            <div className="relative">
              <h2 className="text-balance text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
                {t('finalCtaTitle')}
              </h2>
              <p className="mt-4 max-w-md text-lg text-primary-foreground/85">
                {t('finalCtaDescription')}
              </p>
              <SellCta
                size="lg"
                className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90"
              />
            </div>

            {/* The five services as a stack of parcels, echoing the handoff board. */}
            <div aria-hidden className="relative hidden justify-center sm:flex">
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                {SELL_SERVICES.map((service, index) => {
                  const Icon = service.icon
                  const parcel = FINAL_CTA_PARCELS[index]
                  return (
                    <span
                      key={service.id}
                      className={cn(
                        'flex h-16 w-16 items-center justify-center rounded-2xl border shadow-lg shadow-black/10 md:h-20 md:w-20 lg:h-24 lg:w-24',
                        parcel?.highlight
                          ? 'border-accent bg-accent text-accent-foreground'
                          : 'border-primary-foreground/15 bg-primary-foreground/10 text-primary-foreground',
                        parcel?.className,
                      )}
                    >
                      <Icon className="h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9" />
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// Loose, hand-stacked tilt for the final CTA parcels (3 on top, 2 offset
// below). Kept here because it's purely presentational.
const FINAL_CTA_PARCELS: { className: string; highlight?: boolean }[] = [
  { className: '-rotate-6' },
  { className: 'rotate-3 -translate-y-2', highlight: true },
  { className: '-rotate-2' },
  { className: 'rotate-6 translate-x-1/2 rtl:-translate-x-1/2' },
  { className: '-rotate-3 translate-x-1/2 rtl:-translate-x-1/2' },
]
